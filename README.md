# El Arca — Archivo Comunitario

**Memorial de Pedro "Cabezón Jano" González**  
*Población Francisco de Goya, La Pintana — Santiago de Chile*

---

## Propósito

El Arca no es solo un archivo digital. Es una **herramienta política-pedagógica** para retomar el trabajo de masas con las infancias de los territorios, formando adultos críticos, conscientes y solidarios.

La memoria colectiva de nuestro barrio —sus luchas, sus organizaciones, sus referentes— es el combustible para que las nuevas generaciones entiendan que **no están destinadas al sometimiento**, sino a ser sujetos conscientes de su propia historia. Preservar y activar esa memoria es un acto de soberanía.

> *"No queremos que los niños sean solo consumidores de archivo. Queremos que sean sus creadores, sus curadores y sus herederos."*

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
│   ├── migrations/           # SQL schema + RLS policies (001–007)
│   ├── functions/
│   │   ├── _shared/          # CORS, Supabase client helpers
│   │   ├── auth/             # POST /auth — login + JWT
│   │   ├── galeria/          # GET /galeria — imágenes activas
│   │   ├── musica/           # CRUD /musica — gestión de canciones
│   │   ├── recuerdos/        # CRUD /recuerdos — recuerdos comunitarios
│   │   └── upload/           # POST /upload — subida + email (Resend)
│   ├── config.toml
│   └── deno.json
├── *.html                    # Frontend estático en raíz
│   ├── index.html            # Portada del archivo
│   ├── relatos.html          # Relatos organizados por sección
│   ├── galeria.html          # Galería de imágenes
│   ├── videos.html           # Videos y material audiovisual
│   ├── admin.html            # Panel de administración y curaduría
│   ├── subir.html            # Formulario público de contribución
│   └── ...
├── images/                   # Fotos históricas del territorio
├── supabase.js               # Cliente Supabase compartido
├── app.js                    # SPA router
├── .env.template
├── vercel.json
└── README.md
```

---

## Documentación complementaria

| Archivo | Contenido |
|---------|-----------|
| `informe-proyecto.md` | Problema, solución, KPIs, gobernanza, presupuesto y plan UNESCO |
| `MAPA-RUTA-PEDAGOGICO.md` | Ruta pedagógica: talleres con NNA, validación comunitaria e integración curricular |
| `protocolo-curaduria.md` | Criterios de ingreso, política de rechazo y principios éticos del archivo |
| `PLAN-SOSTENIBILIDAD.md` | Sostenibilidad técnica, financiera, preservación de datos y continuidad humana |
| `CONTRIBUTING.md` | Guía para contribuir, replicar y adaptar el proyecto en otros territorios |
| `template-carta-respaldo.md` | Modelo de carta para solicitar patrocinio institucional |
| `template-convenio-escolar.md` | Modelo de convenio para formalizar colaboración con escuelas |

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
2. Ir a **SQL Editor** → ejecutar las migraciones en orden desde `supabase/migrations/`
3. Ir a **Authentication** → Settings → habilitar email/password auth
4. Ir a **Storage** → crear bucket público `elarca-uploads`
5. Crear usuario admin en **Authentication** → Users → Add User (email: `mariajosevarga@gmail.com`)

> ⚠️ Las migraciones SQL ya incluyen el seed del admin y todas las políticas RLS.

### 2. Edge Functions (Backend)

```bash
npm install -g supabase

supabase login
supabase link --project-ref <tu-project-id>

supabase functions deploy auth
supabase functions deploy galeria
supabase functions deploy musica
supabase functions deploy recuerdos
supabase functions deploy upload
```

Setear variables de entorno:

```bash
supabase secrets set RESEND_API_KEY=re_your-api-key
supabase secrets set ADMIN_EMAIL=mariajosevarga@gmail.com
supabase secrets set CORS_ALLOWED_ORIGINS=https://elarca.cl,https://www.elarca.cl
supabase secrets set DOMAIN=elarca.cl
```

### 3. Vercel — Frontend

1. Ir a [vercel.com](https://vercel.com) → Importar repositorio
2. **Root Directory:** `/` (la raíz del proyecto)
3. **Build Command:** ninguno (solo estáticos)
4. **Output:** ninguno

**Importante:** Setear estas variables de entorno en Vercel:

| Variable | Valor |
|----------|-------|
| `SUPABASE_PROJECT_ID` | `tu-project-id` |
| `SUPABASE_URL` | `https://tu-project.supabase.co` |
| `SUPABASE_ANON_KEY` | tu anon key (pública) |

Luego reemplazar `${SUPABASE_PROJECT_ID}` y `${SUPABASE_ANON_KEY}` en los HTMLs con los valores reales, o inyectarlos vía Vercel Environment Variables.

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

Placeholders a reemplazar por valores reales:
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

## Licencia

**Software:** MIT  
**Contenido del archivo:** CC BY-NC-SA 4.0  

Memoria Popular El Arca — La Pintana, Santiago de Chile.
