import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConsultasModule } from './modules/consultas/consultas.module';

@Module({
  imports: [ConsultasModule],
  controllers: [AppController],
})
export class AppModule {}
