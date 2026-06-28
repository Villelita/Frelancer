import { 
  Injectable, 
  ConflictException, 
  UnauthorizedException, 
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Registra un nuevo usuario en el sistema.
   * Si es ADMIN_NUTRIOLOGO, crea su perfil de nutriólogo.
   * Si es USER_PACIENTE, crea su perfil de paciente asociado a un nutriólogo.
   */
  async register(dto: RegisterDto) {
    if (dto.role === Role.ADMIN_NUTRIOLOGO) {
      throw new ForbiddenException('El registro público de nutriólogos está deshabilitado. Solicite credenciales al administrador.');
    }
    // 1. Verificar si el correo ya está registrado
    const userExists = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (userExists) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    // 2. Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // 3. Crear el usuario y su perfil correspondiente usando una transacción
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: dto.role
        }
      });

      let profileId = '';

      if (dto.role === Role.ADMIN_NUTRIOLOGO) {
        const nutriProfile = await tx.nutriologoProfile.create({
          data: {
            userId: user.id,
            nombre: dto.nombre,
            cedulaProf: dto.cedulaProf,
            especialidades: dto.especialidades || []
          }
        });
        profileId = nutriProfile.id;
      } else if (dto.role === Role.USER_PACIENTE) {
        // Para pacientes, deben estar asignados a un nutriólogo.
        // Si no se provee uno en el registro, lo asignamos por defecto al primer nutriólogo del sistema para evitar que falle.
        let targetNutriId = dto.nutriologoId;
        
        if (!targetNutriId) {
          const defaultNutri = await tx.nutriologoProfile.findFirst();
          if (!defaultNutri) {
            throw new BadRequestException('No hay ningún nutriólogo registrado en el sistema al cual asignar este paciente.');
          }
          targetNutriId = defaultNutri.id;
        }

        const pacienteProfile = await tx.pacienteProfile.create({
          data: {
            userId: user.id,
            nombre: dto.nombre,
            fechaNacimiento: new Date('1998-01-01'), // Fecha genérica editable en perfil
            nutriologoId: targetNutriId
          }
        });
        profileId = pacienteProfile.id;
      }

      return {
        success: true,
        message: 'Usuario registrado con éxito.',
        userId: user.id,
        profileId
      };
    });
  }

  /**
   * Autentica credenciales y emite un token JWT.
   */
  async login(dto: LoginDto) {
    // 1. Buscar usuario
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    // 2. Validar contraseña
    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    // 3. Obtener el ID de perfil correspondiente para incluirlo en el token (Tenant)
    let profileId: string | null = null;
    let nombreCompleto = '';

    if (user.role === Role.ADMIN_NUTRIOLOGO) {
      const profile = await this.prisma.nutriologoProfile.findUnique({
        where: { userId: user.id }
      });
      profileId = profile ? profile.id : null;
      nombreCompleto = profile ? profile.nombre : 'Nutriólogo';
    } else if (user.role === Role.USER_PACIENTE) {
      const profile = await this.prisma.pacienteProfile.findUnique({
        where: { userId: user.id }
      });
      profileId = profile ? profile.id : null;
      nombreCompleto = profile ? profile.nombre : 'Paciente';
    }

    // 4. Firmar Token JWT conteniendo los claims necesarios para el control Multi-tenant
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      profileId: profileId // Este es el identificador del tenant en las consultas
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profileId,
        nombre: nombreCompleto
      }
    };
  }

  /**
   * Obtiene la lista de nutriólogos registrados (para rellenar el formulario de registro de pacientes).
   */
  async getNutriologos() {
    return this.prisma.nutriologoProfile.findMany({
      select: {
        id: true,
        nombre: true,
        especialidades: true
      }
    });
  }

  /**
   * Obtiene todos los pacientes asignados a un nutriólogo específico (aislamiento multi-tenant).
   */
  async getPacientesForNutri(nutriologoId: string) {
    return this.prisma.pacienteProfile.findMany({
      where: { nutriologoId },
      select: {
        id: true,
        nombre: true,
        fechaNacimiento: true,
        telefono: true,
        genero: true,
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: { nombre: 'asc' }
    });
  }

  /**
   * Registra un nuevo nutriólogo en el sistema (Admin-only).
   */
  async registerNutriologoByAdmin(dto: RegisterDto) {
    const userExists = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (userExists) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: Role.ADMIN_NUTRIOLOGO
        }
      });

      const nutriProfile = await tx.nutriologoProfile.create({
        data: {
          userId: user.id,
          nombre: dto.nombre,
          cedulaProf: dto.cedulaProf,
          especialidades: dto.especialidades || []
        }
      });

      return {
        success: true,
        message: 'Nutriólogo registrado con éxito por el administrador.',
        userId: user.id,
        profileId: nutriProfile.id
      };
    });
  }

  /**
   * Obtiene todos los nutriólogos con su total de pacientes (para el panel admin).
   */
  async getAllNutriologosForAdmin() {
    const list = await this.prisma.nutriologoProfile.findMany({
      include: {
        user: {
          select: {
            email: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            pacientes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return list.map(n => ({
      id: n.id,
      nombre: n.nombre,
      email: n.user.email,
      cedulaProf: n.cedulaProf,
      especialidades: n.especialidades,
      createdAt: n.user.createdAt,
      pacientesCount: n._count.pacientes
    }));
  }

  /**
   * Elimina un nutriólogo por su profileId (y su usuario cascada).
   */
  async deleteNutriologoByAdmin(id: string) {
    const profile = await this.prisma.nutriologoProfile.findUnique({
      where: { id }
    });

    if (!profile) {
      throw new BadRequestException('Nutriólogo no encontrado.');
    }

    // Al eliminar el usuario, la relación cascade en la DB borrará el perfil automáticamente.
    await this.prisma.user.delete({
      where: { id: profile.userId }
    });

    return {
      success: true,
      message: 'Nutriólogo eliminado con éxito.'
    };
  }
}
