import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateConsultaDto } from './dto/create-consulta.dto';

@Injectable()
export class ConsultasService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra una nueva consulta médica, validando que el paciente pertenezca al nutriólogo
   * y calcula el progreso antropométrico comparativo con la última consulta registrada.
   */
  async create(nutriologoId: string, dto: CreateConsultaDto) {
    if (!nutriologoId) {
      throw new ForbiddenException('Se requiere una cuenta de nutriólogo válida para registrar consultas.');
    }

    // 1. Validar que el paciente exista y pertenezca al nutriólogo autenticado
    const paciente = await this.prisma.pacienteProfile.findUnique({
      where: { id: dto.pacienteId },
      select: { id: true, nutriologoId: true, nombre: true }
    });

    if (!paciente) {
      throw new NotFoundException(`El paciente con ID ${dto.pacienteId} no existe.`);
    }

    if (paciente.nutriologoId !== nutriologoId) {
      throw new ForbiddenException('No tienes permisos para registrar consultas para este paciente.');
    }

    // 2. Obtener la última consulta médica registrada para el paciente (si existe)
    const ultimaConsulta = await this.prisma.consultaMedica.findFirst({
      where: { pacienteId: dto.pacienteId },
      orderBy: { fecha: 'desc' },
      select: {
        peso: true,
        porcentajeGrasa: true,
        porcentajeMusculo: true,
        fecha: true
      }
    });

    // 3. Crear la nueva consulta en la Base de Datos
    const nuevaConsulta = await this.prisma.consultaMedica.create({
      data: {
        pacienteId: dto.pacienteId,
        nutriologoId,
        peso: dto.peso,
        porcentajeGrasa: dto.porcentajeGrasa,
        porcentajeMusculo: dto.porcentajeMusculo,
        porcentajeAgua: dto.porcentajeAgua,
        pliegueTricipital: dto.pliegueTricipital,
        pliegueSubescapular: dto.pliegueSubescapular,
        pliegueSuprailiaco: dto.pliegueSuprailiaco,
        pliegueAbdominal: dto.pliegueAbdominal,
        plieguesJson: dto.plieguesJson || {},
        notas: dto.notas
      }
    });

    // 4. Calcular el progreso comparativo
    let comparativa = {
      pesoDiff: 0,
      grasaDiff: 0,
      musculoDiff: 0,
      mensajeProgreso: 'Primera consulta registrada para este paciente.'
    };

    if (ultimaConsulta) {
      comparativa.pesoDiff = parseFloat((dto.peso - ultimaConsulta.peso).toFixed(2));
      comparativa.grasaDiff = parseFloat((dto.porcentajeGrasa - ultimaConsulta.porcentajeGrasa).toFixed(2));
      comparativa.musculoDiff = parseFloat((dto.porcentajeMusculo - ultimaConsulta.porcentajeMusculo).toFixed(2));

      const pesoSigno = comparativa.pesoDiff > 0 ? '+' : '';
      const grasaSigno = comparativa.grasaDiff > 0 ? '+' : '';
      const musculoSigno = comparativa.musculoDiff > 0 ? '+' : '';

      comparativa.mensajeProgreso = `Comparado con la consulta del ${ultimaConsulta.fecha.toLocaleDateString()}: Peso (${pesoSigno}${comparativa.pesoDiff} kg), Grasa (${grasaSigno}${comparativa.grasaDiff}%), Músculo (${musculoSigno}${comparativa.musculoDiff}%).`;
    }

    return {
      success: true,
      data: nuevaConsulta,
      analiticaProgreso: comparativa
    };
  }

  /**
   * Obtiene el historial clínico y antropométrico de un paciente específico.
   * Filtra por paciente (si el rol es paciente) o por nutriólogo (si el rol es doctor) para garantizar aislamiento.
   */
  async findAllForPaciente(user: any, pacienteId: string) {
    if (user.role === 'USER_PACIENTE') {
      // Un paciente solo puede leer sus propias consultas
      if (user.pacienteProfileId !== pacienteId) {
        throw new ForbiddenException('No tienes permisos para visualizar los datos de otro paciente.');
      }
    } else if (user.role === 'ADMIN_NUTRIOLOGO') {
      // Un nutriólogo solo puede leer consultas de pacientes asignados a él
      const paciente = await this.prisma.pacienteProfile.findUnique({
        where: { id: pacienteId },
        select: { id: true, nutriologoId: true }
      });

      if (!paciente) {
        throw new NotFoundException(`El paciente con ID ${pacienteId} no existe.`);
      }

      if (paciente.nutriologoId !== user.nutriologoProfileId) {
        throw new ForbiddenException('No tienes permisos para visualizar los datos de este paciente.');
      }
    } else {
      throw new ForbiddenException('Rol de usuario no autorizado.');
    }

    return this.prisma.consultaMedica.findMany({
      where: { pacienteId },
      orderBy: { fecha: 'desc' }
    });
  }

  /**
   * Obtiene los detalles de una consulta médica específica, validando permisos.
   */
  async findOne(user: any, id: string) {
    const consulta = await this.prisma.consultaMedica.findUnique({
      where: { id },
      include: { 
        paciente: { select: { nombre: true, nutriologoId: true } } 
      }
    });

    if (!consulta) {
      throw new NotFoundException(`La consulta con ID ${id} no existe.`);
    }

    if (user.role === 'USER_PACIENTE') {
      // Un paciente solo puede ver si la consulta le pertenece
      if (consulta.pacienteId !== user.pacienteProfileId) {
        throw new ForbiddenException('No tienes permisos para ver esta consulta.');
      }
    } else if (user.role === 'ADMIN_NUTRIOLOGO') {
      // Un nutriólogo solo puede ver si la consulta es de uno de sus pacientes
      if (consulta.paciente.nutriologoId !== user.nutriologoProfileId) {
        throw new ForbiddenException('No tienes permisos para ver esta consulta.');
      }
    } else {
      throw new ForbiddenException('Rol de usuario no autorizado.');
    }

    return consulta;
  }
}
