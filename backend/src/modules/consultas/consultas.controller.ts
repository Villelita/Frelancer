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
import { ConsultasService } from './consultas.service';
import { CreateConsultaDto } from './dto/create-consulta.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('api/consultas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsultasController {
  constructor(private readonly consultasService: ConsultasService) {}

  /**
   * Registra una nueva consulta médica con métricas antropométricas.
   * Restringido exclusivamente al nutriólogo administrador (ADMIN_NUTRIOLOGO).
   */
  @Post()
  @Roles(Role.ADMIN_NUTRIOLOGO)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @GetUser('nutriologoProfileId') nutriologoProfileId: string,
    @Body() createConsultaDto: CreateConsultaDto
  ) {
    return this.consultasService.create(nutriologoProfileId, createConsultaDto);
  }

  /**
   * Obtiene todo el historial de consultas de un paciente específico.
   * Permitido para el ADMIN_NUTRIOLOGO (su doctor) o el USER_PACIENTE (el propio paciente).
   */
  @Get('paciente/:pacienteId')
  @Roles(Role.ADMIN_NUTRIOLOGO, Role.USER_PACIENTE)
  async findAllForPaciente(
    @GetUser() user: any,
    @Param('pacienteId') pacienteId: string
  ) {
    return this.consultasService.findAllForPaciente(user, pacienteId);
  }

  /**
   * Obtiene el detalle de una consulta clínica específica.
   */
  @Get(':id')
  @Roles(Role.ADMIN_NUTRIOLOGO, Role.USER_PACIENTE)
  async findOne(
    @GetUser() user: any,
    @Param('id') id: string
  ) {
    return this.consultasService.findOne(user, id);
  }
}
