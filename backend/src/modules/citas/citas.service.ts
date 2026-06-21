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
  async getStatus(pacienteProfileId: string) {
    const citas = await this.prisma.cita.findMany({
      where: { pacienteId: pacienteProfileId },
      orderBy: { createdAt: 'desc' },
    });

    if (citas.length === 0) {
      return { paid: false, booked: false, citaId: null };
    }

    // Si tiene al menos una cita que está PAGADA o CONFIRMADA
    const paidCita = citas.find(c => c.estado === CitaStatus.PAGADA || c.estado === CitaStatus.CONFIRMADA);
    
    if (!paidCita) {
      return { paid: false, booked: false, citaId: null };
    }

    // Si la cita tiene la nota de placeholder, significa que pagó pero no ha agendado su fecha real
    const isPlaceholder = paidCita.notas?.includes('Pago inicial realizado via') && paidCita.notas?.includes('Pendiente de agendar');

    return {
      paid: true,
      booked: !isPlaceholder,
      citaId: paidCita.id,
      fechaHora: paidCita.fechaHora,
    };
  }

  /**
   * Crea una sesión de cobro en Stripe Checkout para el paciente.
   */
  async createStripeSession(pacienteProfileId: string) {
    // 1. Validar que el paciente exista
    const paciente = await this.prisma.pacienteProfile.findUnique({
      where: { id: pacienteProfileId },
      select: { id: true, nombre: true, user: { select: { email: true } } },
    });

    if (!paciente) {
      throw new NotFoundException('Perfil de paciente no encontrado.');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    // 2. Crear sesión de Stripe Checkout
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
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
      success_url: `${frontendUrl}/dashboard/patient/book`,
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

      // Buscar paciente para obtener su nutriólogo asignado
      const paciente = await this.prisma.pacienteProfile.findUnique({
        where: { id: pacienteProfileId },
        select: { id: true, nutriologoId: true },
      });

      if (!paciente) {
        console.error(`[Stripe Webhook Error] Paciente con ID ${pacienteProfileId} no existe.`);
        return { received: true };
      }

      // Crear la cita pagada (placeholder) en Supabase
      await this.prisma.cita.create({
        data: {
          pacienteId: paciente.id,
          nutriologoId: paciente.nutriologoId,
          fechaHora: new Date(), // Fecha actual como placeholder
          estado: CitaStatus.PAGADA,
          monto: 990.00,
          pagoId: session.id, // ID de la sesión de Stripe
          notas: 'Pago inicial realizado via Stripe Checkout. Pendiente de agendar.',
        },
      });

      console.log(`[Stripe Webhook Success] Pago procesado y acceso liberado para paciente ID: ${pacienteProfileId}`);
    }

    return { received: true };
  }

  /**
   * Confirma la fecha y hora seleccionada para la cita pagada.
   */
  async confirmBooking(pacienteProfileId: string, fechaHoraStr: string, notas?: string) {
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
        notas: `Cita agendada por el paciente via Stripe Checkout. ${notas || ''}`.trim(),
      },
    });

    return {
      success: true,
      message: 'Cita programada con éxito en el calendario.',
      cita: citaActualizada,
    };
  }
}
