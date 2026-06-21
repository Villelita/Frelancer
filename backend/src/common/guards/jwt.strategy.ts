import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-key-nutritionists', // Llave secreta para codificar tokens
    });
  }

  /**
   * Valida e inyecta la información del token decodificado en `req.user`
   *
   * @param payload Payload del JWT decodificado
   */
  async validate(payload: any) {
    return { 
      userId: payload.sub, 
      email: payload.email, 
      role: payload.role, 
      // Si el rol es nutriólogo, el profileId corresponde al inquilino (tenant)
      nutriologoProfileId: payload.role === 'ADMIN_NUTRIOLOGO' ? payload.profileId : null,
      pacienteProfileId: payload.role === 'USER_PACIENTE' ? payload.profileId : null
    };
  }
}
