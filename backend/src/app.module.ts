import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConsultasModule } from './modules/consultas/consultas.module';
import { AuthModule } from './modules/auth/auth.module';
import { CitasModule } from './modules/citas/citas.module';
import { PlanesModule } from './modules/planes/planes.module';

@Module({
  imports: [ConsultasModule, AuthModule, CitasModule, PlanesModule],
  controllers: [AppController],
})
export class AppModule {}
