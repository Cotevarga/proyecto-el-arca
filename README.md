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
| Frontend | React 19 + React Router 7 + Vite + Supabase JS SDK |
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
├── web/
│   ├── index.html            # Shell de la aplicación React
│   └── src/
│       ├── App.jsx           # Navegación cliente y shell persistente
│       ├── navigation.js     # Rutas públicas del sitio
│       ├── audio/            # Helpers de lista y reproducción persistente
│       ├── components/       # Shell, adaptadores y componentes reutilizables
│       ├── styles/           # Tema global y estilos extraídos por vista
│       ├── utils/            # Validación visual de formularios
│       └── __tests__/        # Pruebas unitarias de rutas, formularios y audio
├── *.html                    # Contenido y scripts originales de las páginas
├── relatos/                  # Relatos y contenido estático
├── scripts/                  # Build, extracción de CSS y validaciones
├── supabase/functions/_shared/ # Servicios compartidos (correo, CORS, Supabase)
├── vite.config.js
├── images/                   # Fotos históricas del territorio
├── musica/                   # Recursos de audio públicos usados por el sitio y el backend
├── supabase.js               # Cliente Supabase compartido
├── app.js                    # Funciones compartidas y compatibilidad SPA anterior
├── .env.template
├── vercel.json
└── README.md
```

`images/` y `musica/` son las ubicaciones canónicas de los recursos. Se retiraron
de `frontend/` únicamente las copias con contenido idéntico; los recursos únicos
se conservaron.

La navegación pública se ejecuta en React sin recargar el documento. El encabezado y
el reproductor de audio permanecen montados entre rutas. Las páginas y sus scripts
existentes se sirven mediante `LegacyPage` como etapa de compatibilidad, preservando
formularios, galerías, mapas e integraciones mientras se migran sus vistas de forma
incremental. El panel de administración y el endpoint de estado mantienen sus páginas
independientes.

### Desarrollo y validación del frontend

```bash
npm install
npm run dev
npm run build
npm run test:frontend
npm run test:unit
npm run lint
npm run preview
```

Bootstrap 5 aporta la cuadrícula, tarjetas y controles de formulario del tema oscuro;
las reglas específicas de cada página se mantienen en hojas CSS separadas. Al
incorporar una vista HTML heredada nueva, ejecutar `npm run styles:extract` para
extraer sus bloques `<style>` a `web/src/styles/legacy/`.

El build conserva las rutas y contenido original en `dist/_legacy-pages/` y genera
una shell React para cada URL existente. El encabezado, la cola musical y el mismo
elemento de audio sobreviven a la navegación cliente. El botón siguiente recorre la
cola en orden y el final de una canción avanza a la siguiente.

Las pruebas unitarias cubren las rutas principales, validación visual de formularios,
avance de la cola y el contrato de notificación de correo Resend. Para las pruebas de
Edge Functions completas se mantiene `npm test` (requiere Deno). Las plantillas
heredadas conservan algunos estilos inline asociados a estados que modifican scripts
en tiempo de ejecución; retirarlos automáticamente podría alterar interacciones.
No se eliminaron archivos históricos o de compatibilidad sin evidencia de que sean
obsoletos. El backend y las funciones de correo mantienen su flujo existente.

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
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`

**Importante:** Setear estas variables de entorno en Vercel:

| Variable | Valor |
|----------|-------|
| `SUPABASE_PROJECT_ID` | `tu-project-id` |
| `SUPABASE_URL` | `https://tu-project.supabase.co` |
| `SUPABASE_ANON_KEY` | tu anon key (pública) |

El build inyecta las variables de entorno en los recursos del frontend.

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
