import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus, Req, Headers, BadRequestException } from '@nestjs/common';
import { CitasService } from './citas.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@Controller('api/citas')
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  /**
   * Obtiene el estado de pago y reserva del paciente logueado.
   */
  @Get('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER_PACIENTE)
  async getStatus(@GetUser('pacienteProfileId') pacienteProfileId: string) {
    return this.citasService.getStatus(pacienteProfileId);
  }

  /**
   * Crea una sesión de checkout de Stripe para iniciar el pago.
   */
  @Post('stripe-checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER_PACIENTE)
  @HttpCode(HttpStatus.OK)
  async createStripeSession(@GetUser('pacienteProfileId') pacienteProfileId: string) {
    return this.citasService.createStripeSession(pacienteProfileId);
  }

  /**
   * Confirma la reserva de fecha y hora para la cita de valoración inicial.
   */
  @Post('book')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER_PACIENTE)
  @HttpCode(HttpStatus.OK)
  async book(
    @GetUser('pacienteProfileId') pacienteProfileId: string,
    @Body() body: { fechaHora: string; notas?: string }
  ) {
    return this.citasService.confirmBooking(pacienteProfileId, body.fechaHora, body.notas);
  }

  /**
   * Endpoint de Webhook público para Stripe. Recibe la notificación de cobro en crudo.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async stripeWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string
  ) {
    if (!signature) {
      throw new BadRequestException('Falta la cabecera stripe-signature.');
    }
    
    // Obtener el buffer rawBody habilitado en main.ts
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('El cuerpo en crudo (rawBody) no está configurado en NestJS.');
    }

    return this.citasService.handleStripeWebhook(signature, rawBody);
  }
}
