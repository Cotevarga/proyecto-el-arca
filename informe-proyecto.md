# Informe de Proyecto: Archivo Comunitario "El Arca"

**Memoria Viva de la Población Francisco de Goya — La Pintana, Región Metropolitana, Chile**

---

## a) El Problema: Riesgo de Pérdida de Memoria Inmaterial Local en la Era Digital

La Población Francisco de Goya (Paradero 30½ de Santa Rosa, La Pintana) es un territorio de fuerte organización comunitaria que, desde la década de 1980, ha sido cuna de movimientos sociales, culturales y políticos. Figuras como Pedro Jano González y organizaciones como el centro cultural "El Arca" constituyen un patrimonio inmaterial de alto valor, pero enfrentan tres amenazas críticas:

1. **Envejecimiento de portadores:** Los testigos directos de la historia del territorio —dirigentes sociales, pobladores fundadores, activistas— tienen en promedio más de 65 años. Cada año que pasa sin registro sistemático, una parte irrecuperable de la memoria colectiva se pierde.
2. **Fragmentación del archivo:** Las fotografías, documentos y registros existentes están dispersos en hogares particulares, sin condiciones de conservación adecuadas (humedad, luz solar, deterioro físico). No existe un catálogo central ni un estándar de metadatos que permita su recuperación.
3. **Brecha digital territorial:** La Pintana es una de las comunas con menor índice de desarrollo socioeconómico del Gran Santiago. Las plataformas comerciales de archivo (Google Fotos, Facebook, Instagram) no están diseñadas para la preservación a largo plazo ni para la curaduría comunitaria, y sus términos de servicio no garantizan la soberanía de la comunidad sobre su propia memoria.

**Sin intervención, en menos de 10 años habremos perdido la mayor parte de la memoria viva de este territorio.**

---

## b) La Solución: Modelo Híbrido Participativo + Curatorial

"El Arca" implementa un **Sistema de Gestión Patrimonial** que combina la apertura participativa con la supervisión curatorial profesional:

### Arquitectura del sistema

```
[Comunidad] → Formulario público (subida abierta, sin registro)
           → Inserción en base de datos con estado "pendiente"
           → Notificación Realtime al panel de curaduría
           → Curador revisa, edita metadatos, aprueba o rechaza
           → Si aprueba: publicación automática con licencia CC BY-NC-SA 4.0
           → Si rechaza: registro de auditoría con causal documentada
```

### Componentes del modelo

| Dimensión | Mecanismo |
|-----------|-----------|
| **Participación** | Formulario público anónimo. Sin registro. Sin costo. Sin intermediarios. |
| **Curaduría** | Panel de administración con flujo de aprobación/rechazo, edición de metadatos, selección de taxonomía. |
| **Licenciamiento** | CC BY-NC-SA 4.0 obligatorio. Checkbox de autorización legal. Atribución protegida. |
| **Preservación** | Supabase Storage + backups externos + hash SHA-256 por archivo. |
| **Acceso** | Frontend web gratuito, sin autenticación para lectura. SPA con navegación por secciones. |
| **Trazabilidad** | Cada decisión curatorial queda registrada en tabla `rechazos` con razón, detalle y responsable. |

### Innovación del modelo

A diferencia de plataformas comerciales (Google Fotos, Flickr) o repositorios institucionales cerrados, "El Arca" ofrece:

- **Soberanía comunitaria:** Los datos pertenecen a la comunidad, no a una corporación.
- **Código abierto:** Cualquier comunidad puede replicar el software (ver `CONTRIBUTING.md`).
- **Costo casi cero:** Opera con el nivel gratuito de Supabase + hosting estático.
- **Sin publicidad ni extracción de datos:** No se monetiza la memoria.

---

## c) Indicadores de Impacto (KPIs)

### Línea base (Julio 2026)

| Indicador | Valor actual | Meta 12 meses | Meta 5 años |
|-----------|-------------|---------------|-------------|
| Recuerdos totales en base de datos | — | 500+ | 5.000+ |
| Recuerdos aprobados y publicados | — | 350+ | 3.500+ |
| Tasa de aprobación | — | > 70% | > 75% |
| Participantes únicos (nombres distintos) | — | 100+ | 500+ |
| Volumen de archivo preservado | — | 5+ GB | 50+ GB |
| Etiquetas (tags) aplicadas | — | 50+ categorías | 200+ |
| Cobertura geográfica (ubicaciones) | — | 10+ puntos | 50+ puntos |
| Visitas al sitio | — | 5.000+ | 50.000+ |
| Comunidades reutilizando el software | — | 1 | 5+ |

### Método de medición

- Todos los KPIs se calculan automáticamente desde la base de datos PostgreSQL mediante consultas SQL.
- El dashboard de administración (`admin.html`) muestra en tiempo real: total de recuerdos, vecinos participantes únicos (distinct normalizado) y GB preservados.
- La tabla `rechazos` permite auditar la tasa y causales de rechazo.
- El plan de gestión (`plan-gestion.html`) documenta la estrategia de monitoreo continuo.

---

## d) Plan de Sostenibilidad a Largo Plazo (2026–2046)

### Infraestructura

| Recurso | Proveedor actual | Costo | Plan de continuidad |
|---------|------------------|-------|---------------------|
| Base de datos | Supabase PostgreSQL | Gratuito (500 MB) | Migración a plan escalable ($25/mes) si se supera el límite |
| Almacenamiento | Supabase Storage (S3) | Gratuito (1 GB) | Migración a Backblaze B2 ($0.006/GB/mes) + Cloudflare |
| Hosting frontend | Apache/GitHub Pages | Gratuito | Sin cambios previstos |
| Backups diarios | Supabase automático | Incluido | Exportación mensual a Google Drive + disco externo cifrado |
| Backups semestrales | Amazon S3 Glacier | ~$1/mes por 10 GB | Aumento de capacidad según crecimiento |

### Migración de formatos

| Formato actual | Riesgo de obsolescencia | Plan de migración |
|----------------|------------------------|-------------------|
| JPEG | Bajo a 10 años | Convertir a JPEG XL si el estándar se consolida |
| MP3 | Medio a 15 años | Migrar a Opus/AAC con script automatizado |
| MP4 (H.264) | Medio a 10 años | Migrar a AV1 si el soporte en navegadores se generaliza |
| Texto plano (HTML) | Sin riesgo | No requiere migración |

### Rol curatorial

El proyecto requiere un curador dedicado con las siguientes responsabilidades:
- Revisión y aprobación de contribuciones (estimado: 2 horas/semana por cada 100 contribuciones).
- Digitalización de material físico (escaneo, grabación de testimonios).
- Mantenimiento de infraestructura técnica.
- Postulación a fondos concursables.
- Capacitación de nuevos administradores.

### Presupuesto operativo anual estimado

| Ítem | Costo actual | Costo con crecimiento |
|------|-------------|----------------------|
| Supabase Pro | $0 | $300/año |
| Storage adicional | $0 | $120/año |
| Dominio | $0 (subdominio) | $15/año |
| Backups externos | $0 (Google Drive) | $60/año (S3 Glacier) |
| Digitalización | $0 (equipo propio) | $500/año (escáner + micrófono) |
| **Total** | **~$0** | **~$995/año** |

---

## e) Gobernanza: Protocolo de Curaduría

### ¿Quién decide qué se archiva?

La decisión final de aprobación o rechazo recae en él o la **Administradora del Archivo**, rol actualmente ejercido por María José Vargas. Las decisiones se rigen por el siguiente protocolo documentado:

### Criterios de aprobación

Un recuerdo es aprobado si cumple **todos** estos criterios:

1. **Pertinencia territorial:** El contenido está directamente relacionado con la Población Francisco de Goya, sus habitantes, organizaciones o historia.
2. **Valor patrimonial:** Aporta información única sobre la memoria colectiva del territorio (no es duplicado ni trivial).
3. **Calidad técnica mínima:** La imagen/audio/video es legible o audible. No se requiere calidad profesional.
4. **Autorización legal:** El checkbox de aceptación de términos está marcado.
5. **No ofensivo:** El contenido no promueve discursos de odio, violencia explícita ni viola derechos de terceros.

### Criterios de rechazo

| Causal | Ejemplo | Acción |
|--------|---------|--------|
| Falta de valor patrimonial | Foto genérica sin contexto territorial | Rechazo + registro en log |
| Contenido ofensivo | Discurso de odio, violencia gráfica | Rechazo + registro en log |
| Calidad técnica insuficiente | Imagen ilegible, audio sin contenido | Rechazo + registro en log |
| Otro | Error en la subida, duplicado | Rechazo + registro en log |

### Transparencia

- Cada rechazo queda registrado en la tabla `rechazos` con: `recuerdo_id`, `razón`, `detalle` opcional, `revisado_por` y `timestamp`.
- No existe obligación de notificar al contribuyente, aunque el administrador puede hacerlo a su criterio.
- El protocolo de curaduría se revisa anualmente y se actualiza en este documento.

### Principios rectores

1. **No censura ideológica:** No se rechazarán contenidos por su posición política, social o religiosa.
2. **Pluralidad:** El archivo busca representar la diversidad de voces del territorio, no una narrativa única.
3. **Preservación del sentido:** El curador puede editar ortografía o claridad del texto, pero no alterar el significado ni el contexto del relato original.
4. **Reversibilidad:** Un recuerdo aprobado puede ser retirado posteriormente si se descubre que infringe derechos de terceros o si el contribuyente lo solicita formalmente.

---

## Ficha del proyecto

| Campo | Valor |
|-------|-------|
| **Nombre** | Archivo Comunitario "El Arca" |
| **Territorio** | Población Francisco de Goya, La Pintana, Región Metropolitana, Chile |
| **Misión** | Salvaguardar, digitalizar y poner en valor la memoria colectiva del territorio |
| **Visión** | 10.000+ registros digitales para 2046, accesibles globalmente |
| **Público** | Vecinos, investigadores, estudiantes, organizaciones culturales |
| **Tecnología** | Supabase (PostgreSQL + Storage + Realtime) + Frontend HTML/CSS/JS |
| **Licencia** | MIT (software) / CC BY-NC-SA 4.0 (contenido) |
| **Postulación a** | Fondart Regional, FNDR 8% Cultura, UNESCO Memory of the World, National Endowment for the Humanities, Europa Creativa |

---

## Contacto

- **Correo electrónico:** contacto@elarca.cl
- **Sitio web:** https://elarca.cl
- **Repositorio:** https://github.com/elarca/archivo
- **Administradora:** María José Vargas

---

*Documento generado en Julio 2026 · Versión 3.0 — Estructura alineada con estándares UNESCO Memory of the World y Europa Creativa.*
