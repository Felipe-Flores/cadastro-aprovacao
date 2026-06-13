import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: (() => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET não está definido. Configure a variável de ambiente antes de iniciar o servidor.');
        }
        return secret;
      })(),
    });
  }

  async validate(payload: any) {
    return { 
      userId: payload.sub, 
      matricula: payload.matricula, 
      cargo: payload.cargo,
      nome: payload.nome,
      empresa: payload.empresa 
    };
  }
}