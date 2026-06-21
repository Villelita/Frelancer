import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitar la validación global a través del ValidationPipe
  // Esto interceptará las peticiones HTTP y ejecutará los validadores del CreateConsultaDto
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Remueve propiedades del Body no declaradas en el DTO
      transform: true,            // Convierte tipos implícitamente (ej. de string a número si aplica)
      forbidNonWhitelisted: true, // Lanza error si mandan datos no permitidos
    }),
  );

  // Permitir conexiones desde cualquier dominio (CORS) para conectar con el frontend
  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Backend del Portal de Nutriólogos corriendo en: http://localhost:${port}`);
}
bootstrap();
