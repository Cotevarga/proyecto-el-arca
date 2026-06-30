const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

const app = express();
// Indicar a Express que confíe en el proxy inverso de Render (elimina alertas de rate-limit)
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;

// ─── Helmet: seguridad en cabeceras HTTP ──────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "cdn.jsdelivr.net", "*.youtube.com", "s.ytimg.com", "https://*.vercel.app"],
        styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:", "*.googleusercontent.com", "*.youtube.com", "i.ytimg.com"],
        frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com", "https://*.google.com", "https://*.googleusercontent.com"],
        connectSrc: ["'self'", "https://*.youtube.com", "https://*.google.com", "https://*.ytimg.com", "https://*.vercel.app", "https://*.onrender.com"]
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false
  })
);

// ─── CORS: solo el frontend ───────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['POST'],
    allowedHeaders: ['X-API-Key', 'Content-Type'],
  })
);

// ─── Servir frontend como estático ───────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── Rate limiting ────────────────────────────────────────────────
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // máximo 20 intentos por IP
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/upload', uploadLimiter);

// ─── Multer: solo memoria, nada en disco ─────────────────────────
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'audio/mpeg',
    'audio/wav',
    'audio/wave',
    'video/mp4',
  ];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.mp3', '.wav', '.mp4'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Formato no permitido. Solo JPG, PNG, MP3, WAV, MP4.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
    files: 1,
  },
});

// ─── POST /api/upload ─────────────────────────────────────────────
app.post('/api/upload', (req, res) => {
  // Validar API Key
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY_SECRET) {
    return res.status(401).json({ error: 'API Key inválida o ausente.' });
  }

  upload.single('archivo')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'El archivo supera los 50 MB.' });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se adjuntó ningún archivo.' });
    }

    const nombre = req.body.nombre || 'Anónimo';
    const anio = req.body.anio || 'Sin año';
    const mensaje = req.body.mensaje || 'Sin mensaje';

    // Construcción del contenido HTML del correo para Resend
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
        <h2 style="color: #E50914; border-bottom: 2px solid #E50914; padding-bottom: 8px;">Nuevo aporte al Archivo Comunitario</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr><td style="padding: 8px; font-weight: bold; color: #374151; width: 120px;">Nombre:</td><td style="padding: 8px;">${escapeHtml(nombre)}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #374151;">Año:</td><td style="padding: 8px;">${escapeHtml(anio)}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #374151;">Mensaje:</td><td style="padding: 8px;">${escapeHtml(mensaje)}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #374151;">Archivo:</td><td style="padding: 8px;">${escapeHtml(req.file.originalname)} (${(req.file.size / (1024 * 1024)).toFixed(2)} MB)</td></tr>
        </table>
        <p style="color: #6b7280; font-size: 12px; margin-top: 25px; border-top: 1px solid #eee; padding-top: 10px;">Archivo El Arca — Memoria Viva Territorial</p>
      </div>
    `;

    try {
      console.log('Iniciando envío de correo vía API de Resend...');
      
      // Convertir el buffer del archivo en una cadena Base64 (Requisito de Resend para adjuntos)
      const base64Content = req.file.buffer.toString('base64');

      // Petición HTTP POST nativa a la API REST de Resend (Bypass total al bloqueo SMTP)
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Archivo El Arca <onboarding@resend.dev>', // Remitente por defecto requerido en cuentas gratuitas
          to: process.env.EMAIL_RECEIVER || 'archivo.elarca@gmail.com',
          subject: `Nuevo recuerdo de ${nombre} — Archivo El Arca`,
          html: htmlContent,
          attachments: [
            {
              filename: req.file.originalname,
              content: base64Content
            }
          ]
        })
      });

      const resendData = await resendResponse.json();

      if (!resendResponse.ok) {
        console.error('Error reportado por la API de Resend:', resendData);
        throw new Error(resendData.message || 'Fallo la respuesta de la API de Resend');
      }

      console.log('Correo enviado con éxito mediante Resend ID:', resendData.id);
      return res.json({
        success: true,
        message: 'Recuerdo recibido con éxito. Gracias por contribuir a la memoria de El Arca.',
      });

    } catch (apiErr) {
      console.error('Error crítico en el flujo de envío HTTP:', apiErr);
      return res.status(500).json({ error: 'Error al procesar o enviar el recuerdo por restricciones de red. Intenta de nuevo.' });
    }
  });
});

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, (c) => map[c]);
}

// ─── Health check ─────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Archivo El Arca' });
});

// ─── Rutas del frontend (multipágina) ────────────────────────────
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/galeria', (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/galeria.html'));
});

app.get('/videos', (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/videos.html'));
});

app.get('/relatos', (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/relatos.html'));
});

app.get('/relatos/jano-arca', (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/relatos/jano-arca.html'));
});

app.get('/relatos/anecdotas', (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/relatos/anecdotas.html'));
});

app.get('/relatos/organizaciones', (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/relatos/organizaciones.html'));
});

// ─── Catch-all: redirigir rutas no existentes al inicio ──────────
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ─── Error handler global ────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Error no capturado:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// ─── Iniciar servidor ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Servidor de El Arca corriendo en http://localhost:${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  POST http://localhost:${PORT}/api/upload`);
  console.log(`  GET  http://localhost:${PORT}/api/health`);
});