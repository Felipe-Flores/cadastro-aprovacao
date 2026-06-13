import { Controller, Get, Headers, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users/users.service';

@Controller()
export class AppController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getHealth() {
    return { status: 'ok', message: 'API de Aprovação Online 🚀' };
  }

  @Get('setup-admin')
  async setup(@Headers('x-setup-secret') secret: string) {
    const setupSecret = this.configService.get<string>('SETUP_ADMIN_SECRET');
    if (!setupSecret || secret !== setupSecret) {
      throw new NotFoundException();
    }

    const users = await this.usersService.findAll();
    if (users.length > 0) {
      return { message: 'O sistema já possui usuários cadastrados.', total: users.length };
    }

    const adminPassword = this.configService.get<string>('SETUP_ADMIN_PASSWORD');
    if (!adminPassword || adminPassword.length < 8) {
      throw new NotFoundException();
    }

    await this.usersService.create({
      matricula: 'ADMIN',
      nome: 'ADMINISTRADOR INICIAL',
      empresa: 'SISTEMA',
      senha: adminPassword,
      cargo: 'gestor-master',
    });

    return { message: 'Usuário ADMIN criado com sucesso. Faça login com a senha definida em SETUP_ADMIN_PASSWORD.' };
  }
}