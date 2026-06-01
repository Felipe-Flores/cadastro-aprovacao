import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Aprovacao } from './aprovacao.entity';
import { AprovacoesService } from './aprovacoes.service';
import { AprovacoesController } from './aprovacoes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Aprovacao])],
  providers: [AprovacoesService],
  controllers: [AprovacoesController],
  exports: [AprovacoesService], // Exportamos para caso outros módulos precisem
})
export class AprovacoesModule {}