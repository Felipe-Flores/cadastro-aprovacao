import { IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'A matrícula é obrigatória' })
  matricula: string;
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  senha: string;
}