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

// Mapeamento de Fusos Horários por UF (Brasil) para validação de segurança no servidor
const UF_TIMEZONES: Record<string, string> = {
  'AC': 'America/Rio_Branco',
  'AM': 'America/Manaus',
  'MS': 'America/Campo_Grande',
  'MT': 'America/Cuiaba',
  'RO': 'America/Porto_Velho',
  'RR': 'America/Boa_Vista',
};

function calcularDentroSlot(slot: string, uf: string, detalheAtividade?: string): string {
  if (!slot || !uf) return 'Não';
  if (slot === 'SLA') return 'Não';
  try {
    const timezone = UF_TIMEZONES[uf] || 'America/Sao_Paulo';
    const now = new Date();

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false
    });
    const p: any = {};
    formatter.formatToParts(now).forEach(part => p[part.type] = part.value);
    const nowInTZ = new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);

    if (detalheAtividade === 'Defeito') {
      const [startStr, endStr] = slot.split('-');
      if (!startStr || !endStr) return 'Não';
      const [startH, startM] = startStr.split(':').map(Number);
      const [endH, endM] = endStr.split(':').map(Number);

      const slotStart = new Date(nowInTZ);
      slotStart.setHours(startH, startM, 0, 0);
      const slotEnd = new Date(nowInTZ);
      slotEnd.setHours(endH, endM, 0, 0);

      if (nowInTZ >= slotStart && nowInTZ < slotEnd) return 'Sim';
      return 'Não';
    }

    const [startTimeStr] = slot.split(' as ');
    const [hours, minutes] = startTimeStr.split(':').map(Number);

    const slotDate = new Date(nowInTZ);
    slotDate.setHours(hours, minutes, 0, 0);
    const diffMinutes = Math.abs(nowInTZ.getTime() - slotDate.getTime()) / (1000 * 60);
    return diffMinutes <= 30 ? 'Sim' : 'Não';
  } catch {
    return 'Não';
  }
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
    
    // Força o cálculo por regra no servidor, garantindo que o status não seja burlado
    novaAprovacao.dentro_time_slot = calcularDentroSlot(dados.time_slot, dados.uf, dados.detalhe_atividade);
    
    novaAprovacao.matricula_solicitante = usuarioLogado.matricula;
    novaAprovacao.nome_solicitante = usuarioLogado.nome;
    novaAprovacao.empresa = usuarioLogado.empresa;
    
    return await this.aprovacoesRepository.save(novaAprovacao);
  }

  async listarTodas(user: ActiveUser) {
    const query = this.aprovacoesRepository.createQueryBuilder('aprovacao');

    if (user.cargo === 'solicitante') {
      // Solicitante vê todas as suas próprias solicitações (histórico completo)
      query.where('aprovacao.matricula_solicitante = :matricula', { matricula: user.matricula });
    } else {
      // Gestores e Gestores Master recebem todos os registros para permitir a exportação completa.
      // O filtro para exibir apenas 'Pendentes' na tela será aplicado no Frontend.
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
    aprovacao.nome_aprovador = user.nome;
    aprovacao.matricula_aprovador = user.matricula;

    return await this.aprovacoesRepository.save(aprovacao);
  }
}
