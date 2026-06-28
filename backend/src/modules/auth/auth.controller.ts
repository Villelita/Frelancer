import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  HttpCode, 
  HttpStatus, 
  UseGuards,
  Param,
  ForbiddenException 
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint público para registrar usuarios nuevos.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Endpoint público para iniciar sesión y obtener el token JWT.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Obtiene la lista de nutriólogos activos. Utilizado en el formulario 
   * de registro del paciente para elegir su nutriólogo.
   */
  @Get('nutriologos')
  async getNutriologos() {
    return this.authService.getNutriologos();
  }

  /**
   * Obtiene la lista de pacientes asociados al nutriólogo autenticado (Multi-tenant).
   */
  @Get('pacientes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN_NUTRIOLOGO)
  async getPacientes(@GetUser('nutriologoProfileId') nutriologoProfileId: string) {
    return this.authService.getPacientesForNutri(nutriologoProfileId);
  }

  /**
   * Obtiene todos los nutriólogos con estadísticas (para el panel de administración).
   */
  @Get('admin/nutriologos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN_NUTRIOLOGO)
  async getNutriologosForAdmin(@GetUser('email') email: string) {
    if (email !== 'admin@nutrition.com') {
      throw new ForbiddenException('Acceso denegado. Se requieren privilegios de administrador del sistema.');
    }
    return this.authService.getAllNutriologosForAdmin();
  }

  /**
   * Registra un nuevo nutriólogo directamente (Admin-only).
   */
  @Post('admin/nutriologos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN_NUTRIOLOGO)
  async registerNutriologoByAdmin(
    @GetUser('email') email: string,
    @Body() registerDto: RegisterDto
  ) {
    if (email !== 'admin@nutrition.com') {
      throw new ForbiddenException('Acceso denegado. Se requieren privilegios de administrador del sistema.');
    }
    return this.authService.registerNutriologoByAdmin(registerDto);
  }

  /**
   * Elimina un nutriólogo por su id de perfil (Admin-only).
   */
  @Post('admin/nutriologos/delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN_NUTRIOLOGO)
  async deleteNutriologo(
    @GetUser('email') email: string,
    @Param('id') id: string
  ) {
    if (email !== 'admin@nutrition.com') {
      throw new ForbiddenException('Acceso denegado. Se requieren privilegios de administrador del sistema.');
    }
    return this.authService.deleteNutriologoByAdmin(id);
  }
}
