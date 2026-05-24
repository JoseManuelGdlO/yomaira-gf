# Despliegue MedFlow en EasyPanel

Guía para desplegar MedFlow (backend + frontend + MySQL) en [EasyPanel](https://easypanel.io) con subdominios separados y deploy automático en cada push a GitHub.

## Arquitectura

| Servicio | Carpeta | Puerto | Dominio ejemplo |
|----------|---------|--------|-----------------|
| MySQL | (nativo EasyPanel) | 3306 | Solo red interna |
| API | `back/` | 4000 | `api.tudominio.com` |
| Frontend | `front/` | 3000 | `app.tudominio.com` |

## Requisitos

- VPS con EasyPanel instalado (Ubuntu, mínimo 2 GB RAM; recomendado 4 GB)
- Dominio con DNS apuntando al VPS
- Repositorio en GitHub conectado a EasyPanel

## 1. Probar localmente (opcional)

MySQL **no** va en el compose: usa la base de datos del servidor (EasyPanel).

1. Copia las variables de entorno:

```bash
cp .env.example .env
# Edita .env con las credenciales MySQL del servidor (DB_HOST, DB_USER, etc.)
```

2. Levanta solo back + front:

```bash
docker compose up --build
```

Verificar:

```bash
curl http://localhost:4000/api/v1/health
open http://localhost:3000
```

## 2. Crear proyecto en EasyPanel

1. EasyPanel → **New Project** → nombre: `medflow`

## 3. Servicio MySQL (nativo)

1. **Add Service** → **MySQL**
2. Nombre del servicio: `mysql`
3. Crear base de datos: `medflow`
4. Usuario y contraseña seguros (guardar credenciales)
5. EasyPanel gestiona persistencia y backups automáticamente

## 4. Servicio Backend

1. **Add Service** → **App**
2. Source: **GitHub** → seleccionar este repositorio
3. **Root directory:** `back`
4. EasyPanel detectará el `Dockerfile` automáticamente
5. **Proxy port:** `4000`
6. **Dominio:** `api.tudominio.com` (HTTPS automático con Let's Encrypt)

### Variables de entorno (backend)

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `DB_HOST` | `mysql` |
| `DB_PORT` | `3306` |
| `DB_USER` | usuario MySQL del paso 3 |
| `DB_PASSWORD` | contraseña MySQL |
| `DB_NAME` | `medflow` |
| `JWT_SECRET` | string aleatorio ≥ 16 caracteres |
| `CORS_ORIGIN` | `https://app.tudominio.com` |
| `FRONTEND_URL` | `https://app.tudominio.com` |
| `PUBLIC_BOOKING_SECRET` | string aleatorio |
| `GOOGLE_REDIRECT_URI` | `https://api.tudominio.com/api/v1/integrations/google/callback` |

Referencia completa: [`.env.example`](.env.example)

### Primer deploy manual

1. Click **Deploy**
2. Revisar logs: debe ejecutar migraciones y arrancar en puerto 4000
3. Verificar: `https://api.tudominio.com/api/v1/health`

### Datos iniciales (consola EasyPanel del backend)

Solo la primera vez, si necesitas datos demo:

```bash
NODE_ENV=production npm run db:seed
```

Crear consultorios adicionales:

```bash
npm run tenant:create -- \
  --slug drgarcia \
  --clinic "Consultorio Dr. García" \
  --doctor "Dr. García" \
  --admin-email admin@drgarcia.com \
  --admin-password 'Secret123!'
```

## 5. Servicio Frontend

1. **Add Service** → **App**
2. Source: **GitHub** → mismo repositorio
3. **Root directory:** `front`
4. **Proxy port:** `3000`
5. **Dominio:** `app.tudominio.com`

### Variables de entorno (frontend — build-time)

Configurar **antes** del primer deploy:

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://api.tudominio.com/api/v1` |
| `VITE_SITE_URL` | `https://app.tudominio.com` |
| `VITE_VAPID_PUBLIC_KEY` | (opcional, si usas push) |

> Las variables `VITE_*` se incluyen en el bundle en tiempo de build. Si cambias dominios, debes redeployar el frontend.

### Primer deploy manual

1. Click **Deploy**
2. Verificar: `https://app.tudominio.com`

## 6. Auto Deploy (deploy en cada commit)

Objetivo: cada `git push` a `main` dispara deploy automático sin pasos manuales.

### Configuración (una vez por servicio)

**Importante:** activar Auto Deploy solo después de que el primer deploy manual funcione correctamente.

1. En el servicio **back** → pestaña **Deploy** → activar **Auto Deploy**
2. Seleccionar rama: `main`
3. Repetir en el servicio **front**
4. EasyPanel instalará un webhook en GitHub automáticamente

### Flujo diario

```bash
git add .
git commit -m "feat: mi cambio"
git push origin main
# → EasyPanel redeploya back + front automáticamente
```

### Comportamiento en monorepo

Un push a `main` redeploya **ambos** servicios (`back/` y `front/`), aunque solo hayas cambiado una carpeta. Cada servicio reconstruye solo su `Dockerfile` con su root directory correspondiente.

### Webhook manual (alternativa)

Cada servicio expone una **Deploy Webhook URL** en EasyPanel. Útil para disparar deploy desde GitHub Actions u otras herramientas externas.

## 7. Health checks

| Servicio | URL | Respuesta esperada |
|----------|-----|-------------------|
| Backend | `GET /api/v1/health` | `{"data":{"status":"ok",...}}` |
| Frontend | `GET /` | HTTP 200 |

## 8. Notas

- **RAM:** mínimo 2 GB; recomendado 4 GB con MySQL + 2 apps Node
- **Migraciones:** se ejecutan automáticamente al arrancar el backend (`docker-entrypoint.sh`)
- **Seed:** no se ejecuta automáticamente en producción (evita sobrescribir datos)
- **SMTP / Google OAuth / VAPID:** opcionales; configurar cuando los necesites
- **Dev local:** sigue usando `npm run dev` en `back/` y `front/` sin Docker

## Estructura de archivos de despliegue

```
back/
  Dockerfile
  docker-entrypoint.sh
  .dockerignore
front/
  Dockerfile
  vite.config.docker.ts
  .dockerignore
docker-compose.yml      # dev local
.env.example            # referencia de variables
DEPLOY.md               # esta guía
```
