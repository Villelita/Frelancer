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
// Asumiendo la existencia de JwtAuthGuard y RolesGuard en el proyecto para autenticación y autorización
// import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
// import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('api/consultas')
// @UseGuards(JwtAuthGuard, RolesGuard) // Descomentar al integrar la autenticación del backend
export class ConsultasController {
  constructor(private readonly consultasService: ConsultasService) {}

  /**
   * Registra una nueva consulta médica con métricas antropométricas.
   * Restringido a usuarios con el rol ADMIN_NUTRIOLOGO.
   *
   * @param user El usuario autenticado (se extrae el ID de perfil de nutriólogo)
   * @param createConsultaDto Datos de la consulta
   */
  @Post()
  @Roles(Role.ADMIN_NUTRIOLOGO)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @GetUser('nutriologoProfileId') nutriologoProfileId: string, // Extraído del JWT Payload
    @Body() createConsultaDto: CreateConsultaDto
  ) {
    // Si no se usa el Decorator en un mock rápido, pasamos un ID quemado para pruebas
    const profileId = nutriologoProfileId || 'mock-nutriologo-uuid';
    return this.consultasService.create(profileId, createConsultaDto);
  }

  /**
   * Obtiene todo el historial de consultas de un paciente específico.
   *
   * @param user El usuario autenticado
   * @param pacienteId ID del paciente
   */
  @Get('paciente/:pacienteId')
  @Roles(Role.ADMIN_NUTRIOLOGO)
  async findAllForPaciente(
    @GetUser('nutriologoProfileId') nutriologoProfileId: string,
    @Param('pacienteId') pacienteId: string
  ) {
    const profileId = nutriologoProfileId || 'mock-nutriologo-uuid';
    return this.consultasService.findAllForPaciente(profileId, pacienteId);
  }

  /**
   * Obtiene el detalle de una consulta clínica por su ID.
   *
   * @param user El usuario autenticado
   * @param id ID de la consulta
   */
  @Get(':id')
  @Roles(Role.ADMIN_NUTRIOLOGO)
  async findOne(
    @GetUser('nutriologoProfileId') nutriologoProfileId: string,
    @Param('id') id: string
  ) {
    const profileId = nutriologoProfileId || 'mock-nutriologo-uuid';
    return this.consultasService.findOne(profileId, id);
  }
}
