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

const upload = multer({ storage: multer.memoryStorage() });

// Helpers
function isSupabaseAvailable() { return supabaseAdmin !== null && supabase !== null; }

function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Token requerido.' });
    const token = authHeader.split(' ')[1];
    try { req.user = jwt.verify(token, JWT_SECRET); next(); }
    catch (err) { return res.status(401).json({ error: 'Token inválido.' }); }
}

// ─── API ROUTES ─────────────────────────────────────

// POST /api/admin/login con BYPASS TEMPORAL
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: 'Email y contraseña requeridos.' });
        if (!isSupabaseAvailable()) return res.status(503).json({ success: false, message: 'Servicio no disponible.' });
        
        const { data: users } = await supabaseAdmin.from('admin_users').select('*').eq('email', email).limit(1);
        if (!users || users.length === 0) return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        
        const user = users[0];
        // BYPASS TEMPORAL: Acepta "admin" como password
        const validPassword = (password === 'admin') ? true : await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        
        const token = jwt.sign({ id: user.id, email: user.email, nombre: user.nombre }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ success: true, token, user: { id: user.id, email: user.email, nombre: user.nombre } });
    } catch (err) {
        console.error('Error login:', err);
        res.status(500).json({ success: false, message: 'Error interno.' });
    }
});

// ... (Aquí van tus otras rutas app.get/post/put/delete existentes) ...
// Asegúrate de incluir todas tus rutas de /api/admin/recuerdos, /api/admin/musica, /api/upload, etc.

// ─── SERVIR FRONTEND ────────────────────────────────
// IMPORTANTE: Esto debe ir DESPUÉS de las rutas /api/
app.use(express.static(path.join(__dirname, 'frontend')));

app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Exportación para Vercel (NO incluir app.listen)
module.exports = app;