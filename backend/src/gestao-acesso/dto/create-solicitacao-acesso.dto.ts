import { IsNotEmpty, IsString, IsOptional, IsIn, IsEmail, MaxLength, Matches, ValidateIf } from 'class-validator';
import { TIPOS_SOLICITACAO, ESTADOS } from '../gestao-acesso.constants';

export class CreateSolicitacaoAcessoDto {
  @IsIn(TIPOS_SOLICITACAO, { message: 'O tipo deve ser acesso ou reset_senha' })
  tipo: string;

  @IsNotEmpty({ message: 'A matrícula é obrigatória' })
  @IsString()
  @MaxLength(20, { message: 'A matrícula deve ter no máximo 20 caracteres' })
  matricula: string;

  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @IsString()
  @MaxLength(100, { message: 'O nome deve ter no máximo 100 caracteres' })
  nome: string;

  @IsNotEmpty({ message: 'A empresa é obrigatória' })
  @IsString()
  @MaxLength(50, { message: 'A empresa deve ter no máximo 50 caracteres' })
  empresa: string;

  @IsIn(ESTADOS, { message: `O estado deve ser um de: ${ESTADOS.join(', ')}` })
  estado: string;

  // O vínculo cidade x estado é validado no service
  @IsNotEmpty({ message: 'A cidade é obrigatória' })
  @IsString()
  cidade: string;

  // Campos exclusivos da Solicitação de Acesso
  @ValidateIf((o) => o.tipo === 'acesso' && !!o.email)
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  @MaxLength(100, { message: 'O e-mail deve ter no máximo 100 caracteres' })
  email?: string;

  @ValidateIf((o) => o.tipo === 'acesso')
  @IsNotEmpty({ message: 'O telefone é obrigatório' })
  @Matches(/^\d+$/, { message: 'O telefone deve conter apenas números' })
  @MaxLength(20, { message: 'O telefone deve ter no máximo 20 dígitos' })
  telefone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150, { message: 'A observação deve ter no máximo 150 caracteres' })
  observacao?: string;
}
