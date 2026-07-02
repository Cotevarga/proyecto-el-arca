// En tu api/index.js
app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;
    console.log("Intento de login recibido para:", email);

    try {
        // BYPASS DE PRUEBA: Si la clave es 'admin', entra directo
        if (password === 'admin') {
            console.log("Bypass activado para:", email);
            const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '8h' });
            return res.json({ success: true, token });
        }

        // Validación normal
        const { data: users } = await supabaseAdmin.from('admin_users').select('*').eq('email', email).limit(1);
        
        if (!users || users.length === 0) {
            return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });
        }

        const validPassword = await bcrypt.compare(password, users[0].password_hash);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
        }

        const token = jwt.sign({ id: users[0].id, email }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ success: true, token });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ success: false, message: 'Error interno.' });
    }
});