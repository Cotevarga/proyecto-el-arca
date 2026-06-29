# Memoria Viva de El Arca

Página web de memoria histórica y popular sobre el Centro Cultural **"El Arca"** y su fundador **Pedro Alejandro González Reyes, "El Cabezón Jano"**, en la Población Francisco de Goya, La Pintana.

---

## Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- [ngrok](https://ngrok.com/) (para exponer a internet)
- Una cuenta de Gmail con **Contraseña de Aplicación** activada

---

## Instalación

### 1. Backend

```bash
cd backend
npm init -y
npm install express helmet express-rate-limit multer nodemailer cors dotenv
```

Edita `backend/.env` con tus datos reales:

| Variable         | Descripción                                    |
|------------------|------------------------------------------------|
| `PORT`           | Puerto del servidor (3000)                     |
| `API_KEY_SECRET` | Clave secreta que frontend y backend compartirán |
| `FRONTEND_URL`   | URL donde corre el frontend                    |
| `EMAIL_USER`     | Tu correo Gmail                                |
| `EMAIL_PASS`     | Contraseña de Aplicación de Gmail              |
| `EMAIL_RECEIVER` | Correo donde llegarán los archivos subidos     |

### 2. Frontend

No requiere instalación. Solo abre `frontend/index.html` en tu navegador o sírvelo con un servidor estático:

```bash
# Opción recomendada: usar Live Server de VS Code
# O con Node:
npx serve frontend
```

Si cambias el puerto del backend, actualiza `API_URL` en `frontend/app.js`.

---

## Uso Local

### 1. Iniciar el backend

```bash
cd backend
node server.js
```

El servidor quedará escuchando en `http://localhost:3000`.

### 2. Abrir el frontend

Abre `frontend/index.html` en tu navegador (o sírvelo con `npx serve frontend`).

---

## Exponer a Internet con ngrok

### Backend

```bash
ngrok http 3000
```

Esto generará una URL como `https://abc123.ngrok-free.app`. Copia esa URL.

### Frontend

Para exponer el frontend (si lo estás sirviendo con un servidor estático en otro puerto):

```bash
ngrok http 5500
```

Luego actualiza el `API_URL` en `frontend/app.js` con la URL del backend en ngrok:

```js
var API_URL = 'https://abc123.ngrok-free.app/api/upload';
```

---

## Seguridad

- **No requiere registro** de usuarios para navegar.
- **Helmet** protege contra XSS, clickjacking y otras vulnerabilidades HTTP.
- **Rate limiting** máximo 20 subidas por IP cada 15 minutos.
- **API Key** estática en cabecera `X-API-Key` — solo el frontend autorizado puede subir archivos.
- **Multer en memoria** — los archivos nunca se escriben en el disco del servidor.
- **Validación doble**: cliente (JS) y servidor (Multer fileFilter + límite de 10 MB).
- **Escapado HTML** en todos los datos mostrados en correos.

---

## Estructura del Proyecto

```
PROYECTO EL ARCA/
├── frontend/
│   ├── index.html          # Página principal con todas las secciones
│   └── app.js              # Lógica del formulario y envío al backend
├── backend/
│   ├── server.js           # Servidor Express con Multer + Nodemailer
│   └── .env                # Variables de entorno (no compartir)
└── README.md
```

---

## Endpoints del Backend

| Método | Ruta            | Descripción                          |
|--------|-----------------|--------------------------------------|
| POST   | `/api/upload`   | Subir archivo al archivo comunitario |
| GET    | `/api/health`   | Health check del servidor            |

---

## Licencia

Memoria Popular — Construido por y para la comunidad de la Población Francisco de Goya, La Pintana.
