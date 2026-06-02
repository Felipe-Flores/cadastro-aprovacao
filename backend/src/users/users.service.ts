import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(dadosDoUsuario: Partial<User>) {
    // Normalizar matrícula e nome para maiúsculo
    if (dadosDoUsuario.matricula) dadosDoUsuario.matricula = dadosDoUsuario.matricula.toUpperCase();
    if (dadosDoUsuario.nome) dadosDoUsuario.nome = dadosDoUsuario.nome.toUpperCase();

    // 1. Verificar se a matrícula já existe para evitar erro 500 do banco
    if (dadosDoUsuario.matricula) {
      const usuarioExistente = await this.findByMatricula(dadosDoUsuario.matricula);
      if (usuarioExistente) {
        throw new BadRequestException('Já existe um usuário cadastrado com esta matrícula.');
      }
    }

    if (dadosDoUsuario.senha) {
      // 2. Validação de tamanho mínimo de senha
      if (dadosDoUsuario.senha.length < 4) {
        throw new BadRequestException('A senha deve ter no mínimo 4 caracteres.');
      }
      // Criptografa ao criar
      const salt = await bcrypt.genSalt();
      dadosDoUsuario.senha = await bcrypt.hash(dadosDoUsuario.senha, salt);
    }
    const novoUsuario = this.usersRepository.create(dadosDoUsuario);
    return await this.usersRepository.save(novoUsuario);
  }

  findAll() {
    return this.usersRepository.find();
  }

  async findByMatricula(matricula: string) {
    return await this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.matricula) = LOWER(:matricula)', { matricula })
      .getOne();
  }

  async update(id: number, dados: Partial<User>) {
    // Normalizar matrícula e nome para maiúsculo
    if (dados.matricula) dados.matricula = dados.matricula.toUpperCase();
    if (dados.nome) dados.nome = dados.nome.toUpperCase();

    if (dados.senha) {
      if (dados.senha.length < 4) {
        throw new BadRequestException('A senha deve ter no mínimo 4 caracteres.');
      }
      // Criptografa ao alterar a senha
      const salt = await bcrypt.genSalt();
      dados.senha = await bcrypt.hash(dados.senha, salt);
    }
    await this.usersRepository.update(id, dados);
    return this.usersRepository.findOneBy({ id });
  }

  async remove(id: number) {
    return await this.usersRepository.delete(id);
  }
}