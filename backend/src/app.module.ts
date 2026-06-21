import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConsultasModule } from './modules/consultas/consultas.module';
import { AuthModule } from './modules/auth/auth.module';
import { CitasModule } from './modules/citas/citas.module';

@Module({
  imports: [ConsultasModule, AuthModule, CitasModule],
  controllers: [AppController],
})
export class AppModule {}
