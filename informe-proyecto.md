# Informe de Proyecto: Archivo Comunitario "El Arca"

---

## 1. Resumen Ejecutivo

**Nombre del Proyecto:** Archivo Comunitario "El Arca" — Memoria Viva de la Población Francisco de Goya

**Misión:** Salvaguardar, digitalizar y poner en valor la memoria colectiva de la Población Francisco de Goya (Paradero 30½ de Santa Rosa, La Pintana, Región Metropolitana) mediante un archivo digital comunitario, participativo y curatorialmente supervisado.

**Visión a 20 años:** Consolidar un acervo digital autosustentable con más de 10.000 registros (fotografías, relatos orales escritos, audios y videos) que sirva como fuente primaria para investigaciones históricas, proyectos educativos y procesos de recuperación de identidad territorial.

**Público objetivo:** Vecinos y ex-vecinos de la Población Francisco de Goya, investigadores de memoria social, estudiantes de educación básica y media de La Pintana, y organizaciones culturales comunitarias.

**Postulación a:** Fondos de Cultura (FNDR 8% Cultura / Fondart Regional / Programa de Apoyo a Organizaciones Culturales Colaboradoras) y fondos internacionales de memoria histórica (UNESCO Memory of the World / National Endowment for the Humanities).

---

## 2. Taxonomía del Archivo

El archivo se organiza en seis categorías (secciones) que reflejan la estructura narrativa de la memoria territorial:

| Sección | Descripción | Tipo de contenido |
|----------|-------------|-------------------|
| **Galería** | Imágenes históricas de la población, sus habitantes, actividades y transformación urbana. | Fotografías (JPEG) |
| **Videos y Audios** | Registros audiovisuales y sonoros: entrevistas, testimonios, eventos comunitarios. | Video MP4 / Audio MP3 |
| **Relatos: El Jano** | Historias y memorias en torno a la figura de Pedro Jano González, fundador y líder comunitario. | Texto, audio, fotografía |
| **Relatos: El Arca** | Experiencias vinculadas al centro cultural "El Arca" como espacio de resistencia y creación. | Texto, audio, fotografía |
| **Relatos: Otras organizaciones** | Memorias de agrupaciones políticas, sociales, deportivas y culturales del territorio. | Texto, audio, fotografía |
| **El Legado** | Reflexiones, análisis y proyecciones sobre el significado patrimonial de la población. | Texto, audio, fotografía |

### Metadatos por registro

- `id`: Identificador único (BIGSERIAL)
- `nombre`: Nombre o pseudónimo del contribuyente
- `anio`: Año estimado del material
- `mensaje`: Descripción breve
- `mensaje_largo`: Relato o texto extenso
- `url_archivo`: URL pública del archivo en Storage
- `storage_path`: Ruta interna en el bucket
- `tipo_archivo`: MIME type
- `nombre_original`: Nombre del archivo al momento de la subida
- `tamanio_bytes`: Tamaño en bytes
- `seccion`: Clasificación taxonómica
- `aprobado`: Estado del flujo curatorial
- `created_at`: Timestamp de ingreso
- `geolocalizacion`: Ubicación geográfica del contenido (opcional)
- `tags`: Arreglo de etiquetas para búsqueda facetada (text[])
- `fecha_creacion_archivo`: Fecha original del material (date, opcional)
- `hash_sha256`: Hash SHA-256 del archivo para verificación de integridad

---

## 3. Infraestructura Tecnológica

### Arquitectura actual

```
[Usuario] → Navegador Web → HTML/CSS/JS (Frontend estático)
                              ↓
                         Supabase (Backend as a Service)
                              ↓
                    ┌─────────┴─────────┐
                    ▼                   ▼
             PostgreSQL (datos)    Storage S3 (archivos)
```

### Componentes

| Componente | Tecnología | Función |
|------------|-----------|---------|
| Frontend | HTML5 + Tailwind CSS + JavaScript vanilla | Interfaz de usuario SPA (Single Page Application) |
| Backend | Supabase (PostgreSQL + REST API + Realtime) | Lógica de negocio, autenticación, base de datos |
| Storage | Supabase Storage (S3-compatible) | Almacenamiento de archivos multimedia |
| Autenticación | Supabase Auth (JWT) | Acceso al panel de administración |
| Realtime | Supabase Realtime (WebSockets) | Sincronización en vivo de cola de pendientes y reproductor musical |
| Hosting | Servidor estático (Apache/Nginx/GitHub Pages) | Entrega del frontend |

### Especificaciones técnicas de la base de datos

- Motor: PostgreSQL 15+
- Tablas principales: `recuerdos` (acervo documental), `musica_reproductor` (parrilla musical), `galeria` (galería de imágenes), `admin_users` (administradores)
- Row Level Security (RLS) activo para todas las tablas
- Índices en columnas de búsqueda frecuente: `aprobado`, `seccion`, `created_at`

### Escalabilidad

- Supabase escala horizontalmente de forma automática (hasta 500 conexiones simultáneas en el plan gratuito, escalable a planes superiores).
- El frontend estático puede servirse desde un CDN global sin límite de usuarios concurrentes.
- El Storage de Supabase acepta hasta 100 GB por proyecto en plan gratuito, con capacidad de expansión mediante planes de pago.

---

## 4. Sostenibilidad

### Modelo de participación ciudadana (Crowdsourcing curado)

El Archivo opera bajo un modelo híbrido que combina la apertura participativa con la supervisión curatorial:

1. **Apertura total:** Cualquier persona puede contribuir fotografías, audios, videos o relatos sin costo ni registro previo (solo requiere nombre o pseudónimo).
2. **Curaduría responsable:** Cada contribución pasa por una revisión del administrador antes de ser publicada. Este proceso garantiza:
   - Pertinencia histórica y coherencia con la misión del archivo.
   - Calidad técnica mínima del material.
   - Cumplimiento de la licencia CC BY-NC-SA 4.0.
   - Respeto a derechos de autor y privacidad.
3. **Transparencia:** El estado de cada contribución (pendiente / publicada) es visible de forma inmediata para el administrador mediante el panel en tiempo real.

### Flujo de contribución

```
Usuario → Completa formulario (nombre + archivo + relato + autorización legal)
       → Inserción en `recuerdos` con `aprobado = false`
       → Notificación Realtime al panel de administración
       → Administrador revisa, edita texto y aprueba o rechaza
       → Si aprueba: `aprobado = true`, el contenido se vuelve visible en el sitio
       → Si rechaza: el registro se elimina de la BD y del Storage
```

### Indicadores de medición de impacto

| Indicador | Cómo se mide | Meta a 5 años |
|-----------|-------------|----------------|
| Recuerdos totales | Conteo de registros en `recuerdos` | 5.000+ |
| Tasa de aprobación | (aprobados / total) × 100 | > 70% |
| Participantes únicos | Conteo de valores distintos en `nombre` | 500+ |
| Visitas al sitio | Google Analytics / contador | 50.000+ |
| Descargas de archivos | Logs de Storage | 10.000+ |
| Sesiones del administrador | Logs de autenticación | Semanal |

---

## 5. Impacto Social

### Dimensión territorial

La Población Francisco de Goya es un sector históricamente postergado de La Pintana, una de las comunas con menor índice de desarrollo socioeconómico del Gran Santiago. La memoria de sus organizaciones comunitarias —especialmente "El Arca" como centro cultural y político— constituye un patrimonio inmaterial en riesgo de desaparición por el envejecimiento de sus portadores originales y la falta de registro sistemático.

### Beneficios esperados

1. **Identidad y pertenencia:** Fortalecer el vínculo de las nuevas generaciones con la historia local, contrarrestando el desarraigo y la estigmatización territorial.
2. **Investigación y educación:** Proveer fuentes primarias accesibles para investigadores y establecimientos educacionales de la comuna.
3. **Reparación simbólica:** Visibilizar las luchas y resistencias populares que han sido sistemáticamente excluidas de la historia oficial.
4. **Transferencia intergeneracional:** Facilitar el diálogo entre portadores de memoria (adultos mayores) y jóvenes mediante plataformas digitales accesibles.
5. **Modelo replicable:** Documentar la metodología de archivo comunitario para que otras poblaciones y organizaciones territoriales puedan adoptarla.

### Sostenibilidad económica

- Sin fines de lucro. El Archivo opera con costos mínimos de infraestructura (hosting + Supabase).
- Postulación a fondos concursables estatales e internacionales para cubrir costos operativos, digitalización de material físico y contratación de un curador dedicado.
- Convenios con universidades (prácticas profesionales en archivística digital) y liceos de la comuna.

---

## 6. Cumplimiento Legal y Ético

- **Licencia:** Creative Commons Reconocimiento-NoComercial-CompartirIgual 4.0 Internacional (CC BY-NC-SA 4.0).
- **Términos y Condiciones:** Publicados en `/terminos.html`, incluyen cláusulas de propiedad intelectual del usuario, uso legítimo, responsabilidad del administrador y protección de datos (Ley 19.628).
- **Permisos:** Cada contribuyente autoriza expresamente el resguardo, digitalización y publicación de su aporte mediante un checkbox obligatorio en el formulario de subida.
- **Privacidad:** No se solicitan datos sensibles. El nombre es un campo libre donde el usuario puede usar un pseudónimo.

---

## 7. Plan de Implementación (Próximos 12 Meses)

| Mes | Hito |
|-----|------|
| 1–2 | Campaña de difusión comunitaria (volantes, redes sociales, reuniones con juntas de vecinos) |
| 3–4 | Jornadas de digitalización: escaneo de fotografía impresa y grabación de testimonios orales |
| 5–6 | Carga masiva de material digitalizado al archivo |
| 7–8 | Evaluación de impacto temprana y ajustes al flujo curatorial |
| 9–10 | Postulación a fondos concursables (Fondart Regional / FNDR 8% Cultura) |
| 11–12 | Publicación de informe de resultados y planificación del año 2 |

---

## 8. Contacto

- **Correo electrónico:** contacto@elarca.cl
- **Sitio web:** https://elarca.cl (o dominio actual de publicación)
- **Administradora:** María José Vargas

---

*Documento generado en Julio 2026. Este informe sigue la estructura estándar de postulación a Fondos de Cultura del Ministerio de las Culturas, las Artes y el Patrimonio de Chile.*
