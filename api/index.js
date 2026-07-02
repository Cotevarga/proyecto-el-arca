const express = require('express');
const app = express();
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Login simplificado para pruebas
app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;
    console.log("Login para:", email);

    // BYPASS TOTAL: Si el email es el correcto, entras sin preguntar clave
    if (email === 'mariajosevarga@gmail.com') {
        return res.json({ success: true, token: 'fake-token-para-probar' });
    }
    
    return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });
});

// Ruta de música arreglada (sin JWT por ahora para testear)
app.get('/api/musica', async (req, res) => {
    try {
        const { data } = await supabaseAdmin.from('musica_reproductor').select('*');
        res.json(data || []);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.use(express.static('frontend'));
app.get('*', (req, res) => res.sendFile(__dirname + '/frontend/index.html'));

module.exports = app;