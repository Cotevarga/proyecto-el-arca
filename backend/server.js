const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

require('dotenv').config();

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;

// ─── Supabase Clients ────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const JWT_SECRET = process.env.JWT_SECRET || 'MI_JWT_SECRETO_LOCAL_2026';
const STORAGE_BUCKET = process.env.STORAGE_BUCKET || 'elarca';

// ─── Helmet ──────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "cdn.jsdelivr.net", "*.youtube.com", "s.ytimg.com", "https://*.vercel.app"],
        styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:", "*.googleusercontent.com", "*.youtube.com", "i.ytimg.com", "*.supabase.co"],
        frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com", "https://*.google.com", "https://*.googleusercontent.com"],
        connectSrc: ["'self'", "https://*.youtube.com", "https://*.google.com", "https://*.ytimg.com", "https://*.vercel.app", "https://*.onrender.com", "https://*.supabase.co"]
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false
  })
);

// ─── CORS ────────────────────────────────────────────────────
const allowedOrigins = [
  'https://proyecto-el-arca.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5500',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No autorizado por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['X-API-Key', 'Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Frontend estático ───────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── Rate limiting ───────────────────────────────────────────
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/upload', uploadLimiter);
app.use('/api/subir', uploadLimiter);

// ─── Multer ──────────────────────────────────────────────────
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'audio/mpeg',
    'audio/wav', 'audio/wave', 'video/mp4'
  ];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.mp3', '.wav', '.mp4'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Formato no permitido. Solo JPG, PNG, MP3, WAV, MP4.'), false);
  }
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024, files: 1 } });

// ─── JWT Middleware ──────────────────────────────────────────
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acceso requerido.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

// ─── Helpers ─────────────────────────────────────────────────
function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, (c) => map[c]);
}

function isSupabaseAvailable() {
  return supabaseAdmin !== null && supabase !== null;
}

// ─── ADMIN ROUTES ────────────────────────────────────────────

// POST /api/admin/login — autenticación
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos.' });
    }
    if (!isSupabaseAvailable()) {
      return res.status(503).json({ error: 'Servicio de autenticación no disponible.' });
    }
    const { data: users, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, password_hash, nombre')
      .eq('email', email)
      .limit(1);

    if (error || !users || users.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }
    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, nombre: user.nombre },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user.id, email: user.email, nombre: user.nombre } });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET /api/admin/recuerdos — listar todos (pendientes + aprobados)
app.get('/api/admin/recuerdos', authenticateJWT, async (req, res) => {
  try {
    if (!isSupabaseAvailable()) {
      return res.status(503).json({ error: 'Base de datos no disponible.' });
    }
    const { data, error } = await supabaseAdmin
      .from('recuerdos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error al listar recuerdos:', err);
    res.status(500).json({ error: 'Error al obtener recuerdos.' });
  }
});

// PUT /api/admin/recuerdos/:id/aprobar
app.put('/api/admin/recuerdos/:id/aprobar', authenticateJWT, async (req, res) => {
  try {
    if (!isSupabaseAvailable()) {
      return res.status(503).json({ error: 'Base de datos no disponible.' });
    }
    const updateData = { aprobado: true };
    if (req.body.seccion) {
      const seccionesValidas = ['relatos', 'legado', 'jano', 'arca', 'organizaciones', 'general'];
      if (seccionesValidas.includes(req.body.seccion)) {
        updateData.seccion = req.body.seccion;
      }
    }
    const { data, error } = await supabaseAdmin
      .from('recuerdos')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, recuerdo: data });
  } catch (err) {
    console.error('Error al aprobar recuerdo:', err);
    res.status(500).json({ error: 'Error al aprobar recuerdo.' });
  }
});

// ─── Admin: Subida manual (aprobado=true, con sección) ───
app.post('/api/admin/subir', authenticateJWT, upload.single('archivo'), async (req, res) => {
  try {
    const { texto, seccion } = req.body;
    const seccionesValidas = ['relatos', 'legado', 'jano', 'arca', 'organizaciones', 'general'];
    const seccionFinal = seccionesValidas.includes(seccion) ? seccion : 'general';

    if (!req.file) {
      return res.status(400).json({ error: 'Debes subir un archivo (imagen o video).' });
    }

    let url_publica = '';
    let tipo = req.file.mimetype.startsWith('video/') ? 'video' : 'imagen';

    if (isSupabaseAvailable()) {
      try {
        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `admin-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
            cacheControl: '3600',
            upsert: false
          });
        if (!uploadError && uploadData) {
          const { data: urlData } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
          url_publica = urlData.publicUrl;
        }
      } catch (storageErr) {
        console.error('Error al subir a Storage:', storageErr.message);
      }
    }

    if (!url_publica) {
      const fileName = `admin-${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filePath = path.join(__dirname, '..', 'frontend', 'images', fileName);
      fs.writeFileSync(filePath, req.file.buffer);
      url_publica = `/images/${fileName}`;
    }

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('recuerdos')
      .insert({
        url: url_publica,
        texto: texto || '',
        tipo: tipo,
        aprobado: true,
        seccion: seccionFinal,
        nombre: 'Admin',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) throw insertError;
    res.json({ success: true, recuerdo: insertData });
  } catch (err) {
    console.error('Error en subida manual:', err);
    res.status(500).json({ error: 'Error en subida manual.' });
  }
});

// DELETE /api/admin/recuerdos/:id — rechazar (eliminar)
app.delete('/api/admin/recuerdos/:id', authenticateJWT, async (req, res) => {
  try {
    if (!isSupabaseAvailable()) {
      return res.status(503).json({ error: 'Base de datos no disponible.' });
    }
    const { data: recuerdo } = await supabaseAdmin
      .from('recuerdos')
      .select('storage_path')
      .eq('id', req.params.id)
      .single();

    if (recuerdo && recuerdo.storage_path) {
      await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([recuerdo.storage_path]);
    }
    const { error } = await supabaseAdmin
      .from('recuerdos')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Error al eliminar recuerdo:', err);
    res.status(500).json({ error: 'Error al eliminar recuerdo.' });
  }
});

// GET /api/admin/musica — listar canciones
app.get('/api/admin/musica', authenticateJWT, async (req, res) => {
  try {
    if (!isSupabaseAvailable()) {
      return res.status(503).json({ error: 'Base de datos no disponible.' });
    }
    const { data, error } = await supabaseAdmin
      .from('musica_reproductor')
      .select('*')
      .order('orden', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error al listar música:', err);
    res.status(500).json({ error: 'Error al obtener música.' });
  }
});

// POST /api/admin/musica — subir canción
app.post('/api/admin/musica', authenticateJWT, upload.single('archivo'), async (req, res) => {
  try {
    if (!isSupabaseAvailable()) {
      return res.status(503).json({ error: 'Base de datos no disponible.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No se adjuntó ningún archivo.' });
    }
    const titulo = req.body.titulo || req.file.originalname.replace(/\.[^/.]+$/, '');
    const artista = req.body.artista || 'El Arca';
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const fileName = `musica/${Date.now()}_${Math.random().toString(36).substring(2, 8)}${fileExt}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);
    const url_mp3 = urlData.publicUrl;

    const { data, error: dbError } = await supabaseAdmin
      .from('musica_reproductor')
      .insert({
        titulo,
        artista,
        url_mp3,
        storage_path: fileName,
        activo: true
      })
      .select()
      .single();
    if (dbError) throw dbError;

    res.json({ success: true, cancion: data });
  } catch (err) {
    console.error('Error al subir canción:', err);
    res.status(500).json({ error: 'Error al subir canción.' });
  }
});

// DELETE /api/admin/musica/:id
app.delete('/api/admin/musica/:id', authenticateJWT, async (req, res) => {
  try {
    if (!isSupabaseAvailable()) {
      return res.status(503).json({ error: 'Base de datos no disponible.' });
    }
    const { data: cancion } = await supabaseAdmin
      .from('musica_reproductor')
      .select('storage_path')
      .eq('id', req.params.id)
      .single();
    if (cancion && cancion.storage_path) {
      await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([cancion.storage_path]);
    }
    const { error } = await supabaseAdmin
      .from('musica_reproductor')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Error al eliminar canción:', err);
    res.status(500).json({ error: 'Error al eliminar canción.' });
  }
});

// PUT /api/admin/musica/:id — toggle activo
app.put('/api/admin/musica/:id', authenticateJWT, async (req, res) => {
  try {
    if (!isSupabaseAvailable()) {
      return res.status(503).json({ error: 'Base de datos no disponible.' });
    }
    const { activo } = req.body;
    const { data, error } = await supabaseAdmin
      .from('musica_reproductor')
      .update({ activo })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, cancion: data });
  } catch (err) {
    console.error('Error al actualizar canción:', err);
    res.status(500).json({ error: 'Error al actualizar canción.' });
  }
});

// ─── PUBLIC ROUTES ───────────────────────────────────────────

// GET /api/musica — canciones activas para el reproductor público
app.get('/api/musica', async (_req, res) => {
  try {
    if (!isSupabaseAvailable()) {
      const fallback = [
        { id: 'local-1', titulo: 'Radio Libre', artista: 'El Arca', url_mp3: '/musica/index.mp3', activo: true },
        { id: 'local-2', titulo: 'Radio Libre 2', artista: 'El Arca', url_mp3: '/musica/index2.mp3', activo: true },
        { id: 'local-3', titulo: 'Radio Libre 3', artista: 'El Arca', url_mp3: '/musica/index3.mp3', activo: true }
      ];
      return res.json(fallback);
    }
    const { data, error } = await supabase
      .from('musica_reproductor')
      .select('id, titulo, artista, url_mp3')
      .eq('activo', true)
      .order('orden', { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) {
      const fallback = [
        { id: 'local-1', titulo: 'Radio Libre', artista: 'El Arca', url_mp3: '/musica/index.mp3' }
      ];
      return res.json(fallback);
    }
    res.json(data);
  } catch (err) {
    console.error('Error al obtener música:', err);
    res.json([
      { id: 'local-1', titulo: 'Radio Libre', artista: 'El Arca', url_mp3: '/musica/index.mp3' }
    ]);
  }
});

// GET /api/galeria — fotos aprobadas
app.get('/api/galeria', async (_req, res) => {
  try {
    if (!isSupabaseAvailable()) {
      const localImages = [
        { id: 'local-1', url: '/images/FB_IMG_1782701605358.jpg', titulo: 'El Cabezón Jano', descripcion: 'Pedro Alejandro González Reyes' },
        { id: 'local-2', url: '/images/FB_IMG_1782701655071.jpg', titulo: 'Sede El Arca', descripcion: 'El espacio físico' },
        { id: 'local-3', url: '/images/FB_IMG_1782701775498.jpg', titulo: 'Jano pintando', descripcion: 'Construyendo el espacio' },
        { id: 'local-4', url: '/images/FB_IMG_1782701859802.jpg', titulo: 'Actividades', descripcion: 'Navidad Popular' },
        { id: 'local-5', url: '/images/FB_IMG_1782701766075.jpg', titulo: 'Marcha', descripcion: 'La Goya en las calles' },
        { id: 'local-6', url: '/images/FB_IMG_1782701826979.jpg', titulo: 'TV Comunitaria', descripcion: 'Sueño de comunicación popular' },
        { id: 'local-7', url: '/images/jano_inicio.jpg', titulo: 'El Jano', descripcion: 'Su mirada y lucha' },
        { id: 'local-8', url: '/images/navidad_popular.jpg', titulo: 'Infancias', descripcion: 'Talleres para niñas y niños' },
        { id: 'local-9', url: '/images/companeros_melon.jpg', titulo: 'Compañeros', descripcion: 'Memoria de quienes partieron' },
        { id: 'local-10', url: '/images/radio_libre.jpg', titulo: 'Radio Libre', descripcion: 'Dial radial comunitario' },
        { id: 'local-11', url: '/images/antupeñi.jpeg', titulo: 'Antupeñi', descripcion: 'Hijos del Sol' }
      ];
      return res.json(localImages);
    }
    const { data, error } = await supabase
      .from('recuerdos')
      .select('id, nombre, anio, mensaje, url_archivo, tipo_archivo, created_at')
      .eq('aprobado', true)
      .in('tipo_archivo', ['image/jpeg', 'image/png'])
      .order('created_at', { ascending: false });
    if (error) throw error;
    const localImages = [
      { id: 'local-1', url: '/images/FB_IMG_1782701605358.jpg', titulo: 'El Cabezón Jano', descripcion: 'Pedro Alejandro González Reyes' },
      { id: 'local-2', url: '/images/FB_IMG_1782701655071.jpg', titulo: 'Sede El Arca', descripcion: 'El espacio físico' },
      { id: 'local-3', url: '/images/FB_IMG_1782701775498.jpg', titulo: 'Jano pintando', descripcion: 'Construyendo el espacio' },
      { id: 'local-4', url: '/images/FB_IMG_1782701859802.jpg', titulo: 'Actividades', descripcion: 'Navidad Popular' },
      { id: 'local-5', url: '/images/FB_IMG_1782701766075.jpg', titulo: 'Marcha', descripcion: 'La Goya en las calles' },
      { id: 'local-6', url: '/images/FB_IMG_1782701826979.jpg', titulo: 'TV Comunitaria', descripcion: 'Sueño de comunicación popular' },
      { id: 'local-7', url: '/images/jano_inicio.jpg', titulo: 'El Jano', descripcion: 'Su mirada y lucha' },
      { id: 'local-8', url: '/images/navidad_popular.jpg', titulo: 'Infancias', descripcion: 'Talleres para niñas y niños' },
      { id: 'local-9', url: '/images/companeros_melon.jpg', titulo: 'Compañeros', descripcion: 'Memoria de quienes partieron' },
      { id: 'local-10', url: '/images/radio_libre.jpg', titulo: 'Radio Libre', descripcion: 'Dial radial comunitario' },
      { id: 'local-11', url: '/images/antupeñi.jpeg', titulo: 'Antupeñi', descripcion: 'Hijos del Sol' }
    ];
    if (!data || data.length === 0) return res.json(localImages);
    const dbImages = data.map(r => ({
      id: r.id,
      url: r.url_archivo,
      titulo: `Aporte de ${r.nombre}`,
      descripcion: r.mensaje || `${r.nombre} (${r.anio || 'año desconocido'})`
    }));
    res.json([...localImages, ...dbImages]);
  } catch (err) {
    console.error('Error al obtener galería:', err);
    const fallback = [
      { id: 'local-1', url: '/images/FB_IMG_1782701605358.jpg', titulo: 'El Cabezón Jano', descripcion: 'Pedro Alejandro González Reyes' }
    ];
    res.json(fallback);
  }
});

// ─── Health check ────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Archivo El Arca',
    supabase: isSupabaseAvailable() ? 'conectado' : 'no configurado',
    version: '2.0.0'
  });
});

// ─── Upload handler (original + Supabase) ────────────────────
const uploadHandler = (req, res) => {
  upload.single('archivo')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'El archivo supera los 50 MB.' });
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'No se adjuntó ningún archivo.' });

    const nombre = req.body.nombre || 'Anónimo';
    const anio = req.body.anio || '';
    const mensaje = req.body.mensaje || '';
    let subioASupabase = false;
    let urlArchivo = '';

    // Guardar en Supabase Storage si está configurado
    if (isSupabaseAvailable()) {
      try {
        const folder = req.file.mimetype.startsWith('image/') ? 'galeria' : 'recuerdos';
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}${fileExt}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false
          });
        if (!uploadError) {
          const { data: urlData } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
          urlArchivo = urlData.publicUrl;

          await supabaseAdmin.from('recuerdos').insert({
            nombre,
            anio,
            mensaje,
            tipo_archivo: req.file.mimetype,
            url_archivo: urlArchivo,
            storage_path: fileName,
            nombre_original: req.file.originalname,
            tamanio_bytes: req.file.size,
            aprobado: false
          });
          subioASupabase = true;
        }
      } catch (supaErr) {
        console.error('Error al subir a Supabase (no crítico):', supaErr);
      }
    }

    // Enviar correo con Resend (siempre, como backup)
    const htmlContent = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;padding:20px;border-radius:8px;">
        <h2 style="color:#E50914;border-bottom:2px solid #E50914;padding-bottom:8px;">Nuevo aporte al Archivo Comunitario</h2>
        <table style="width:100%;border-collapse:collapse;margin-top:15px;">
          <tr><td style="padding:8px;font-weight:bold;color:#374151;width:120px;">Nombre:</td><td style="padding:8px;">${escapeHtml(nombre)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;color:#374151;">Año:</td><td style="padding:8px;">${escapeHtml(anio)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;color:#374151;">Mensaje:</td><td style="padding:8px;">${escapeHtml(mensaje)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;color:#374151;">Archivo:</td><td style="padding:8px;">${escapeHtml(req.file.originalname)} (${(req.file.size / (1024 * 1024)).toFixed(2)} MB)</td></tr>
          ${urlArchivo ? `<tr><td style="padding:8px;font-weight:bold;color:#374151;">URL:</td><td style="padding:8px;"><a href="${escapeHtml(urlArchivo)}">${escapeHtml(urlArchivo)}</a></td></tr>` : ''}
          <tr><td style="padding:8px;font-weight:bold;color:#374151;">Supabase:</td><td style="padding:8px;">${subioASupabase ? '✅ Guardado' : '⚠️ Solo email'}</td></tr>
        </table>
        <p style="color:#6b7280;font-size:12px;margin-top:25px;border-top:1px solid #eee;padding-top:10px;">Archivo El Arca — Memoria Viva Territorial</p>
      </div>
    `;

    try {
      console.log('Enviando correo vía Resend...');
      const base64Content = req.file.buffer.toString('base64');
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Archivo El Arca <onboarding@resend.dev>',
          to: process.env.EMAIL_RECEIVER || 'archivo.elarca@gmail.com',
          subject: `Nuevo recuerdo de ${nombre} — Archivo El Arca`,
          html: htmlContent,
          attachments: [{ filename: req.file.originalname, content: base64Content }]
        })
      });
      const resendData = await resendResponse.json();
      if (!resendResponse.ok) {
        console.error('Error Resend:', resendData);
        throw new Error(resendData.message || 'Fallo Resend');
      }
      console.log('Correo enviado ID:', resendData.id);
    } catch (apiErr) {
      console.error('Error envío correo:', apiErr);
    }

    res.json({
      success: true,
      message: 'Recuerdo recibido con éxito. Gracias por contribuir a la memoria de El Arca.',
      supabase: subioASupabase
    });
  });
};

app.post('/api/upload', uploadHandler);
app.post('/api/subir', uploadHandler);

// ─── Frontend routes ─────────────────────────────────────────
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));
app.get('/galeria', (_req, res) => res.sendFile(path.join(__dirname, '../frontend/galeria.html')));
app.get('/videos', (_req, res) => res.sendFile(path.join(__dirname, '../frontend/videos.html')));
app.get('/relatos', (_req, res) => res.sendFile(path.join(__dirname, '../frontend/relatos.html')));
app.get('/legado', (_req, res) => res.sendFile(path.join(__dirname, '../frontend/legado.html')));
app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, '../frontend/admin.html')));
app.get('/relatos/jano', (_req, res) => res.sendFile(path.join(__dirname, '../frontend/relatos/jano.html')));
app.get('/relatos/arca', (_req, res) => res.sendFile(path.join(__dirname, '../frontend/relatos/arca.html')));
app.get('/relatos/organizaciones', (_req, res) => res.sendFile(path.join(__dirname, '../frontend/relatos/organizaciones.html')));
app.get('/relatos/anecdotas', (_req, res) => res.sendFile(path.join(__dirname, '../frontend/relatos/anecdotas.html')));
app.get('/relatos/jano-arca', (_req, res) => res.sendFile(path.join(__dirname, '../frontend/relatos/jano-arca.html')));

// ─── Catch-all ───────────────────────────────────────────────
app.get(/.*/, (_req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));

// ─── Error handler global ────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Error no capturado:', err);
  res.status(500).json({
    error: 'Servicio degradado temporalmente. El Arca sigue en pie.',
    code: err.code || 'INTERNAL_ERROR'
  });
});

// ─── Export para Vercel ──────────────────────────────────────
module.exports = app;

// ─── Inicio local ────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor de El Arca corriendo en http://localhost:${PORT}`);
    console.log(`Supabase: ${isSupabaseAvailable() ? '✅ Conectado' : '⚠️ No configurado'}`);
    console.log('Endpoints:');
    console.log('  POST /api/admin/login');
    console.log('  GET  /api/admin/recuerdos');
    console.log('  PUT  /api/admin/recuerdos/:id/aprobar');
    console.log('  DELETE /api/admin/recuerdos/:id');
    console.log('  GET  /api/admin/musica');
    console.log('  POST /api/admin/musica');
    console.log('  DELETE /api/admin/musica/:id');
    console.log('  GET  /api/musica (público)');
    console.log('  GET  /api/galeria (público)');
    console.log('  POST /api/upload /api/subir');
    console.log('  GET  /admin — Panel de control');
  });
}
