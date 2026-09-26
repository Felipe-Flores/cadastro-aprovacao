import { IsOptional, IsString, IsIn } from 'class-validator';

export class FiltroFilaDto {
  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsString()
  solicitante?: string; // Nome ou matrícula (busca parcial)

  // A fila nunca exibe concluídos; eles são encontrados pela busca por ID
  @IsOptional()
  @IsIn(['Não Iniciado', 'Iniciado', 'Pendente'], { message: 'Status inválido para a fila' })
  status?: string;
}
