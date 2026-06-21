import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConsultasModule } from './modules/consultas/consultas.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [ConsultasModule, AuthModule],
  controllers: [AppController],
})
export class AppModule {}
