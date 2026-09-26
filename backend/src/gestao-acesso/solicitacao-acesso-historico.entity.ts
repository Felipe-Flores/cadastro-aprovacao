import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SolicitacaoAcesso } from './solicitacao-acesso.entity';

@Entity('solicitacoes_acesso_historico')
export class SolicitacaoAcessoHistorico {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => SolicitacaoAcesso, (solicitacao) => solicitacao.historico, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'solicitacao_id' })
  solicitacao: SolicitacaoAcesso;

  @Column()
  solicitacao_id: number;

  @Column()
  acao: string; // Criação, Início, Atualização, Pendente, Conclusão

  @Column({ nullable: true })
  status_anterior: string;

  @Column()
  status_novo: string;

  @Column({ type: 'text', nullable: true })
  descricao: string; // Resumo do que mudou (tags, chamado, observação)

  // Quem realizou a ação
  @Column()
  matricula_usuario: string;

  @Column()
  nome_usuario: string;

  @CreateDateColumn()
  data: Date;
}
