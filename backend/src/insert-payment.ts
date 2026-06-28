import { PrismaClient, CitaStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const session_id = 'cs_test_a1s2yuidcRFLEp9uYu8WOWJzQMr6WA7gozXFjRvioXb9TaB1sVXdY5UAaK';
  const pacienteId = '75f4af34-4ea7-48c3-8127-2af355267e0f';
  const nutriologoId = 'd3b07384-d113-49cd-a5d6-89d02dcf8d80';

  const existing = await prisma.cita.findFirst({
    where: { pagoId: session_id }
  });

  if (existing) {
    console.log('Payment already registered for Alvaro:', existing);
    return;
  }

  const newCita = await prisma.cita.create({
    data: {
      pacienteId,
      nutriologoId,
      fechaHora: new Date(),
      estado: CitaStatus.PAGADA,
      monto: 990.00,
      pagoId: session_id,
      notas: 'Pago inicial realizado via Stripe Checkout (Manual Sync). Pendiente de agendar.',
    }
  });

  console.log('Successfully registered payment for Alvaro:', newCita);
}

main().catch(console.error).finally(() => prisma.$disconnect());
