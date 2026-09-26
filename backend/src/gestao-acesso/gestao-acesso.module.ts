import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicitacaoAcesso } from './solicitacao-acesso.entity';
import { SolicitacaoAcessoHistorico } from './solicitacao-acesso-historico.entity';
import { GestaoAcessoService } from './gestao-acesso.service';
import { GestaoAcessoController } from './gestao-acesso.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SolicitacaoAcesso, SolicitacaoAcessoHistorico])],
  providers: [GestaoAcessoService],
  controllers: [GestaoAcessoController],
})
export class GestaoAcessoModule {}
