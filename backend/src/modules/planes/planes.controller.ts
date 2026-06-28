import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseGuards, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { PlanesService } from './planes.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('api/planes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlanesController {
  constructor(private readonly planesService: PlanesService) {}

  /**
   * Crea un nuevo plan alimenticio para un paciente.
   */
  @Post()
  @Roles(Role.ADMIN_NUTRIOLOGO)
  @HttpCode(HttpStatus.CREATED)
  async createPlan(
    @GetUser('nutriologoProfileId') nutriologoProfileId: string,
    @Body() body: any,
  ) {
    return this.planesService.createPlan(nutriologoProfileId, body);
  }

  /**
   * Obtiene el plan activo para un paciente.
   */
  @Get('paciente/:pacienteId')
  @HttpCode(HttpStatus.OK)
  async getActivePlan(@Param('pacienteId') pacienteId: string) {
    return this.planesService.getActivePlanForPaciente(pacienteId);
  }
}
