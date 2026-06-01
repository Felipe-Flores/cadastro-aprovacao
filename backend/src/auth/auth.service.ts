import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(matricula: string, senhaPassada: string) {
    console.log(`[AUTH] Tentativa de login para matrícula: ${matricula}`);
    const user = await this.usersService.findByMatricula(matricula.trim());

    if (!user) {
      console.log(`[AUTH] Resultado: Usuário ${matricula} NÃO encontrado no banco Neon.`);
      throw new UnauthorizedException('Matrícula ou senha incorretos');
    }

    console.log(`[AUTH] Usuário encontrado: ${user.nome}. Validando senha...`);
    const senhaValida = await bcrypt.compare(senhaPassada, user.senha);

    if (!senhaValida) {
      console.log(`[AUTH] Login falhou: Senha incorreta para o usuário ${matricula}.`);
      throw new UnauthorizedException('Matrícula ou senha incorretos');
    }

    const payload = { 
      sub: user.id, 
      matricula: user.matricula, 
      cargo: user.cargo,
      nome: user.nome,
      empresa: user.empresa 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      nome: user.nome,
      cargo: user.cargo,
    };
  }
}