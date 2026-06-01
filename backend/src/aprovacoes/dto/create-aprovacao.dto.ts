import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateAprovacaoDto {
  @IsNotEmpty({ message: 'O campo PON é obrigatório' })
  @IsString()
  pon: string;

  @IsNotEmpty({ message: 'A atividade é obrigatória' })
  @IsString()
  atividade: string;

  @IsNotEmpty()
  dentro_time_slot: string;

  @IsNotEmpty({ message: 'A matrícula do técnico é obrigatória' })
  @IsString()
  matricula_tecnico: string;

  @IsNotEmpty()
  tecnico: string;

  @IsNotEmpty()
  time_slot: string;

  @IsNotEmpty()
  motivo: string;

  @IsOptional()
  @IsString()
  observacao?: string;

  @IsNotEmpty()
  data_execucao: string;
}
