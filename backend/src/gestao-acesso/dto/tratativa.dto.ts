import { IsOptional, IsString, IsIn, IsArray, MaxLength } from 'class-validator';

export class TratativaDto {
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'O ID do chamado deve ter no máximo 50 caracteres' })
  id_chamado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'O responsável deve ter no máximo 100 caracteres' })
  responsavel_aprovacao?: string;

  @IsOptional()
  @IsArray({ message: 'Os sistemas devem ser enviados como lista' })
  @IsString({ each: true })
  @MaxLength(100, { each: true, message: 'Cada sistema deve ter no máximo 100 caracteres' })
  sistemas_tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(150, { message: 'O parecer deve ter no máximo 150 caracteres' })
  observacao_tratativa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150, { message: 'A observação final deve ter no máximo 150 caracteres' })
  observacao_final?: string;

  // Sem status: apenas atualiza os campos da tratativa
  @IsOptional()
  @IsIn(['Pendente', 'Concluído'], { message: 'O status deve ser Pendente ou Concluído' })
  status?: string;
}
