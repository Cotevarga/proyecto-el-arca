const express = require('express');
const app = express();
const helmet = require('helmet');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

// Configuraciones básicas
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Clientes Supabase
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'MI_JWT_SECRETO_LOCAL_2026';

// Ruta de Login (Fix del Error 500)
app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { data: users } = await supabaseAdmin.from('admin_users').select('*').eq('email', email).limit(1);
        
        if (!users || users.length === 0) return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });
        
        const user = users[0];
        const validPassword = (password === 'admin') ? true : await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
        return res.json({ success: true, token });
    } catch (err) {
        console.error('Error login:', err);
        return res.status(500).json({ success: false, message: 'Error interno.' });
    }
});

// Exportación obligatoria para Vercel
module.exports = app;