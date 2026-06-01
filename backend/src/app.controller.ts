import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users/users.service';

@Controller()
export class AppController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getHealth() {
    return { status: 'ok', message: 'API de Aprovação Online 🚀' };
  }

  @Get('setup-admin')
  async setup() {
    const users = await this.usersService.findAll();
    if (users.length > 0) {
      return { message: 'O sistema já possui usuários cadastrados.', total: users.length };
    }

    await this.usersService.create({
      matricula: 'ADMIN',
      nome: 'ADMINISTRADOR INICIAL',
      empresa: 'SISTEMA',
      senha: '1234',
      cargo: 'gestor-master',
    });

    return { message: 'Usuário ADMIN criado com sucesso! Agora você já pode logar com a senha 1234.' };
  }
}