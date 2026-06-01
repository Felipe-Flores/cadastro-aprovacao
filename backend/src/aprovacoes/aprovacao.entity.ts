import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('aprovacoes')
export class Aprovacao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pon: string;

  @Column()
  atividade: string;

  @Column()
  dentro_time_slot: string; // "Sim" ou "Não"

  @Column()
  nome_solicitante: string;

  @Column({ default: 'SISTEMA' }) // Adiciona um valor padrão para registros antigos
  matricula_solicitante: string; // ID de quem logou e criou o pedido

  @Column()
  empresa: string;

  @Column()
  matricula_tecnico: string;

  @Column()
  tecnico: string;

  @Column()
  time_slot: string; // Ex: "08:30 as 10:30"

  @Column()
  motivo: string;

  @Column({ type: 'text', nullable: true })
  observacao: string;

  @Column({ default: 'Pendente' })
  status: string; // Pendente, Aprovado, Reprovado

  @Column()
  data_execucao: string; // A data que o serviço será feito

  @CreateDateColumn()
  data_inserida: Date; // O banco anota sozinho quando o registro nasce

  @UpdateDateColumn()
  data_modificacao: Date; // O banco anota sozinho quando algo muda
}