import { Module } from '@nestjs/common';
import { ConsultasService } from './consultas.service';
import { ConsultasController } from './consultas.controller';
import { PrismaService } from '../../common/prisma/prisma.service';

@Module({
  controllers: [ConsultasController],
  providers: [ConsultasService, PrismaService],
  exports: [ConsultasService],
})
export class ConsultasModule {}
