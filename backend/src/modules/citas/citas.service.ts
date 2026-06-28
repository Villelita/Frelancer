import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CitaStatus } from '@prisma/client';
import Stripe = require('stripe');

@Injectable()
export class CitasService {
  private stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    // Inicializar Stripe con la clave secreta
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  }

  /**
   * Obtiene el estado de pago y reserva del paciente.
   */
  async getStatus(pacienteProfileId: string, sessionId?: string) {
    // 1. Sincronizar síncronamente con Stripe si hay un sessionId en la petición
    if (sessionId) {
      try {
        const existingCita = await this.prisma.cita.findFirst({
          where: { pagoId: sessionId },
        });

        if (!existingCita) {
          const paciente = await this.prisma.pacienteProfile.findUnique({
            where: { id: pacienteProfileId },
            select: { id: true, nutriologoId: true },
          });

          if (paciente) {
            const session = await this.stripe.checkout.sessions.retrieve(sessionId);
            if (
              session &&
              session.payment_status === 'paid' &&
              session.client_reference_id === pacienteProfileId
            ) {
              const metadata = session.metadata || {};
              const fechaHora = metadata.fechaHora ? new Date(metadata.fechaHora) : new Date();
              const modalidad = metadata.modalidad || 'VIRTUAL';
              const notas = metadata.notas || '';

              await this.prisma.cita.create({
                data: {
                  pacienteId: paciente.id,
                  nutriologoId: paciente.nutriologoId,
                  fechaHora,
                  estado: CitaStatus.CONFIRMADA,
                  monto: 990.00,
                  pagoId: session.id,
                  modalidad,
                  notas: `Cita agendada por el paciente via Stripe Checkout. ${notas}`.trim(),
                },
              });
              console.log(`[Stripe Sync Success] Cita CONFIRMADA creada de forma síncrona para paciente ID: ${pacienteProfileId}`);
            }
          }
        }
      } catch (err: any) {
        console.error(`[Stripe Sync Error] Error al sincronizar sesión ${sessionId}: ${err.message}`);
      }
    }

    const citas = await this.prisma.cita.findMany({
      where: { pacienteId: pacienteProfileId },
      orderBy: { createdAt: 'desc' },
    });

    if (citas.length === 0) {
      return { paid: false, booked: false, citaId: null, modalidad: null };
    }

    // Si tiene al menos una cita que está PAGADA o CONFIRMADA
    const paidCita = citas.find(c => c.estado === CitaStatus.PAGADA || c.estado === CitaStatus.CONFIRMADA);
    
    if (!paidCita) {
      return { paid: false, booked: false, citaId: null, modalidad: null };
    }

    // Si la cita tiene la nota de placeholder, significa que pagó pero no ha agendado su fecha real
    const isPlaceholder = paidCita.notas?.includes('Pago inicial realizado via') && paidCita.notas?.includes('Pendiente de agendar');

    return {
      paid: true,
      booked: !isPlaceholder,
      citaId: paidCita.id,
      fechaHora: paidCita.fechaHora,
      modalidad: paidCita.modalidad,
    };
  }

  /**
   * Crea una sesión de cobro en Stripe Checkout para el paciente.
   */
  async createStripeSession(
    pacienteProfileId: string,
    fechaHoraStr: string,
    modalidad: string,
    notas?: string
  ) {
    // 1. Validar que el paciente exista
    const paciente = await this.prisma.pacienteProfile.findUnique({
      where: { id: pacienteProfileId },
      select: { id: true, nombre: true, user: { select: { email: true } } },
    });

    if (!paciente) {
      throw new NotFoundException('Perfil de paciente no encontrado.');
    }

    // Validar fecha y hora
    const fechaHora = new Date(fechaHoraStr);
    if (isNaN(fechaHora.getTime())) {
      throw new BadRequestException('Fecha y hora de cita inválidas.');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    // 2. Crear sesión de Stripe Checkout (se omite payment_method_types para habilitar Dynamic Payment Methods)
    const session = await this.stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: 'Consulta Nutricional Inicial + Acceso a Portal',
              description: 'Incluye expediente clínico digital, agenda de tu cita de valoración y plan alimenticio interactivo.',
            },
            unit_amount: 99000, // $990.00 MXN en centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: paciente.user.email,
      client_reference_id: pacienteProfileId, // ID del inquilino paciente para relacionarlo en el webhook
      metadata: {
        fechaHora: fechaHora.toISOString(),
        modalidad,
        notas: notas || '',
      },
      success_url: `${frontendUrl}/dashboard/patient?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/checkout`,
    });

    return {
      url: session.url,
    };
  }

  /**
   * Procesa el Webhook de Stripe de forma segura validando la firma criptográfica.
   */
  async handleStripeWebhook(signature: string, rawBody: Buffer) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      console.error(`[Stripe Webhook Error] ${err.message}`);
      throw new BadRequestException(`Firma de webhook de Stripe inválida: ${err.message}`);
    }

    console.log(`[Stripe Webhook] Recibido evento: ${event.type}`);

    // Procesar evento de Checkout Exitoso
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const pacienteProfileId = session.client_reference_id;

      if (!pacienteProfileId) {
        console.error('[Stripe Webhook Error] client_reference_id no provisto en la sesión.');
        return { received: true };
      }

      // Evitar duplicación si la cita ya fue creada síncronamente en el redirect
      const existingCita = await this.prisma.cita.findFirst({
        where: { pagoId: session.id },
      });

      if (existingCita) {
        console.log(`[Stripe Webhook] La cita para la sesión de pago ${session.id} ya existe (sincronizada previamente).`);
        return { received: true };
      }

      // Buscar paciente para obtener su nutriólogo asignado
      const paciente = await this.prisma.pacienteProfile.findUnique({
        where: { id: pacienteProfileId },
        select: { id: true, nutriologoId: true },
      });

      if (!paciente) {
        console.error(`[Stripe Webhook Error] Paciente con ID ${pacienteProfileId} no existe.`);
        return { received: true };
      }

      // Leer datos de cita de los metadatos de la sesión
      const metadata = session.metadata || {};
      const fechaHora = metadata.fechaHora ? new Date(metadata.fechaHora) : new Date();
      const modalidad = metadata.modalidad || 'VIRTUAL';
      const notas = metadata.notas || '';

      // Crear la cita confirmada en Supabase
      await this.prisma.cita.create({
        data: {
          pacienteId: paciente.id,
          nutriologoId: paciente.nutriologoId,
          fechaHora,
          estado: CitaStatus.CONFIRMADA,
          monto: 990.00,
          pagoId: session.id, // ID de la sesión de Stripe
          modalidad,
          notas: `Cita agendada por el paciente via Stripe Checkout. ${notas}`.trim(),
        },
      });

      console.log(`[Stripe Webhook Success] Pago procesado y cita CONFIRMADA creada para paciente ID: ${pacienteProfileId}`);
    }

    return { received: true };
  }

  /**
   * Confirma la fecha y hora seleccionada para la cita pagada.
   */
  async confirmBooking(pacienteProfileId: string, fechaHoraStr: string, modalidad?: string, notas?: string) {
    const status = await this.getStatus(pacienteProfileId);

    if (!status.paid || !status.citaId) {
      throw new BadRequestException('Debe realizar el pago antes de agendar una cita.');
    }

    const fechaHora = new Date(fechaHoraStr);
    if (isNaN(fechaHora.getTime())) {
      throw new BadRequestException('Fecha y hora inválidas.');
    }

    // Actualizar la cita placeholder con la fecha real del paciente
    const citaActualizada = await this.prisma.cita.update({
      where: { id: status.citaId },
      data: {
        fechaHora,
        estado: CitaStatus.CONFIRMADA,
        modalidad: modalidad || 'VIRTUAL',
        notas: `Cita agendada por el paciente via Stripe Checkout. ${notas || ''}`.trim(),
      },
    });

    return {
      success: true,
      message: 'Cita programada con éxito en el calendario.',
      cita: citaActualizada,
    };
  }

  /**
   * Cancela la cita de valoración activa de un paciente.
   */
  async cancelBooking(pacienteProfileId: string) {
    const status = await this.getStatus(pacienteProfileId);

    if (!status.paid || !status.citaId) {
      throw new BadRequestException('No tiene ninguna cita activa para cancelar.');
    }

    // Actualizar la cita a estado CANCELADA
    const citaActualizada = await this.prisma.cita.update({
      where: { id: status.citaId },
      data: {
        estado: CitaStatus.CANCELADA,
        notas: 'Cita cancelada por el paciente.',
      },
    });

    return {
      success: true,
      message: 'Cita cancelada con éxito.',
      cita: citaActualizada,
    };
  }
}
