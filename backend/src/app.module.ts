import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { UsersModule } from './users/users.module';
import { Aprovacao } from './aprovacoes/aprovacao.entity';
import { AprovacoesModule } from './aprovacoes/aprovacoes.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';

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
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        const databaseUrl = configService.get<string>('DATABASE_URL') ?? '';
        const useSsl =
          databaseUrl.length > 0 &&
          !databaseUrl.includes('localhost') &&
          !databaseUrl.includes('127.0.0.1');

        return {
          type: 'postgres' as const,
          url: databaseUrl,
          autoLoadEntities: true,
          entities: [User, Aprovacao],
          synchronize: !isProduction,
          logging: !isProduction,
          ...(useSsl
            ? {
                ssl: true,
                extra: { ssl: { rejectUnauthorized: false } },
              }
            : {}),
        };
      },
    }),
    // Importa os módulos de negócio
    UsersModule,
    AprovacoesModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}