# Portal Nutricional Premium: Software a Medida para Nutriólogos y Pacientes

Este es un software integral a la medida diseñado para la gestión de consultorios de nutrición y el seguimiento del paciente en tiempo real. La plataforma está estructurada en un esquema **Multi-tenant** seguro, donde cada nutriólogo cuenta con aislamiento lógico de sus pacientes, expedientes y planes alimenticios.

---

## 🚀 Arquitectura y Tecnologías
La aplicación está construida sobre un stack moderno y escalable:

*   **Frontend**: Next.js 14 (App Router) con Tailwind CSS para una experiencia interactiva fluida y con diseño corporativo oscuro.
*   **Backend**: NestJS (Framework modular de Node.js) con TypeScript.
*   **Base de Datos**: PostgreSQL alojado en Supabase.
*   **ORM**: Prisma ORM para migraciones y consultas seguras.
*   **Autenticación**: JWT (JSON Web Tokens) con cifrado de contraseñas mediante `bcryptjs`.
*   **Pagos**: Stripe API (Checkout Sessions y Webhooks seguros con validación de firmas criptográficas).

---

## 🌟 Características Principales

1.  **Expediente Clínico Digital Interactivo**:
    *   Los nutriólogos registran en consulta las mediciones antropométricas del paciente: peso, porcentaje de grasa, masa muscular, porcentaje de agua y pliegues cutáneos (tricipital, subescapular, suprailiaco, abdominal).
    *   Soporte para notas clínicas personalizadas.

2.  **Calculadora de Macros Integrada**:
    *   Ubicada en el panel del nutriólogo. Implementa la ecuación científica de **Mifflin-St Jeor** para estimar de forma precisa la tasa metabólica basal (BMR) y el gasto energético diario total (TDEE).
    *   Permite repartir proteínas y grasas en gramos por kilogramo de peso corporal (g/kg), auto-calculando los carbohidratos restantes y los porcentajes calóricos correspondientes en tiempo real.

3.  **Módulo de Analíticas Visuales (SVG Puro)**:
    *   Evita los errores de hidratación y caídas de rendimiento de librerías de terceros (como Chart.js o Recharts) mediante el renderizado de **gráficos lineales interactivos hechos en SVG puro**.
    *   Muestra el progreso histórico de Peso (kg) y Composición Corporal (% Grasa vs % Músculo) con tooltips que muestran la información exacta al pasar el cursor sobre los puntos.

4.  **Checkout y Agenda de Citas con Stripe**:
    *   Un flujo continuo donde el paciente se registra, realiza el pago de su consulta a través del portal seguro de **Stripe Checkout**, y es redirigido automáticamente a una interfaz de calendario para reservar su fecha y hora de cita.
    *   El acceso al panel y al plan alimenticio queda bloqueado hasta que el webhook de Stripe confirma el cobro.

---

## 📂 Estructura del Proyecto

```text
Freelancer_Nutri/
├── backend/            # API REST construida en NestJS
│   ├── prisma/         # Esquema de base de datos y scripts de seed
│   └── src/
│       ├── common/     # Guards (JWT/Roles), Decoradores y cliente Prisma
│       └── modules/    # Módulos: auth (usuarios), consultas (clínico), citas (pagos/stripe)
├── frontend/           # Aplicación Web Next.js 14
│   └── src/
│       └── app/        # Páginas: login, register, checkout, dashboard/nutri, dashboard/patient
└── README.md           # Guía general de uso
```

---

## 🔧 Configuración del Entorno de Desarrollo

### Requisitos Previos
*   Node.js (versión 18 o superior)
*   Stripe CLI (para simulación de webhooks de pago en local)
*   Base de datos PostgreSQL (ej. Supabase)

### Paso 1: Configurar Variables de Entorno del Backend
Crea el archivo `.env` en la carpeta `/backend`:
```env
DATABASE_URL="tu_url_de_supabase_con_pgbouncer=true"
DIRECT_URL="tu_url_de_conexion_directa_a_supabase"
JWT_SECRET="super-secret-key-nutritionists"
FRONTEND_URL="http://localhost:3001"
STRIPE_SECRET_KEY="rkcs_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Paso 2: Instalar y Desplegar el Backend
Ejecuta los siguientes comandos desde la carpeta `/backend`:
```bash
# 1. Instalar dependencias
npm install

# 2. Empujar el esquema de base de datos a Supabase
npx prisma db push

# 3. Sembrar la base de datos con cuentas de prueba
npx prisma db seed

# 4. Iniciar el servidor en modo desarrollo (Puerto 3000)
npm run start:dev
```

### Paso 3: Instalar y Desplegar el Frontend
Ejecuta los siguientes comandos desde la carpeta `/frontend`:
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor Next.js en modo desarrollo (Puerto 3001)
npm run dev
```

### Paso 4: Escuchar Pagos de Stripe en Local
Para recibir los webhooks de pago en tu servidor local de NestJS:
1.  Crea una cuenta de desarrollo o un sandbox con la CLI de Stripe:
    ```bash
    stripe sandbox create --from-git
    ```
2.  Inicia el listener de eventos retransmitiendo a tu puerto local:
    ```bash
    stripe listen --forward-to localhost:3000/api/citas/webhook
    ```
3.  Copia la clave secreta de webhook (`whsec_...`) que la CLI imprime y pégala en `STRIPE_WEBHOOK_SECRET` dentro de `backend/.env`.

---

## 🔑 Credenciales de Prueba Sembradas

Para probar el flujo de inmediato sin registrar usuarios desde cero, utiliza las siguientes cuentas precargadas en la base de datos:

### Cuenta de Nutriólogo (ADMIN_NUTRIOLOGO)
*   **Correo**: `alejandro.silva@nutrition.com`
*   **Contraseña**: `password123`
*   **Permisos**: Rellena expedientes clínicos, actualiza mediciones corporales y define la calculadora de macros de pacientes asignados.

### Cuenta de Paciente (USER_PACIENTE)
*   **Correo**: `valeria.alarcon@gmail.com`
*   **Contraseña**: `password123`
*   **Permisos**: Realiza el pago, agenda su cita, visualiza gráficas de progreso y descarga su plan de comidas.
