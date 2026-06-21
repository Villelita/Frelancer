import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  MinLength, 
  IsEnum, 
  IsOptional, 
  IsUUID, 
  IsArray 
} from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsEmail({}, { message: 'El correo electrónico debe ser válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
  email: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password: string;

  @IsString({ message: 'El nombre completo es obligatorio.' })
  @IsNotEmpty({ message: 'El nombre completo es obligatorio.' })
  nombre: string;

  @IsEnum(Role, { message: 'El rol debe ser ADMIN_NUTRIOLOGO o USER_PACIENTE.' })
  role: Role;

  // Para cuando se registra un paciente y se quiere asociar a un nutriólogo
  @IsOptional()
  @IsUUID('4', { message: 'El ID del nutriólogo debe ser un UUID válido.' })
  nutriologoId?: string;

  // Para cuando se registra un nutriólogo
  @IsOptional()
  @IsString()
  cedulaProf?: string;

  @IsOptional()
  @IsArray({ message: 'Las especialidades deben ser un arreglo de textos.' })
  especialidades?: string[];
}
