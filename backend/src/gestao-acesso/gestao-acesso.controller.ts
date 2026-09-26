import { Controller, Post, Body, Get, Patch, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { GestaoAcessoService } from './gestao-acesso.service';
import { CreateSolicitacaoAcessoDto } from './dto/create-solicitacao-acesso.dto';
import { TratativaDto } from './dto/tratativa.dto';
import { FiltroFilaDto } from './dto/filtro-fila.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Interface para facilitar o uso do usuário logado vindo do JWT
interface RequestWithUser extends Request {
  user: {
    matricula: string;
    nome: string;
    cargo: string;
    empresa: string;
    userId: number;
  };
}

// Rotas sem @Roles ficam liberadas para qualquer usuário logado
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gestao-acesso')
export class GestaoAcessoController {
  constructor(private readonly gestaoAcessoService: GestaoAcessoService) {}

  @Post()
  criar(@Body() dados: CreateSolicitacaoAcessoDto, @Request() req: RequestWithUser) {
    return this.gestaoAcessoService.criar(dados, req.user);
  }

  @Get('minhas')
  listarMinhas(@Request() req: RequestWithUser) {
    return this.gestaoAcessoService.listarMinhas(req.user);
  }

  @Get('fila')
  @Roles('gestor-master')
  listarFila(@Query() filtros: FiltroFilaDto) {
    return this.gestaoAcessoService.listarFila(filtros);
  }

  @Get('busca')
  @Roles('gestor-master')
  buscar(@Query('termo') termo: string) {
    return this.gestaoAcessoService.buscar(termo);
  }

  // Declarada depois de /minhas, /fila e /busca para não capturar essas rotas
  @Get(':id')
  detalhar(@Param('id', ParseIntPipe) id: number, @Request() req: RequestWithUser) {
    return this.gestaoAcessoService.detalhar(id, req.user);
  }

  @Patch(':id/iniciar')
  @Roles('gestor-master')
  iniciar(@Param('id', ParseIntPipe) id: number, @Request() req: RequestWithUser) {
    return this.gestaoAcessoService.iniciar(id, req.user);
  }

  @Patch(':id/tratativa')
  @Roles('gestor-master')
  tratar(@Param('id', ParseIntPipe) id: number, @Body() dados: TratativaDto, @Request() req: RequestWithUser) {
    return this.gestaoAcessoService.tratar(id, dados, req.user);
  }
}
