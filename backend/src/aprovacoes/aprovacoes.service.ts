import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Aprovacao } from './aprovacao.entity';
import { CreateAprovacaoDto } from './dto/create-aprovacao.dto';

interface ActiveUser {
  matricula: string;
  nome: string;
  cargo: string;
  empresa: string;
  userId: number;
}

@Injectable()
export class AprovacoesService {
  constructor(
    @InjectRepository(Aprovacao)
    private aprovacoesRepository: Repository<Aprovacao>,
  ) {}

  async criar(dados: CreateAprovacaoDto, usuarioLogado: ActiveUser) {
    // Validação de data futura no servidor
    const hoje = new Date().toISOString().split('T')[0];
    if (dados.data_execucao > hoje) {
      throw new BadRequestException('A data de execução não pode ser uma data futura.');
    }

    const novaAprovacao = this.aprovacoesRepository.create(dados);
    
    novaAprovacao.matricula_solicitante = usuarioLogado.matricula;
    novaAprovacao.nome_solicitante = usuarioLogado.nome;
    novaAprovacao.empresa = usuarioLogado.empresa;
    
    return await this.aprovacoesRepository.save(novaAprovacao);
  }

  async listarTodas(user: ActiveUser) {
    const query = this.aprovacoesRepository.createQueryBuilder('aprovacao');

    switch (user.cargo) {
      case 'solicitante':
        // SEGURANÇA MÁXIMA: O solicitante NUNCA recebe dados de terceiros do banco
        query.where('aprovacao.matricula_solicitante = :matricula', { matricula: user.matricula });
        break;
      case 'gestor':
        // O Gestor padrão vê o que precisa aprovar (Pendente) ou o que ele mesmo criou
        query.where('aprovacao.status = :status', { status: 'Pendente' })
             .orWhere('aprovacao.matricula_solicitante = :matricula', { matricula: user.matricula });
        break;
      case 'gestor-master':
        // O Master pode ver tudo (útil para o seu botão de exportar Excel com histórico completo)
        // Nenhuma restrição de WHERE aplicada aqui
        break;
    }

    return await query.orderBy('aprovacao.data_inserida', 'DESC').getMany();
  }

  async atualizarStatus(id: number, status: string, user: any) {
    const aprovacao = await this.aprovacoesRepository.findOneBy({ id });
    if (!aprovacao) {
      throw new NotFoundException(`Pedido de aprovação com ID ${id} não encontrado`);
    }

    // Segurança: Impede que um solicitante aprove/reprove atividades via API direta
    if (user.cargo === 'solicitante') {
      throw new ForbiddenException('Solicitantes não possuem permissão para alterar o status de atividades.');
    }

    // Nova Regra: Se estiver fora do slot ('Não'), apenas gestor-master pode aprovar/reprovar
    if (aprovacao.dentro_time_slot === 'Não' && user.cargo !== 'gestor-master') {
      throw new ForbiddenException('Apenas gestores master podem aprovar atividades fora do time slot.');
    }

    aprovacao.status = status;
    return await this.aprovacoesRepository.save(aprovacao);
  }
}
