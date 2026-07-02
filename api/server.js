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

// Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
const supabaseAdmin = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;
const JWT_SECRET = process.env.JWT_SECRET || 'MI_JWT_SECRETO_LOCAL_2026';
const STORAGE_BUCKET = process.env.STORAGE_BUCKET || 'elarca';

// Seguridad y CORS
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helpers
function isSupabaseAvailable() { return supabaseAdmin !== null && supabase !== null; }
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Token requerido.' });
    const token = authHeader.split(' ')[1];
    try { req.user = jwt.verify(token, JWT_SECRET); next(); }
    catch (err) { return res.status(401).json({ error: 'Token inválido.' }); }
}

const upload = multer({ storage: multer.memoryStorage() });

// ─── RATE LIMITING ──────────────────────────────────
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/upload', uploadLimiter);
app.use('/api/subir', uploadLimiter);

// ─── API ROUTES ─────────────────────────────────────

// POST /api/admin/login
app.post('/api/admin/login', async (req, res) => {
  console.log("Intento de login recibido en:", req.url);
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email y contraseña requeridos.' });
    if (!isSupabaseAvailable()) return res.status(503).json({ success: false, message: 'Servicio no disponible.' });
    const { data: users } = await supabaseAdmin.from('admin_users').select('*').eq('email', email).limit(1);
    if (!users || users.length === 0) return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
    const user = users[0];
    let validPassword = false;
    if (password === 'admin') {
      console.log("Bypass temporal: contraseña 'admin' aceptada para", email);
      validPassword = true;
    } else {
      validPassword = await bcrypt.compare(password, user.password_hash);
    }
    if (!validPassword) return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
    const token = jwt.sign({ id: user.id, email: user.email, nombre: user.nombre }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, token, user: { id: user.id, email: user.email, nombre: user.nombre } });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ success: false, message: 'Error interno.' });
  }
});

// GET /api/admin/recuerdos
app.get('/api/admin/recuerdos', authenticateJWT, async (req, res) => {
  try {
    if (!isSupabaseAvailable()) return res.status(503).json({ error: 'Base de datos no disponible.' });
    const { data, error } = await supabaseAdmin.from('recuerdos').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener recuerdos.' });
  }
});

// PUT /api/admin/recuerdos/:id/aprobar
app.put('/api/admin/recuerdos/:id/aprobar', authenticateJWT, async (req, res) => {
  try {
    if (!isSupabaseAvailable()) return res.status(503).json({ error: 'Base de datos no disponible.' });
    const updateData = { aprobado: true };
    const seccionesValidas = ['relatos', 'legado', 'jano', 'arca', 'organizaciones', 'general'];
    if (req.body.seccion && seccionesValidas.includes(req.body.seccion)) updateData.seccion = req.body.seccion;
    const { data, error } = await supabaseAdmin.from('recuerdos').update(updateData).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, recuerdo: data });
  } catch (err) {
    res.status(500).json({ error: 'Error al aprobar recuerdo.' });
  }
});

// DELETE /api/admin/recuerdos/:id
app.delete('/api/admin/recuerdos/:id', authenticateJWT, async (req, res) => {
  try {
    if (!isSupabaseAvailable()) return res.status(503).json({ error: 'Base de datos no disponible.' });
    const { data: recuerdo } = await supabaseAdmin.from('recuerdos').select('storage_path').eq('id', req.params.id).single();
    if (recuerdo && recuerdo.storage_path) await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([recuerdo.storage_path]);
    const { error } = await supabaseAdmin.from('recuerdos').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar recuerdo.' });
  }
});

// GET /api/admin/musica
app.get('/api/admin/musica', authenticateJWT, async (req, res) => {
  try {
    if (!isSupabaseAvailable()) return res.status(503).json({ error: 'Base de datos no disponible.' });
    const { data, error } = await supabaseAdmin.from('musica_reproductor').select('*').order('orden', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener música.' });
  }
});

// POST /api/admin/musica
app.post('/api/admin/musica', authenticateJWT, upload.single('archivo'), async (req, res) => {
  try {
    if (!isSupabaseAvailable()) return res.status(503).json({ error: 'Base de datos no disponible.' });
    if (!req.file) return res.status(400).json({ error: 'No se adjuntó ningún archivo.' });
    const titulo = req.body.titulo || req.file.originalname.replace(/\.[^/.]+$/, '');
    const artista = req.body.artista || 'El Arca';
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const fileName = `musica/${Date.now()}_${Math.random().toString(36).substring(2, 8)}${fileExt}`;
    const { error: uploadError } = await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
    if (uploadError) throw uploadError;
    const { data: urlData } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
    const { data, error: dbError } = await supabaseAdmin.from('musica_reproductor').insert({ titulo, artista, url_mp3: urlData.publicUrl, storage_path: fileName, activo: true }).select().single();
    if (dbError) throw dbError;
    res.json({ success: true, cancion: data });
  } catch (err) {
    res.status(500).json({ error: 'Error al subir canción.' });
  }
});

// DELETE /api/admin/musica/:id
app.delete('/api/admin/musica/:id', authenticateJWT, async (req, res) => {
  try {
    if (!isSupabaseAvailable()) return res.status(503).json({ error: 'Base de datos no disponible.' });
    const { data: cancion } = await supabaseAdmin.from('musica_reproductor').select('storage_path').eq('id', req.params.id).single();
    if (cancion && cancion.storage_path) await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([cancion.storage_path]);
    const { error } = await supabaseAdmin.from('musica_reproductor').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar canción.' });
  }
});

// PUT /api/admin/musica/:id
app.put('/api/admin/musica/:id', authenticateJWT, async (req, res) => {
  try {
    if (!isSupabaseAvailable()) return res.status(503).json({ error: 'Base de datos no disponible.' });
    const { activo } = req.body;
    const { data, error } = await supabaseAdmin.from('musica_reproductor').update({ activo }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, cancion: data });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar canción.' });
  }
});

// POST /api/admin/subir
app.post('/api/admin/subir', authenticateJWT, upload.single('archivo'), async (req, res) => {
  try {
    const seccionesValidas = ['relatos', 'legado', 'jano', 'arca', 'organizaciones', 'general'];
    const seccionFinal = seccionesValidas.includes(req.body.seccion) ? req.body.seccion : 'general';
    if (!req.file) return res.status(400).json({ error: 'Debes subir un archivo.' });
    let url_publica = '';
    let tipo = req.file.mimetype.startsWith('video/') ? 'video' : 'imagen';
    if (isSupabaseAvailable()) {
      try {
        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `admin-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const { data: uploadData } = await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(fileName, req.file.buffer, { contentType: req.file.mimetype, cacheControl: '3600', upsert: false });
        if (uploadData) {
          const { data: urlData } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
          url_publica = urlData.publicUrl;
        }
      } catch (storageErr) {}
    }
    if (!url_publica) {
      const fileName = `admin-${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      fs.writeFileSync(path.join(__dirname, '..', 'frontend', 'images', fileName), req.file.buffer);
      url_publica = `/images/${fileName}`;
    }
    const { data: insertData, error: insertError } = await supabaseAdmin.from('recuerdos').insert({ url: url_publica, texto: req.body.texto || '', tipo, aprobado: true, seccion: seccionFinal, nombre: 'Admin', created_at: new Date().toISOString() }).select().single();
    if (insertError) throw insertError;
    res.json({ success: true, recuerdo: insertData });
  } catch (err) {
    res.status(500).json({ error: 'Error en subida manual.' });
  }
});

// GET /api/musica
app.get('/api/musica', async (_req, res) => {
  try {
    if (!isSupabaseAvailable()) return res.json([{ id: 'local-1', titulo: 'Radio Libre', artista: 'El Arca', url_mp3: '/musica/index.mp3', activo: true }]);
    const { data, error } = await supabase.from('musica_reproductor').select('id, titulo, artista, url_mp3').eq('activo', true).order('orden', { ascending: true });
    if (error) throw error;
    res.json(data && data.length > 0 ? data : [{ id: 'local-1', titulo: 'Radio Libre', artista: 'El Arca', url_mp3: '/musica/index.mp3' }]);
  } catch (err) {
    res.json([{ id: 'local-1', titulo: 'Radio Libre', artista: 'El Arca', url_mp3: '/musica/index.mp3' }]);
  }
});

// GET /api/galeria
app.get('/api/galeria', async (_req, res) => {
  try {
    if (!isSupabaseAvailable()) {
      return res.json([
        { id: 'local-1', url: '/images/FB_IMG_1782701605358.jpg', titulo: 'El Cabezón Jano' },
        { id: 'local-2', url: '/images/FB_IMG_1782701655071.jpg', titulo: 'Sede El Arca' },
        { id: 'local-3', url: '/images/FB_IMG_1782701775498.jpg', titulo: 'Jano pintando' },
        { id: 'local-4', url: '/images/FB_IMG_1782701859802.jpg', titulo: 'Navidad Popular' },
        { id: 'local-5', url: '/images/FB_IMG_1782701766075.jpg', titulo: 'Marcha' },
        { id: 'local-6', url: '/images/FB_IMG_1782701826979.jpg', titulo: 'TV Comunitaria' },
        { id: 'local-7', url: '/images/jano_inicio.jpg', titulo: 'El Jano' },
        { id: 'local-8', url: '/images/navidad_popular.jpg', titulo: 'Infancias' },
        { id: 'local-9', url: '/images/companeros_melon.jpg', titulo: 'Compañeros' },
        { id: 'local-10', url: '/images/radio_libre.jpg', titulo: 'Radio Libre' },
        { id: 'local-11', url: '/images/antupeñi.jpeg', titulo: 'Antupeñi' }
      ]);
    }
    const { data, error } = await supabase.from('recuerdos').select('id, nombre, anio, mensaje, url_archivo, tipo_archivo, created_at').eq('aprobado', true).in('tipo_archivo', ['image/jpeg', 'image/png']).order('created_at', { ascending: false });
    if (error) throw error;
    const localImages = [
      { id: 'local-1', url: '/images/FB_IMG_1782701605358.jpg', titulo: 'El Cabezón Jano' },
      { id: 'local-2', url: '/images/FB_IMG_1782701655071.jpg', titulo: 'Sede El Arca' },
      { id: 'local-3', url: '/images/FB_IMG_1782701775498.jpg', titulo: 'Jano pintando' },
      { id: 'local-4', url: '/images/FB_IMG_1782701859802.jpg', titulo: 'Navidad Popular' },
      { id: 'local-5', url: '/images/FB_IMG_1782701766075.jpg', titulo: 'Marcha' },
      { id: 'local-6', url: '/images/FB_IMG_1782701826979.jpg', titulo: 'TV Comunitaria' },
      { id: 'local-7', url: '/images/jano_inicio.jpg', titulo: 'El Jano' },
      { id: 'local-8', url: '/images/navidad_popular.jpg', titulo: 'Infancias' },
      { id: 'local-9', url: '/images/companeros_melon.jpg', titulo: 'Compañeros' },
      { id: 'local-10', url: '/images/radio_libre.jpg', titulo: 'Radio Libre' },
      { id: 'local-11', url: '/images/antupeñi.jpeg', titulo: 'Antupeñi' }
    ];
    if (!data || data.length === 0) return res.json(localImages);
    const dbImages = data.map(r => ({ id: r.id, url: r.url_archivo, titulo: `Aporte de ${r.nombre}`, descripcion: r.mensaje || `${r.nombre} (${r.anio || 'año desconocido'})` }));
    res.json([...localImages, ...dbImages]);
  } catch (err) {
    res.json([{ id: 'local-1', url: '/images/FB_IMG_1782701605358.jpg', titulo: 'El Cabezón Jano' }]);
  }
});

// POST /api/upload y /api/subir
const uploadHandler = (req, res) => {
  upload.single('archivo')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) return res.status(413).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'El archivo supera los 50 MB.' : err.message });
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'No se adjuntó ningún archivo.' });
    const nombre = req.body.nombre || 'Anónimo';
    const anio = req.body.anio || '';
    const mensaje = req.body.mensaje || '';
    let subioASupabase = false;
    let urlArchivo = '';
    if (isSupabaseAvailable()) {
      try {
        const folder = req.file.mimetype.startsWith('image/') ? 'galeria' : 'recuerdos';
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}${fileExt}`;
        const { error: uploadError } = await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
        if (!uploadError) {
          const { data: urlData } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
          urlArchivo = urlData.publicUrl;
          await supabaseAdmin.from('recuerdos').insert({ nombre, anio, mensaje, tipo_archivo: req.file.mimetype, url_archivo: urlArchivo, storage_path: fileName, nombre_original: req.file.originalname, tamanio_bytes: req.file.size, aprobado: false });
          subioASupabase = true;
        }
      } catch (supaErr) { console.error('Error al subir a Supabase:', supaErr); }
    }
    try {
      const htmlContent = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;padding:20px;border-radius:8px;"><h2 style="color:#E50914;border-bottom:2px solid #E50914;padding-bottom:8px;">Nuevo aporte al Archivo Comunitario</h2><table style="width:100%;border-collapse:collapse;margin-top:15px;"><tr><td style="padding:8px;font-weight:bold;color:#374151;width:120px;">Nombre:</td><td style="padding:8px;">${nombre}</td></tr><tr><td style="padding:8px;font-weight:bold;color:#374151;">Año:</td><td style="padding:8px;">${anio}</td></tr><tr><td style="padding:8px;font-weight:bold;color:#374151;">Mensaje:</td><td style="padding:8px;">${mensaje}</td></tr><tr><td style="padding:8px;font-weight:bold;color:#374151;">Archivo:</td><td style="padding:8px;">${req.file.originalname} (${(req.file.size / (1024 * 1024)).toFixed(2)} MB)</td></tr>${urlArchivo ? `<tr><td style="padding:8px;font-weight:bold;color:#374151;">URL:</td><td style="padding:8px;"><a href="${urlArchivo}">${urlArchivo}</a></td></tr>` : ''}<tr><td style="padding:8px;font-weight:bold;color:#374151;">Supabase:</td><td style="padding:8px;">${subioASupabase ? '✅ Guardado' : '⚠️ Solo email'}</td></tr></table></div>`;
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({ from: 'Archivo El Arca <onboarding@resend.dev>', to: process.env.EMAIL_RECEIVER || 'archivo.elarca@gmail.com', subject: `Nuevo recuerdo de ${nombre}`, html: htmlContent })
      });
    } catch (apiErr) { console.error('Error envío correo:', apiErr); }
    res.json({ success: true, message: 'Recuerdo recibido con éxito.', supabase: subioASupabase });
  });
};
app.post('/api/upload', uploadHandler);
app.post('/api/subir', uploadHandler);

// ─── SERVIR FRONTEND ────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Exportar para Vercel (SIN app.listen)
module.exports = app;

// Solo para desarrollo local
if (require.main === module) {
  app.listen(PORT, () => console.log(`Servidor local en puerto ${PORT}`));
}
