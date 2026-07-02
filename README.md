# El Arca — Archivo Comunitario

Memorial de Pedro "Cabezón Jano" González.  
**Arquitectura híbrida:** Backend en Render (Docker) + Frontend en Vercel (SPA).

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Spring Boot 3.4 / Java 21 |
| Base de datos | PostgreSQL (Supabase) |
| Seguridad | Spring Security + JWT (jjwt 0.12) |
| Migraciones | Flyway |
| Rate Limiting | Bucket4j |
| Documentación | SpringDoc OpenAPI (Swagger 3) |
| Frontend | SPA (HTML/CSS/JS vanilla) |
| Contenedor | Docker multietapa |
| Backend host | Render |
| Frontend host | Vercel |

---

## Arquitectura

```
src/main/java/com/elarca/
├── domain/            # Modelos (records), puertos de repositorio y servicios
├── application/       # DTOs, casos de uso, mappers MapStruct
├── infrastructure/    # Adaptadores: JPA, JWT, Security, storage, filters
├── presentation/      # Controladores REST
└── ElArcaApplication.java
```

---

## Requisitos locales

- Java 21+ (JDK)
- Maven 3.9+
- PostgreSQL 16+ (o Supabase)
- Docker (opcional)

---

## Desarrollo local

```bash
# Compilar
mvn clean package -DskipTests

# Ejecutar con perfil dev
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Tests
mvn test
```

### Docker local

```bash
docker compose up --build -d
docker compose logs -f
docker compose down
```

---

## Despliegue en Render (Backend)

Render ejecuta el Dockerfile del repositorio.  
El backend queda en, por ejemplo: `https://elarca-backend.onrender.com`

### Pasos

1. **Crear servicio Web en Render**
   - Ir a [dashboard.render.com](https://dashboard.render.com) → New → Web Service
   - Conectar el repositorio de GitHub/GitLab
   - **Name:** `elarca-backend`
   - **Region:** Oregon (us-east) — cercano a Supabase
   - **Branch:** `main`
   - **Runtime:** Docker
   - **Plan:** Free (o Starter para producción)

2. **Variables de entorno en Render Dashboard**

   Ir a Environment → Environment Variables y agregar:

   | Variable | Valor | Ejemplo |
   |----------|-------|---------|
   | `SPRING_DATASOURCE_URL` | URL JDBC de Supabase | `jdbc:postgresql://aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require` |
   | `SPRING_DATASOURCE_USERNAME` | Usuario Supabase | `postgres.abcdefghijkl` |
   | `SPRING_DATASOURCE_PASSWORD` | Contraseña Supabase | `your-supabase-password` |
   | `JWT_SECRET` | Secreto JWT (min 32 chars) | `mi_secreto_jwt_super_seguro_2026_cambiar` |
   | `JWT_EXPIRATION_MS` | Expiración del token | `28800000` (8 horas) |
   | `CORS_ALLOWED_ORIGINS` | Orígenes permitidos (separados por coma) | `https://proyecto-el-arca.vercel.app` |
   | `UPLOAD_DIR` | Directorio de subida (persistencia efímera en Free) | `/tmp/elarca-uploads` |
   | `PORT` | Puerto (Render lo asigna automáticamente) | `8080` |
   | `RATE_LIMITING_ENABLED` | Activar rate limiting | `true` |

   > ⚠️ En el plan Free de Render el disco es efímero. Para subida de archivos se recomienda usar Supabase Storage o AWS S3 en producción.

3. **Health check**  
   Render monitorea automáticamente el endpoint `/api/v1/health`.  
   Se configura en el dashboard de Render (Settings → Health Check Path).  
   Usa `http://localhost:8080/api/v1/health` como health check.

4. **Auto-deploy**  
   Por defecto Render redepliega automáticamente al hacer push a la rama configurada.

---

## Despliegue en Vercel (Frontend)

1. Ir a [vercel.com](https://vercel.com) → Importar repositorio
2. **Root Directory:** `src/main/resources/static`
3. **Build Command:** `-` (solo estáticos)
4. **Output:** `-`
5. **Variables:** ninguna

O bien, copiar el contenido de `src/main/resources/static/` a un repositorio separado y desplegar como sitio estático en Vercel.

---

## Endpoints de la API

### Públicos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/auth/login` | Iniciar sesión |
| GET | `/api/v1/galeria` | Galería de imágenes |
| GET | `/api/v1/musica` | Canciones activas |
| POST | `/api/v1/upload` | Subir recuerdo |
| POST | `/api/v1/subir` | Alias de upload |

### Admin (requiere token JWT en header `Authorization: Bearer <token>`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/admin/recuerdos` | Todos los recuerdos |
| PUT | `/api/v1/admin/recuerdos/{id}/aprobar` | Aprobar recuerdo |
| DELETE | `/api/v1/admin/recuerdos/{id}` | Eliminar recuerdo |
| GET | `/api/v1/admin/musica` | Todas las canciones |
| POST | `/api/v1/admin/musica` | Subir canción |
| PUT | `/api/v1/admin/musica/{id}` | Activar/desactivar |
| DELETE | `/api/v1/admin/musica/{id}` | Eliminar canción |
| POST | `/api/v1/admin/subir` | Subida admin |

---

## Documentación Swagger

Una vez corriendo:  
- **Local:** http://localhost:8080/swagger-ui.html  
- **Render:** `https://elarca-backend.onrender.com/swagger-ui.html`

---

## Respuestas de error

Todas las respuestas de error siguen la estructura:

```json
{
  "timestamp": "2026-07-02T10:30:00.000Z",
  "status": 500,
  "message": "Ha ocurrido un error interno. Por favor, intenta de nuevo."
}
```

---

## Bypass temporal

Durante desarrollo, cualquier usuario con contraseña `"admin"` puede iniciar sesión sin verificar bcrypt.  
Eliminar en producción final.
