# El Arca — Archivo Comunitario

Memorial de Pedro "Cabezón Jano" González.  
**Arquitectura BaaS:** Supabase (Edge Functions + PostgreSQL + Storage) + Frontend estático en Vercel.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Supabase Edge Functions (Deno/TypeScript) |
| Base de datos | PostgreSQL (Supabase) con Row Level Security |
| Autenticación | Supabase Auth + JWT |
| Almacenamiento | Supabase Storage (bucket: `elarca-uploads`) |
| Notificaciones | Resend (SMTP API) — notificación por email al subir recuerdos |
| Frontend | SPA (HTML/CSS/JS vanilla) + Supabase JS SDK |
| Frontend host | Vercel (o cualquier host estático) |

---

## Estructura del proyecto

```
/
├── supabase/
│   ├── migrations/           # SQL schema + RLS policies
│   │   └── 001_schema.sql
│   ├── functions/
│   │   ├── _shared/          # CORS, Supabase client helpers
│   │   ├── auth/             # POST /auth — login + JWT
│   │   ├── galeria/          # GET /galeria — imágenes activas
│   │   ├── musica/           # CRUD /musica — gestión de canciones
│   │   ├── recuerdos/        # CRUD /recuerdos — recuerdos comunitarios
│   │   └── upload/           # POST /upload — subida + email (Resend)
│   ├── config.toml
│   └── deno.json
├── src/main/resources/static/    # Frontend estático
│   ├── index.html, galeria.html, videos.html, ...
│   ├── admin.html
│   ├── supabase.js           # Cliente Supabase compartido
│   ├── app.js                # SPA router
│   └── images/               # Fotos históricas (Che, Víctor Jara, Jano)
├── src/main/java/...         # Legacy Spring Boot (no usado en producción)
├── .env.template
└── README.md
```

---

## Requisitos

- Cuenta en [Supabase](https://supabase.com) (plan Free)
- Cuenta en [Vercel](https://vercel.com) (o similar para estáticos)
- [Resend](https://resend.com) API Key (para notificaciones por email)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (para deploy de Edge Functions)

---

## Despliegue

### 1. Supabase — Base de datos y RLS

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **SQL Editor** → pegar el contenido de `supabase/migrations/001_schema.sql` → Ejecutar
3. Ir a **Authentication** → Settings → habilitar email/password auth
4. Ir a **Storage** → crear bucket público `elarca-uploads`
5. Crear usuario admin en **Authentication** → Users → Add User (email: `mariajosevarga@gmail.com`, password: la que elijas)

> ⚠️ La migración SQL ya incluye el seed del admin y todas las políticas RLS.

### 2. Edge Functions (Backend)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Iniciar sesión
supabase login

# Vincular con tu proyecto
supabase link --project-ref <tu-project-id>

# Desplegar todas las Edge Functions
supabase functions deploy auth
supabase functions deploy galeria
supabase functions deploy musica
supabase functions deploy recuerdos
supabase functions deploy upload
```

Setear variables de entorno para las funciones:

```bash
supabase secrets set RESEND_API_KEY=re_your-api-key
supabase secrets set ADMIN_EMAIL=mariajosevarga@gmail.com
```

### 3. Vercel — Frontend

1. Ir a [vercel.com](https://vercel.com) → Importar repositorio
2. **Root Directory:** `src/main/resources/static`
3. **Build Command:** nada (solo estáticos)
4. **Output:** nada

**O bien**, copiar el contenido de `src/main/resources/static/` a un repositorio separado y desplegar.

**Importante:** Setear estas variables de entorno en Vercel:

| Variable | Valor |
|----------|-------|
| `SUPABASE_PROJECT_ID` | `tu-project-id` |
| `SUPABASE_URL` | `https://tu-project.supabase.co` |
| `SUPABASE_ANON_KEY` | tu anon key (pública) |

Luego reemplazar `${SUPABASE_PROJECT_ID}` y `${SUPABASE_ANON_KEY}` en los HTMLs con los valores reales, o inyectarlos via Vercel Environment Variables + build script.

---

## Variables de entorno

Ver `.env.template` para referencia completa.

### Supabase (Edge Functions)

| Variable | Descripción |
|----------|-------------|
| `SUPABASE_URL` | URL del proyecto |
| `SUPABASE_ANON_KEY` | Clave anónima (pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service_role (solo server-side) |
| `RESEND_API_KEY` | API Key de Resend para emails |
| `ADMIN_EMAIL` | Email del administrador para notificaciones |

### Frontend (inyectadas en HTML)

Estos placeholders deben ser reemplazados por valores reales:
- `${SUPABASE_PROJECT_ID}` → tu project ID
- `${SUPABASE_ANON_KEY}` → tu anon key pública

---

## Edge Functions — API

### Públicas (sin autenticación)

| Función | Ruta | Método | Descripción |
|---------|------|--------|-------------|
| `auth` | `/auth` | POST | Login (email + password) → JWT |
| `galeria` | `/galeria` | GET | Imágenes activas de la galería |
| `recuerdos` | `/recuerdos` | GET | Recuerdos aprobados |
| `upload` | `/upload` | POST | Subir recuerdo + notificación email |

### Admin (requiere JWT en `Authorization: Bearer <token>`)

| Función | Ruta | Método | Descripción |
|---------|------|--------|-------------|
| `musica` | `/musica` | GET | Todas las canciones |
| `musica` | `/musica` | POST | Subir canción nueva |
| `musica` | `/musica/:id` | PUT | Activar/desactivar canción |
| `musica` | `/musica/:id` | DELETE | Eliminar canción |
| `recuerdos` | `/recuerdos/:id/aprobar` | PUT | Aprobar recuerdo |
| `recuerdos` | `/recuerdos/:id` | DELETE | Eliminar recuerdo |

---

## Validación de archivos

Todos los uploads validan:
- **MIME type:** solo JPG, PNG, WebP, MP3, WAV, MP4, PDF
- **Tamaño máximo:** 50 MB
- **Sanitize de nombre:** caracteres no alfanuméricos reemplazados por `_` (previene path traversal)

---

## RLS (Row Level Security)

Todas las tablas tienen RLS habilitado:
- **recuerdos:** público insert (cualquiera puede subir), lectura solo aprobados, admin full CRUD
- **musica_reproductor:** público lectura solo activos, admin CRUD
- **galeria:** público lectura solo activos, admin CRUD
- **admin_users:** solo lectura pública (para login), admin manage
- **storage.objects:** lectura pública, escritura solo admin autenticado

---

## Legacy (Spring Boot)

El proyecto conserva el backend Java Spring Boot 3.4 para referencia y desarrollo local.  
No se usa en producción — toda la lógica corre en Supabase Edge Functions.

Para desarrollo local del backend legacy:
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

---

## Licencia

Memoria Popular El Arca — La Pintana, Santiago de Chile.
