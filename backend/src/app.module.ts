import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { UsersModule } from './users/users.module';
import { Aprovacao } from './aprovacoes/aprovacao.entity';
import { AprovacoesModule } from './aprovacoes/aprovacoes.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // Configura o acesso às variáveis de ambiente (.env)
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Configura a conexão com o PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        entities: [User, Aprovacao],
        synchronize: true,
        logging: true,
        ssl: true,
        extra: {
          ssl: {
            rejectUnauthorized: false,
          },
        },
      }),
    }),
    // Importa os módulos de negócio
    UsersModule,
    AprovacoesModule,
    AuthModule,
  ],
})
export class AppModule {}