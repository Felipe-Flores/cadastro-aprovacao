import { Controller, Post, Body, Get, Patch, Delete, Param, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('usuarios')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  criar(@Body() dados: Partial<User>) {
    return this.usersService.create(dados);
  }

  @Get()
  listarTodos() {
    return this.usersService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dados: Partial<User>) {
    return this.usersService.update(+id, dados);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}