import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { SolicitacaoAcessoHistorico } from './solicitacao-acesso-historico.entity';

@Entity('solicitacoes_acesso')
export class SolicitacaoAcesso {
  @PrimaryGeneratedColumn()
  id: number; // Exibido na tela com 4 dígitos (ex: 0001)

  @Column()
  tipo: string; // "acesso" ou "reset_senha"

  // Dados informados pelo solicitante no formulário
  @Column({ length: 20 })
  matricula: string;

  @Column({ length: 100 })
  nome: string;

  @Column({ length: 50 })
  empresa: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  telefone: string; // Apenas dígitos; obrigatório só no tipo "acesso"

  @Column({ length: 2 })
  estado: string;

  @Column({ length: 50 })
  cidade: string;

  @Column({ length: 150, nullable: true })
  observacao: string; // Sistemas que o solicitante deseja acessar

  @Column({ default: 'Não Iniciado' })
  status: string; // Não Iniciado, Iniciado, Pendente, Concluído

  // Quem abriu a solicitação (vem do Token)
  @Column()
  matricula_solicitante: string;

  @Column()
  nome_solicitante: string;

  // Tratativa do Gestor Master
  @Column({ length: 50, nullable: true })
  id_chamado: string;

  @Column({ length: 100, nullable: true })
  responsavel_aprovacao: string;

  @Column({ type: 'simple-json', nullable: true })
  sistemas_tags: string[]; // Ex: ["Sistema: Portal de Material", "Toa Técnico"]

  @Column({ length: 150, nullable: true })
  observacao_tratativa: string; // Parecer do reset de senha / andamento do acesso

  @Column({ length: 150, nullable: true })
  observacao_final: string; // Obrigatória ao concluir uma solicitação de acesso

  @Column({ nullable: true })
  matricula_responsavel: string; // Gestor Master que tratou

  @Column({ nullable: true })
  nome_responsavel: string;

  @CreateDateColumn()
  data_criacao: Date;

  @UpdateDateColumn()
  data_modificacao: Date;

  @Column({ type: 'timestamp', nullable: true })
  data_conclusao: Date;

  @OneToMany(() => SolicitacaoAcessoHistorico, (historico) => historico.solicitacao)
  historico: SolicitacaoAcessoHistorico[];
}
