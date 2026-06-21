import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando base de datos en Supabase con contraseñas encriptadas...');

  // 1. Limpiar base de datos para pruebas limpias
  await prisma.planAlimenticio.deleteMany();
  await prisma.consultaMedica.deleteMany();
  await prisma.cita.deleteMany();
  await prisma.pacienteProfile.deleteMany();
  await prisma.nutriologoProfile.deleteMany();
  await prisma.user.deleteMany();

  // Encriptar contraseña para la siembra
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 2. Crear Nutriólogo
  const userNutri = await prisma.user.create({
    data: {
      id: 'mock-user-nutri-uuid',
      email: 'alejandro.silva@nutrition.com',
      passwordHash,
      role: 'ADMIN_NUTRIOLOGO',
    },
  });

  const nutriProfile = await prisma.nutriologoProfile.create({
    data: {
      id: 'mock-nutriologo-uuid',
      userId: userNutri.id,
      nombre: 'Dr. Alejandro Silva',
      cedulaProf: '12345678',
      especialidades: ['Nutrición Deportiva', 'Recomposición Corporal'],
      stripeAccountId: 'acct_mock123',
    },
  });

  // 3. Crear Paciente
  const userPaciente = await prisma.user.create({
    data: {
      id: 'mock-user-paciente-uuid',
      email: 'valeria.alarcon@gmail.com',
      passwordHash,
      role: 'USER_PACIENTE',
    },
  });

  const pacienteProfile = await prisma.pacienteProfile.create({
    data: {
      id: 'mock-paciente-uuid',
      userId: userPaciente.id,
      nombre: 'Valeria Alarcón',
      fechaNacimiento: new Date('1998-05-15'),
      telefono: '5512345678',
      genero: 'Femenino',
      nutriologoId: nutriProfile.id,
    },
  });

  // 4. Crear Consultas iniciales para tener historial
  const c1 = await prisma.consultaMedica.create({
    data: {
      id: 'consulta-mock-1',
      pacienteId: pacienteProfile.id,
      nutriologoId: nutriProfile.id,
      fecha: new Date('2026-05-10T10:00:00Z'),
      peso: 65.3,
      porcentajeGrasa: 24.5,
      porcentajeMusculo: 37.0,
      porcentajeAgua: 51.8,
      pliegueAbdominal: 18,
      notas: 'Consulta inicial. Se establece meta de recomposición corporal.',
    },
  });

  const c2 = await prisma.consultaMedica.create({
    data: {
      id: 'consulta-mock-2',
      pacienteId: pacienteProfile.id,
      nutriologoId: nutriProfile.id,
      fecha: new Date('2026-05-24T10:00:00Z'),
      peso: 64.4,
      porcentajeGrasa: 23.8,
      porcentajeMusculo: 37.5,
      porcentajeAgua: 52.1,
      pliegueAbdominal: 17,
      notas: 'Buen apego al plan. Reducción de pliegue abdominal.',
    },
  });

  const c3 = await prisma.consultaMedica.create({
    data: {
      id: 'consulta-mock-3',
      pacienteId: pacienteProfile.id,
      nutriologoId: nutriProfile.id,
      fecha: new Date('2026-06-07T10:00:00Z'),
      peso: 63.3,
      porcentajeGrasa: 22.9,
      porcentajeMusculo: 37.9,
      porcentajeAgua: 52.8,
      pliegueAbdominal: 15,
      notas: 'Continúa progresando. Aumento de masa muscular.',
    },
  });

  // 5. Crear Plan Alimenticio Activo
  await prisma.planAlimenticio.create({
    data: {
      id: 'plan-mock-1',
      pacienteId: pacienteProfile.id,
      nutriologoId: nutriProfile.id,
      consultaId: c3.id,
      nombre: 'Plan de Recomposición Corporal - Fase Aumento Magro',
      contenidoJson: {},
      activo: true,
      fechaInicio: new Date('2026-06-07T00:00:00Z'),
      fechaFin: new Date('2026-07-07T00:00:00Z'),
    },
  });

  console.log('✅ Base de datos sembrada con éxito en Supabase.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
