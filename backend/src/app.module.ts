import { Module } from '@nestjs/common';
import { ConsultasModule } from './modules/consultas/consultas.module';

@Module({
  imports: [ConsultasModule],
})
export class AppModule {}
