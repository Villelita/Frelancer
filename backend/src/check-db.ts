import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- CITAS ---');
  const citas = await prisma.cita.findMany({
    orderBy: { createdAt: 'desc' },
  });
  console.dir(citas, { depth: null });

  console.log('--- PACIENTES ---');
  const pacientes = await prisma.pacienteProfile.findMany({
    include: {
      user: {
        select: { email: true }
      }
    }
  });
  console.dir(pacientes, { depth: null });
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
