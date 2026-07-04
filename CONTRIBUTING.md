# Código de Colaboración — El Arca

**Archivo Comunitario de la Población Francisco de Goya, La Pintana.**

El Arca es un proyecto de **Software de Bien Común**: su código fuente está disponible para que cualquier comunidad, organización territorial, colectivo cultural o institución patrimonial pueda replicar este modelo de archivo digital comunitario en su propio territorio.

---

## Licencia

El código fuente de El Arca se distribuye bajo una **licencia dual**:

| Componente | Licencia |
|------------|----------|
| Código fuente (HTML, CSS, JavaScript) | **MIT License** — Uso libre, modificación y redistribución permitida, siempre que se incluya el aviso de copyright original. |
| Documentación (informes, planes de gestión) | **Creative Commons Attribution 4.0 International (CC BY 4.0)** — Puedes compartir y adaptar, con atribución. |
| Contenido del archivo (fotos, audios, relatos) | **CC BY-NC-SA 4.0** — No comercial, compartir igual, atribución requerida. Ver `/terminos.html`. |

El uso de este código implica aceptar los términos de la licencia MIT. Ver archivo `LICENSE` (si existe) o el texto estándar MIT incluido al final de este documento.

---

## ¿Cómo replicar El Arca en tu territorio?

### Requisitos técnicos mínimos

- Un proyecto **Supabase** gratuito (nivel Free: 500 MB de base de datos, 1 GB de Storage).
- Un servidor estático para alojar los archivos HTML (GitHub Pages, Netlify, Vercel, Apache, Nginx, etc.).
- Un navegador web moderno (Chrome 90+, Firefox 90+, Edge 90+, Safari 15+).

### Pasos rápidos

1. **Fork o clona** este repositorio.
2. **Crea un proyecto Supabase** en https://supabase.com y ejecuta el contenido de `supabase/migrations/001_schema.sql` en el Editor SQL.
3. **Configura la autenticación**: en Supabase Auth, habilita el inicio de sesión con email/contraseña. Crea un usuario administrador manualmente.
4. **Configura las variables de entorno**: reemplaza la URL y la anon key de Supabase en el bloque `<script>` inline de `index.html` (busca `supabase.createClient`).
5. **Personaliza la identidad visual**: edita las variables CSS `--color-mir` (color principal), `--color-noche` (fondo oscuro) y textos del navbar.
6. **Despliega los archivos HTML** en tu servidor estático.

### Personalización por territorio

- **Logo y nombre**: Cambia "EL ARCA" por el nombre de tu archivo comunitario en todos los archivos HTML.
- **Taxonomía**: Edita el array `NOMBRES_SECCION` en `admin.html` para reflejar tus propias categorías de archivo (ej: "Fotografías", "Testimonios orales", "Documentos").
- **Dominio**: Reemplaza `contacto@elarca.cl` por tu correo de contacto en `terminos.html` y otros archivos.
- **Mapa**: En `index.html`, actualiza las coordenadas del mapa Leaflet para que apunten a tu localidad.

---

## Arquitectura del proyecto

```
├── *.html              # Frontend (SPA con navegación entre páginas)
├── app.js              # Router central, galería, lightbox
├── audio-player.js     # Reproductor musical con consulta dinámica a Supabase
├── supabase.js         # Carga diferida del SDK de Supabase
├── supabase/
│   └── migrations/
│       └── 001_schema.sql  # Esquema de base de datos completo
├── plan-gestion.html   # Plan de preservación a 20 años
├── terminos.html       # Términos CC BY-NC-SA 4.0
├── informe-proyecto.md # Pitch para postulación a fondos
└── CONTRIBUTING.md     # Este archivo
```

### Flujo de datos

```
Contribuyente → index.html (formulario público)
             → Supabase Insert (recuerdos, aprobado=false)
             → Realtime notification → admin.html (panel)
             → Curador revisa, edita, aprueba/rechaza
             → Si aprueba: visible en galería, videos o relatos
             → Si rechaza: log en tabla rechazos, borrado de BD + Storage
```

---

## Contribuir al desarrollo

### Reportar problemas

Abre un issue en el repositorio describiendo:
- El comportamiento esperado vs. real.
- Pasos para reproducir.
- Capturas de pantalla si aplica.
- Consola del navegador (F12 → Console) si hay errores.

### Enviar cambios (Pull Requests)

1. Haz fork del repositorio.
2. Crea una rama (`git checkout -b feature/mi-mejora`).
3. Realiza cambios mínimos y enfocados.
4. Asegúrate de que el código existente no se rompa:
   - Verifica que `index.html` carga sin errores en la consola.
   - Prueba el flujo de subida pública y aprobación.
   - Prueba el reproductor de música.
5. Envía un PR con descripción clara del cambio.

### Estilo de código

- **JavaScript**: ES5 compatible (sin transpilación). Usa `var`, funciones declarativas, sin arrow functions ni template literals para máxima compatibilidad con navegadores antiguos.
- **CSS**: Tailwind CSS v4 vía CDN + estilos inline. Evita archivos CSS externos. Usa `!important` cuando sea necesario para anular Tailwind.
- **HTML**: Semántico, con `aria-label` en todos los controles interactivos para cumplir WCAG 2.1.
- No uses librerías externas (excepto Supabase CDN y Tailwind CDN).

---

## Valores del proyecto

1. **Memoria popular**: El archivo pertenece a la comunidad, no a una institución.
2. **Acceso abierto**: Todo el contenido es libre y gratuito bajo CC BY-NC-SA 4.0.
3. **Curaduría responsable**: No todo lo que se envía se publica; hay un filtro editorial.
4. **Soberanía técnica**: El código debe poder ejecutarse con recursos mínimos y sin dependencias de plataformas comerciales cerradas.
5. **Replicabilidad**: Cualquier comunidad debe poder adaptar este software a su propia memoria territorial.

---

## Contacto del proyecto original

- **Correo:** contacto@elarca.cl
- **Administradora:** María José Vargas

---

*"Este archivo no es un museo. No es un depósito de polvo. Es una trinchera de memoria."*

---

## Texto estándar de licencia MIT

```
MIT License

Copyright (c) 2026 El Arca — Archivo Comunitario

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
