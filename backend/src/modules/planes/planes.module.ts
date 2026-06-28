import { Module } from '@nestjs/common';
import { PlanesService } from './planes.service';
import { PlanesController } from './planes.controller';
import { PrismaService } from '../../common/prisma/prisma.service';

@Module({
  providers: [PlanesService, PrismaService],
  controllers: [PlanesController],
  exports: [PlanesService],
})
export class PlanesModule {}
