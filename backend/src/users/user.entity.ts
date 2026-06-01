import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  matricula: string;

  @Column()
  nome: string;

  @Column()
  empresa: string;

  @Exclude()
  @Column()
  senha: string;

  @Column({ default: 'solicitante' })
  cargo: string;
}