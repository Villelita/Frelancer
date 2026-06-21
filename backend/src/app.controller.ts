import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return '🍎 Backend del Portal de Nutriólogos - Activo y Conectado a Supabase';
  }
}
