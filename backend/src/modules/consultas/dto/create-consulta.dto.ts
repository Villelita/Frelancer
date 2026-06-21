import { 
  IsNotEmpty, 
  IsUUID, 
  IsNumber, 
  Min, 
  Max, 
  IsOptional, 
  IsString, 
  IsObject 
} from 'class-validator';

export class CreateConsultaDto {
  @IsNotEmpty({ message: 'El ID del paciente es obligatorio.' })
  @IsUUID('4', { message: 'El ID del paciente debe ser un UUID válido.' })
  pacienteId: string;

  @IsNotEmpty({ message: 'El peso es obligatorio.' })
  @IsNumber({}, { message: 'El peso debe ser un valor numérico.' })
  @Min(10, { message: 'El peso mínimo registrado debe ser de 10 kg.' })
  @Max(500, { message: 'El peso máximo registrado debe ser de 500 kg.' })
  peso: number;

  @IsNotEmpty({ message: 'El porcentaje de grasa es obligatorio.' })
  @IsNumber({}, { message: 'El porcentaje de grasa debe ser un valor numérico.' })
  @Min(2, { message: 'El porcentaje de grasa mínimo es 2%.' })
  @Max(70, { message: 'El porcentaje de grasa máximo es 70%.' })
  porcentajeGrasa: number;

  @IsNotEmpty({ message: 'El porcentaje de músculo es obligatorio.' })
  @IsNumber({}, { message: 'El porcentaje de músculo debe ser un valor numérico.' })
  @Min(10, { message: 'El porcentaje de músculo mínimo es 10%.' })
  @Max(90, { message: 'El porcentaje de músculo máximo es 90%.' })
  porcentajeMusculo: number;

  @IsOptional()
  @IsNumber({}, { message: 'El porcentaje de agua debe ser un valor numérico.' })
  @Min(10, { message: 'El porcentaje de agua mínimo es 10%.' })
  @Max(90, { message: 'El porcentaje de agua máximo es 90%.' })
  porcentajeAgua?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El pliegue tricipital debe ser numérico.' })
  @Min(0)
  @Max(100)
  pliegueTricipital?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El pliegue subescapular debe ser numérico.' })
  @Min(0)
  @Max(100)
  pliegueSubescapular?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El pliegue suprailiaco debe ser numérico.' })
  @Min(0)
  @Max(100)
  pliegueSuprailiaco?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El pliegue abdominal debe ser numérico.' })
  @Min(0)
  @Max(100)
  pliegueAbdominal?: number;

  @IsOptional()
  @IsObject({ message: 'Los pliegues adicionales deben estar estructurados en formato JSON.' })
  plieguesJson?: Record<string, any>;

  @IsOptional()
  @IsString({ message: 'Las notas clínicas deben ser de tipo texto.' })
  notas?: string;
}
