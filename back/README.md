# MedFlow API

Backend REST para la plataforma MedFlow. Construido con **Express + Sequelize (MySQL) + JWT** con sistema de **roles y permisos**.

## Stack

- Node.js 18+
- Express 4
- Sequelize 6 + mysql2
- JWT (jsonwebtoken) + bcryptjs
- Zod (validación)
- TypeScript

## Requisitos

- MySQL 8.x corriendo localmente (o accesible por red).
- Node 18+.

## Instalación

```bash
npm install
cp .env.example .env
# editar .env con tus credenciales de MySQL y JWT_SECRET
```

## Base de datos

```bash
npm run db:create     # crea la BD si no existe
npm run db:migrate    # aplica todas las migraciones
npm run db:seed       # siembra usuarios, roles, branding y catálogo
```

Para reiniciar todo (drop + create + migrate + seed):

```bash
npm run db:reset
```

## Desarrollo

```bash
npm run dev      # http://localhost:4000  (base path /api/v1)
```

Health check: `GET http://localhost:4000/api/v1/health`

## Build / Producción

```bash
npm run build
npm start
```

## Credenciales sembradas

| Email                   | Contraseña  | Rol    |
| ----------------------- | ----------- | ------ |
| admin@medflow.local     | Admin123!   | admin  |
| doctor@medflow.local    | Doctor123!  | doctor |

> Recuerda cambiar las contraseñas y `JWT_SECRET` en producción.

## Estructura

```
back/
  src/
    app.ts                 # Express app + middlewares
    server.ts              # entry point
    config/                # env (zod) + database (sequelize)
    middleware/            # auth, authorize, validate, error
    models/                # Sequelize models + asociaciones
    controllers/           # lógica por recurso
    routes/                # routers Express por recurso
    utils/                 # jwt, password, errors, asyncHandler
    types/                 # tipos globales (Express.Request.user)
  migrations/              # sequelize-cli (.cjs)
  seeders/                 # datos mínimos (.cjs)
```

## Endpoints (todos bajo `/api/v1`)

### Auth
- `POST /auth/login` — `{ email, password }` → `{ user, accessToken, refreshToken }`
- `POST /auth/refresh` — `{ refreshToken }`
- `GET /auth/me` — usuario autenticado (incluye `roles[]`, `permissions[]`)
- `POST /auth/logout`

### Users / Roles / Permissions (admin)
- `GET/POST/PATCH/DELETE /users[/...]`, `PUT /users/:id/roles`, `DELETE /users/:id/roles/:roleId`
- `GET/POST/PATCH/DELETE /roles[/...]`, `PUT /roles/:id/permissions`
- `GET /permissions`

### Dominio clínico
- `GET/POST/PATCH/DELETE /patients[/...]`, `PATCH /patients/:id/consent-photo`
- `GET /patients/:id/clinical-answers`, `PUT /patients/:id/clinical-answers`
- `GET/POST/PATCH/DELETE /appointments[/...]`, `PATCH /appointments/:id/status`, `POST /appointments/:id/complete`
- `GET/POST/PATCH/DELETE /consultations[/...]`
- `GET/POST/PATCH/DELETE /prescriptions[/...]` (items embebidos en `body.items[]`)
- `GET/POST/PATCH/DELETE /medications[/...]`
- `GET/PATCH /brandings/me`, `GET/PATCH /brandings/:id` (solo el consultorio del usuario)
- `GET/POST/PATCH/DELETE /clinical-questions[/...]`
- `GET /dashboard/stats`, `GET /dashboard/upcoming`

### Notificaciones e integraciones
- `GET/PATCH /notifications/preferences`
- `POST/DELETE /notifications/push/subscribe`
- `GET /integrations/google/connect` → `{ url }` (OAuth)
- `GET /integrations/google/callback` (redirect tras OAuth)
- `GET /integrations/google/status`, `DELETE /integrations/google`

### Portal público (paciente)
- `GET /public/branding?slug=`, `GET /public/patients/lookup?slug=&phone=`
- `GET /public/appointment-slots?slug=&date=YYYY-MM-DD`
- `POST /public/appointment-requests` `{ slug, ... }` → cita `pendiente` + `cancelToken`
- `POST /public/appointments/:id/cancel` `{ token }`

Al crear/confirmar/cancelar citas (staff o paciente) se disparan correo, push y sincronización con Google Calendar (si está configurado).

**Variables opcionales** (ver `.env.example`): `SMTP_*`, `VAPID_*`, `GOOGLE_*`, `FRONTEND_URL`, `PUBLIC_BOOKING_SECRET`.

Generar claves VAPID: `npm run keys:vapid`

## Multi-tenant (un consultorio por cliente)

Cada fila en `brandings` es un consultorio aislado: usuarios, roles, pacientes, citas y branding propios.

**Alta de un nuevo consultorio:**

```bash
npm run tenant:create -- \
  --slug drgarcia \
  --clinic "Consultorio Dr. García" \
  --doctor "Dr. García" \
  --admin-email admin@drgarcia.com \
  --admin-password 'Secret123!'
```

- Login único en `/login` (el tenant se resuelve desde el usuario).
- Agenda pública: `{FRONTEND_URL}/agendar/{slug}`.
- Emails de usuarios son únicos en toda la plataforma.

Todas las respuestas son `{ data, meta? }` o `{ error: { code, message, details? } }`.
