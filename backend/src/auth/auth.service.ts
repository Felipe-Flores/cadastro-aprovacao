import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(matricula: string, senhaPassada: string) {
    const user = await this.usersService.findByMatricula(matricula.trim());

    if (!user) {
      throw new UnauthorizedException('Matrícula ou senha incorretos');
    }

    const senhaValida = await bcrypt.compare(senhaPassada, user.senha);

    if (!senhaValida) {
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