INSERT INTO admin_users (email, password_hash, nombre)
VALUES ('mariajosevarga@gmail.com', '$2a$12$LJ3m4ys3Lg3YOCw6.k.LOe3x5H0F0F0F0F0F0F0F0F0F0F0F0F0F0', 'Admin')
ON CONFLICT (email) DO NOTHING;
