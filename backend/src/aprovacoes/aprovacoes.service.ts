import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
    const novaAprovacao = this.aprovacoesRepository.create(dados);
    
    novaAprovacao.matricula_solicitante = usuarioLogado.matricula;
    novaAprovacao.nome_solicitante = usuarioLogado.nome;
    novaAprovacao.empresa = usuarioLogado.empresa;
    
    return await this.aprovacoesRepository.save(novaAprovacao);
  }

  async listarTodas(matriculaFiltro?: string) {
    // Se houver filtro de matrícula (Visão do Solicitante), mostra tudo o que ele pediu (incluindo concluídas)
    if (matriculaFiltro) {
      return await this.aprovacoesRepository.find({
        where: { matricula_solicitante: matriculaFiltro },
      });
    }
    // Para a fila de aprovação (Gestores), mostrar apenas o que NÃO está concluído
    return await this.aprovacoesRepository.find({
      where: { status: Not('CONCLUIDA') }
    });
  }

  async atualizarStatus(id: number, status: string, user: any) {
    const aprovacao = await this.aprovacoesRepository.findOneBy({ id });
    if (!aprovacao) {
      throw new NotFoundException(`Pedido de aprovação com ID ${id} não encontrado`);
    }

    // Nova Regra: Se estiver fora do slot ('Não'), apenas gestor-master pode aprovar/reprovar
    if (aprovacao.dentro_time_slot === 'Não' && user.cargo !== 'gestor-master') {
      throw new ForbiddenException('Apenas gestores master podem aprovar atividades fora do time slot.');
    }

    aprovacao.status = status;
    return await this.aprovacoesRepository.save(aprovacao);
  }
}
