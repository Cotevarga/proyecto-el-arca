const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

const app = express();
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
    // Desactivar estas políticas permite que el navegador acepte los scripts de streaming de YouTube vía ngrok
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
  ];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.mp3', '.wav'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Formato no permitido. Solo JPG, PNG, MP3, WAV.'), false);
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

// ─── Nodemailer transporter ──────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── POST /api/upload ─────────────────────────────────────────────
app.post('/api/upload', (req, res) => {
  // Validar API Key
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY_SECRET) {
    return res.status(401).json({ error: 'API Key inválida o ausente.' });
  }

  upload.single('archivo')(req, res, (err) => {
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

    const mailOptions = {
      from: `"Archivo El Arca" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECEIVER,
      subject: `Nuevo recuerdo de ${nombre} — Archivo El Arca`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d97706;">Nuevo aporte al Archivo Comunitario</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; font-weight: bold; color: #374151;">Nombre:</td><td style="padding: 8px;">${escapeHtml(nombre)}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; color: #374151;">Año:</td><td style="padding: 8px;">${escapeHtml(anio)}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; color: #374151;">Mensaje:</td><td style="padding: 8px;">${escapeHtml(mensaje)}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; color: #374151;">Archivo:</td><td style="padding: 8px;">${escapeHtml(req.file.originalname)} (${(req.file.size / 1024).toFixed(1)} KB)</td></tr>
          </table>
          <p style="color: #6b7280; font-size: 12px; margin-top: 16px;">Archivo El Arca — Memoria Viva de La Goya</p>
        </div>
      `,
      attachments: [
        {
          filename: req.file.originalname,
          content: req.file.buffer,
        },
      ],
    };

    transporter.sendMail(mailOptions, (mailErr, info) => {
      if (mailErr) {
        console.error('Error al enviar correo:', mailErr);
        return res.status(500).json({ error: 'Error al enviar el recuerdo. Intenta de nuevo.' });
      }
      console.log('Correo enviado:', info.messageId);
      return res.json({
        success: true,
        message: 'Recuerdo recibido. Gracias por contribuir a la memoria de El Arca.',
      });
    });
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
