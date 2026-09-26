import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { SolicitacaoAcesso } from './solicitacao-acesso.entity';
import { SolicitacaoAcessoHistorico } from './solicitacao-acesso-historico.entity';
import { CreateSolicitacaoAcessoDto } from './dto/create-solicitacao-acesso.dto';
import { TratativaDto } from './dto/tratativa.dto';
import { FiltroFilaDto } from './dto/filtro-fila.dto';
import { CIDADES_POR_ESTADO, STATUS_SOLICITACAO } from './gestao-acesso.constants';

interface ActiveUser {
  matricula: string;
  nome: string;
  cargo: string;
  empresa: string;
  userId: number;
}

const { NAO_INICIADO, INICIADO, PENDENTE, CONCLUIDO } = STATUS_SOLICITACAO;

// Remove espaços das pontas e converte para maiúsculo
const normalizar = (valor?: string) => (valor ?? '').trim().toUpperCase();

// Converte string vazia em null para não gravar campos em branco
const vazioParaNull = (valor?: string) => {
  const texto = (valor ?? '').trim();
  return texto.length > 0 ? texto : null;
};

@Injectable()
export class GestaoAcessoService {
  constructor(
    @InjectRepository(SolicitacaoAcesso)
    private solicitacoesRepository: Repository<SolicitacaoAcesso>,
    private dataSource: DataSource,
  ) {}

  async criar(dados: CreateSolicitacaoAcessoDto, usuarioLogado: ActiveUser) {
    // Cidade precisa pertencer ao estado escolhido
    if (!CIDADES_POR_ESTADO[dados.estado]?.includes(dados.cidade)) {
      throw new BadRequestException(`A cidade ${dados.cidade} não pertence ao estado ${dados.estado}.`);
    }

    // Campos montados um a um para que o solicitante não consiga definir status ou tratativa
    const novaSolicitacao = this.solicitacoesRepository.create({
      tipo: dados.tipo,
      matricula: normalizar(dados.matricula),
      nome: normalizar(dados.nome),
      empresa: normalizar(dados.empresa),
      estado: dados.estado,
      cidade: dados.cidade,
      status: NAO_INICIADO,
      matricula_solicitante: usuarioLogado.matricula,
      nome_solicitante: usuarioLogado.nome,
    });

    if (!novaSolicitacao.matricula || !novaSolicitacao.nome || !novaSolicitacao.empresa) {
      throw new BadRequestException('Matrícula, nome e empresa não podem ficar em branco.');
    }

    // Reset de senha não utiliza e-mail, telefone nem observação do solicitante
    if (dados.tipo === 'acesso') {
      novaSolicitacao.email = vazioParaNull(dados.email)?.toLowerCase() as string;
      novaSolicitacao.telefone = (dados.telefone ?? '').replace(/\D/g, '');
      novaSolicitacao.observacao = vazioParaNull(dados.observacao) as string;
    }

    return await this.dataSource.transaction(async (manager) => {
      const salva = await manager.save(novaSolicitacao);
      await this.registrarHistorico(manager, salva, 'Criação', null, NAO_INICIADO, usuarioLogado);
      return salva;
    });
  }

  async listarMinhas(user: ActiveUser) {
    return await this.solicitacoesRepository.find({
      where: { matricula_solicitante: user.matricula },
      order: { data_criacao: 'DESC' },
    });
  }

  async listarFila(filtros: FiltroFilaDto) {
    const query = this.solicitacoesRepository
      .createQueryBuilder('solicitacao')
      .where('solicitacao.status != :concluido', { concluido: CONCLUIDO });

    if (filtros.estado) {
      query.andWhere('solicitacao.estado = :estado', { estado: filtros.estado });
    }
    if (filtros.cidade) {
      query.andWhere('solicitacao.cidade = :cidade', { cidade: filtros.cidade });
    }
    if (filtros.status) {
      query.andWhere('solicitacao.status = :status', { status: filtros.status });
    }
    if (filtros.solicitante?.trim()) {
      query.andWhere(
        '(solicitacao.nome_solicitante ILIKE :solicitante OR solicitacao.matricula_solicitante ILIKE :solicitante OR solicitacao.nome ILIKE :solicitante OR solicitacao.matricula ILIKE :solicitante)',
        { solicitante: `%${filtros.solicitante.trim()}%` },
      );
    }

    // Prioridade: Não Iniciado -> Pendente -> Iniciado; dentro do grupo, as mais antigas primeiro
    return await query
      .addSelect(
        `CASE solicitacao.status WHEN '${NAO_INICIADO}' THEN 0 WHEN '${PENDENTE}' THEN 1 ELSE 2 END`,
        'prioridade',
      )
      .orderBy('prioridade', 'ASC')
      .addOrderBy('solicitacao.data_criacao', 'ASC')
      .getMany();
  }

  async buscar(termo: string) {
    const texto = (termo ?? '').trim();
    if (!texto) {
      throw new BadRequestException('Informe o ID da solicitação ou o número do chamado.');
    }

    const query = this.solicitacoesRepository
      .createQueryBuilder('solicitacao')
      .where('LOWER(solicitacao.id_chamado) = LOWER(:texto)', { texto });

    // Se for numérico, também procura pelo ID da solicitação (ex: "0001" -> 1)
    if (/^\d+$/.test(texto)) {
      query.orWhere('solicitacao.id = :id', { id: Number(texto) });
    }

    return await query.orderBy('solicitacao.data_criacao', 'DESC').getMany();
  }

  async detalhar(id: number, user: ActiveUser) {
    const solicitacao = await this.solicitacoesRepository.findOne({
      where: { id },
      relations: { historico: true },
      order: { historico: { data: 'ASC' } },
    });
    if (!solicitacao) {
      throw new NotFoundException(`Solicitação com ID ${id} não encontrada`);
    }

    // Apenas o dono da solicitação ou um gestor master pode ver os detalhes
    if (user.cargo !== 'gestor-master' && solicitacao.matricula_solicitante !== user.matricula) {
      throw new ForbiddenException('Você não possui permissão para visualizar esta solicitação.');
    }

    return solicitacao;
  }

  async iniciar(id: number, user: ActiveUser) {
    const solicitacao = await this.buscarPorId(id);

    if (solicitacao.status !== NAO_INICIADO) {
      throw new BadRequestException(`Apenas solicitações "${NAO_INICIADO}" podem ser iniciadas.`);
    }

    solicitacao.status = INICIADO;
    solicitacao.matricula_responsavel = user.matricula;
    solicitacao.nome_responsavel = user.nome;

    return await this.dataSource.transaction(async (manager) => {
      const salva = await manager.save(solicitacao);
      await this.registrarHistorico(manager, salva, 'Início', NAO_INICIADO, INICIADO, user);
      return salva;
    });
  }

  async tratar(id: number, dados: TratativaDto, user: ActiveUser) {
    const solicitacao = await this.buscarPorId(id);
    const statusAnterior = solicitacao.status;

    // Regra: concluída não pode ser reaberta nem alterada
    if (statusAnterior === CONCLUIDO) {
      throw new BadRequestException('Solicitação concluída não pode ser reaberta ou alterada.');
    }
    if (statusAnterior === NAO_INICIADO) {
      throw new BadRequestException('Inicie a solicitação antes de registrar a tratativa.');
    }
    if (dados.status === PENDENTE && solicitacao.tipo !== 'acesso') {
      throw new BadRequestException('Apenas solicitações de acesso podem ficar pendentes.');
    }

    // Aplica os campos enviados e guarda o que mudou para o histórico
    const alteracoes: string[] = [];
    const aplicar = (campo: 'id_chamado' | 'responsavel_aprovacao' | 'observacao_tratativa' | 'observacao_final', rotulo: string) => {
      if (dados[campo] === undefined) return;
      const novoValor = vazioParaNull(dados[campo]);
      if (novoValor !== (solicitacao[campo] ?? null)) {
        solicitacao[campo] = novoValor as string;
        alteracoes.push(`${rotulo}: ${novoValor ?? '(removido)'}`);
      }
    };

    aplicar('id_chamado', 'ID do chamado');
    aplicar('responsavel_aprovacao', 'Responsável pela aprovação');
    aplicar('observacao_tratativa', solicitacao.tipo === 'reset_senha' ? 'Parecer' : 'Observação');
    aplicar('observacao_final', 'Observação final');

    if (dados.sistemas_tags !== undefined) {
      // Remove tags vazias e duplicadas
      const tags = [...new Set(dados.sistemas_tags.map((tag) => tag.trim()).filter(Boolean))];
      if (JSON.stringify(tags) !== JSON.stringify(solicitacao.sistemas_tags ?? [])) {
        solicitacao.sistemas_tags = tags;
        alteracoes.push(`Sistemas: ${tags.length ? tags.join(', ') : '(nenhum)'}`);
      }
    }

    if (dados.status === CONCLUIDO) {
      if (solicitacao.tipo === 'acesso' && !solicitacao.observacao_final) {
        throw new BadRequestException('Informe a observação final para concluir a solicitação.');
      }
      if (solicitacao.tipo === 'reset_senha' && !solicitacao.observacao_tratativa) {
        throw new BadRequestException('Informe o parecer para concluir o reset de senha.');
      }
      solicitacao.data_conclusao = new Date();
    }

    const novoStatus = dados.status ?? statusAnterior;
    if (novoStatus === statusAnterior && alteracoes.length === 0) {
      throw new BadRequestException('Nenhuma alteração foi informada.');
    }

    solicitacao.status = novoStatus;
    solicitacao.matricula_responsavel = user.matricula;
    solicitacao.nome_responsavel = user.nome;

    const acao = novoStatus === CONCLUIDO ? 'Conclusão' : novoStatus === PENDENTE && statusAnterior !== PENDENTE ? 'Pendente' : 'Atualização';

    return await this.dataSource.transaction(async (manager) => {
      const salva = await manager.save(solicitacao);
      await this.registrarHistorico(manager, salva, acao, statusAnterior, novoStatus, user, alteracoes.join('; '));
      return salva;
    });
  }

  private async buscarPorId(id: number) {
    const solicitacao = await this.solicitacoesRepository.findOneBy({ id });
    if (!solicitacao) {
      throw new NotFoundException(`Solicitação com ID ${id} não encontrada`);
    }
    return solicitacao;
  }

  private async registrarHistorico(
    manager: EntityManager,
    solicitacao: SolicitacaoAcesso,
    acao: string,
    statusAnterior: string | null,
    statusNovo: string,
    user: ActiveUser,
    descricao?: string,
  ) {
    const historico = manager.create(SolicitacaoAcessoHistorico, {
      solicitacao_id: solicitacao.id,
      acao,
      status_anterior: statusAnterior as string,
      status_novo: statusNovo,
      descricao: descricao || (null as unknown as string),
      matricula_usuario: user.matricula,
      nome_usuario: user.nome,
    });
    await manager.save(historico);
  }
}
