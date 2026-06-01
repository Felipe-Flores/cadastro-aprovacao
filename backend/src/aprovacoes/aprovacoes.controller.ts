import { Controller, Post, Body, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { AprovacoesService } from './aprovacoes.service';
import { CreateAprovacaoDto } from './dto/create-aprovacao.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
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

@Controller('aprovacoes')
export class AprovacoesController {
  constructor(private readonly aprovacoesService: AprovacoesService) {}

  @Post()
  @UseGuards(JwtAuthGuard) // Protege para sabermos quem está criando
  criar(@Body() dados: CreateAprovacaoDto, @Request() req: RequestWithUser) {
    // Passamos os dados do formulário + o objeto do usuário vindo do Token
    return this.aprovacoesService.criar(dados, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  listarTodas(@Request() req: RequestWithUser) {
    return this.aprovacoesService.listarTodas(req.user);
  }

  @Patch(':id/status')
  @Roles('gestor-master', 'gestor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  atualizarStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto, @Request() req: RequestWithUser) {
    return this.aprovacoesService.atualizarStatus(+id, updateStatusDto.status, req.user);
  }
}