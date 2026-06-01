import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateStatusDto {
  @IsNotEmpty({ message: 'O status não pode ser vazio' })
  @IsIn(['Aprovado', 'Reprovado', 'Pendente'], {
    message: 'O status deve ser Aprovado, Reprovado ou Pendente',
  })
  status: string;
}