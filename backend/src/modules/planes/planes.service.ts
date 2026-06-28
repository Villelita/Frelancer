import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PlanesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea o actualiza el plan alimenticio activo de un paciente.
   */
  async createPlan(nutriologoId: string, body: any) {
    const { pacienteId, nombre, contenidoJson, pdfUrl, fechaInicio, fechaFin } = body;

    if (!pacienteId || !nombre || !contenidoJson) {
      throw new BadRequestException('Faltan campos requeridos (pacienteId, nombre, contenidoJson).');
    }

    // 1. Validar que el paciente exista
    const paciente = await this.prisma.pacienteProfile.findUnique({
      where: { id: pacienteId },
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado.');
    }

    // 2. Validar que pertenezca al nutriólogo autenticado
    if (paciente.nutriologoId !== nutriologoId) {
      throw new ForbiddenException('No tienes permisos para asignar planes a este paciente.');
    }

    // 3. Desactivar planes activos anteriores del paciente
    await this.prisma.planAlimenticio.updateMany({
      where: { pacienteId, activo: true },
      data: { activo: false },
    });

    // 4. Crear el nuevo plan alimenticio activo
    return this.prisma.planAlimenticio.create({
      data: {
        pacienteId,
        nutriologoId,
        nombre,
        contenidoJson,
        pdfUrl: pdfUrl || null,
        activo: true,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : new Date(),
        fechaFin: fechaFin ? new Date(fechaFin) : null,
      },
    });
  }

  /**
   * Obtiene el plan alimenticio activo de un paciente específico.
   */
  async getActivePlanForPaciente(pacienteId: string) {
    return this.prisma.planAlimenticio.findFirst({
      where: { pacienteId, activo: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
