# Plan de Sostenibilidad — El Arca

*Proyecto: Archivo Comunitario de la Población Francisco de Goya, La Pintana.*

---

## 1. Mantenimiento Técnico

### Infraestructura actual
- **Hosting web:** Servidor estático (GitHub Pages / Netlify) — **costo $0/mes**.
- **Backend + Storage:** Supabase Free Tier — 500 MB base de datos, 1 GB almacenamiento.
- **Dominio:** elarca.cl — renovación anual ~$15 USD.

### Presupuesto mínimo anual

| Concepto | Costo estimado |
|----------|---------------|
| Dominio (elarca.cl) | $15 USD/año |
| Supabase Pro (si se excede Free Tier) | $25 USD/mes ($300/año) |
| Almacenamiento en frío (backups) | $5–$10 USD/mes |
| **Total estimado** | **~$45–$400 USD/año** |

> El proyecto opera con **$0 de costo fijo** mientras se mantenga dentro del Free Tier de Supabase. Si el archivo crece, el costo máximo proyectado es de ~$400 USD/año, cubierto mediante autogestión comunitaria y postulaciones a fondos de cultura.

### Plan de migración a servidor propio
Si Supabase discontinuara su servicio gratuito o el proyecto requiriera independencia tecnológica:

1. **Base de datos:** Migrar de Supabase a PostgreSQL autogestionado (DigitalOcean $12/mo o VPS propio).
2. **Storage:** Migrar archivos a un bucket S3 compatible (MinIO, Backblaze B2) o servidor físico comunitario.
3. **Frontend:** Los archivos HTML/JS son estáticos y pueden servirse desde cualquier hosting (Apache, Nginx, GitHub Pages).
4. **Tiempo estimado:** 2–3 días hábiles con documentación de migración disponible en el repositorio.

### Monitoreo
- Uso de almacenamiento revisado mensualmente desde el panel de Supabase.
- Alertas de límite configuradas al 80 % de la capacidad del plan gratuito.

---

## 2. Preservación de Datos

### Copias de seguridad

| Tipo | Frecuencia | Destino | Método |
|------|------------|---------|--------|
| Base de datos (PostgreSQL) | Mensual | Google Drive / S3 | Exportación vía `pg_dump` desde Supabase CLI |
| Archivos multimedia (Storage) | Trimestral | Almacenamiento en frío S3 (Backblaze B2 o Wasabi) | Descarga manual de bucket + compresión cifrada |
| Metadatos (JSON) | Mensual | Repositorio GitHub (privado) | Script automatizado que extrae todas las tablas a JSON |

### Verificación de integridad
- Cada archivo en el bucket posee un campo `hash_sha256` en la base de datos.
- Antes de cada backup, se computa el hash de cada archivo y se coteja contra el registro en BD para detectar corrupción silenciosa.

### Plan de recuperación ante desastres
1. Pérdida de base de datos → restaurar desde último dump (pérdida máxima: 1 mes de datos).
2. Pérdida de Storage → restaurar desde backup en frío (pérdida máxima: 3 meses de archivos).
3. Desastre total (BD + Storage corruptos) → reconstruir desde el respaldo cifrado en Google Drive + S3.

> **Política de retención:** Los backups se conservan por un mínimo de 3 versiones consecutivas antes de sobrescribirse.

---

## 3. Continuidad Humana

### Modelo de administración distribuida
El Arca no depende de una sola persona. El proyecto implementa un **modelo de roles**:

| Rol | Función | Personas mínimas |
|-----|---------|------------------|
| **Administrador técnico** | Gestiona Supabase, dominio, despliegues, backups | 2 |
| **Curador/a de contenido** | Revisa, aprueba y clasifica los recuerdos enviados | 2–3 |
| **Facilitador/a pedagógico** | Coordina talleres con escuelas y organizaciones | 2 |
| **Enlace comunitario** | Difunde el proyecto en la población, recoge material analógico | 3–4 |

### Protocolo de traspaso
Si el administrador actual no pudiera continuar:

1. **Repositorio:** El código fuente está en GitHub bajo la organización `el-arca-comunitario` con múltiples administradores agregados.
2. **Supabase:** El acceso al proyecto se comparte mediante un gestor de contraseñas comunitario (Bitwarden, con acceso a 2 personas como mínimo).
3. **Dominio:** El registro del dominio está bajo un correo corporativo (`admin@elarca.cl`) con 2 contactos de respaldo.
4. **Documentación:** Todos los procedimientos están escritos en el repositorio (`CONTRIBUTING.md`, `PLAN-SOSTENIBILIDAD.md`, `plan-gestion.html`).

### Capacitación continua
- Cada nuevo administrador pasa por un período de acompañamiento de 1 mes con el saliente.
- Los talleres comunitarios incluyen un módulo de "administración básica" para que cualquier vecino pueda operar el panel de control.

---

*"Un archivo que no se sostiene no es memoria, es ruido."*
