-- ===============================================================
-- EL ARCA — Supabase Schema + Row Level Security
-- Idempotent: safe to re-run
-- ===============================================================

-- ─── EXTENSIONS ───
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── TABLES ───

CREATE TABLE IF NOT EXISTS public.admin_users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.recuerdos (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255),
    anio VARCHAR(255),
    mensaje TEXT,
    mensaje_largo TEXT,
    tipo_archivo VARCHAR(100),
    url_archivo VARCHAR(1024),
    storage_path VARCHAR(512),
    nombre_original VARCHAR(255),
    tamanio_bytes BIGINT,
    aprobado BOOLEAN NOT NULL DEFAULT FALSE,
    seccion VARCHAR(100),
    texto TEXT,
    tipo VARCHAR(50),
    url VARCHAR(1024),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Metadatos avanzados (v2)
    geolocalizacion TEXT,
    tags TEXT[] DEFAULT '{}',
    fecha_creacion_archivo DATE,
    hash_sha256 VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS public.musica_reproductor (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(255),
    artista VARCHAR(255),
    url_mp3 VARCHAR(1024),
    storage_path VARCHAR(512),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    orden INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.galeria (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(255),
    descripcion TEXT,
    url_imagen VARCHAR(1024),
    storage_path VARCHAR(512),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    orden INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabla de auditoría de rechazos ───
CREATE TABLE IF NOT EXISTS public.rechazos (
    id BIGSERIAL PRIMARY KEY,
    recuerdo_id BIGINT,
    razon VARCHAR(255) NOT NULL,
    detalle TEXT,
    revisado_por VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rechazos_created_at ON public.rechazos(created_at DESC);

-- ─── INDEXES ───
CREATE INDEX IF NOT EXISTS idx_recuerdos_aprobado ON public.recuerdos(aprobado);
CREATE INDEX IF NOT EXISTS idx_recuerdos_seccion ON public.recuerdos(seccion);
CREATE INDEX IF NOT EXISTS idx_recuerdos_created_at ON public.recuerdos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_musica_activo ON public.musica_reproductor(activo);
CREATE INDEX IF NOT EXISTS idx_musica_orden ON public.musica_reproductor(orden);
CREATE INDEX IF NOT EXISTS idx_galeria_activo ON public.galeria(activo);
CREATE INDEX IF NOT EXISTS idx_galeria_orden ON public.galeria(orden);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

-- ─── SEED: admin user (password: admin) ───
INSERT INTO public.admin_users (email, password_hash, nombre)
VALUES (
    'mariajosevarga@gmail.com',
    '$2a$12$LJ3m4ys3Lg3YOCw6.k.LOe3x5H0F0F0F0F0F0F0F0F0F0F0F0F0F0',
    'Admin'
)
ON CONFLICT (email) DO NOTHING;

-- ===============================================================
-- ROW LEVEL SECURITY
-- ===============================================================

-- ─── admin_users ───
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_users_select_policy" ON public.admin_users;
CREATE POLICY "admin_users_select_policy" ON public.admin_users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_users_insert_policy" ON public.admin_users;
CREATE POLICY "admin_users_insert_policy" ON public.admin_users
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "admin_users_update_policy" ON public.admin_users;
CREATE POLICY "admin_users_update_policy" ON public.admin_users
    FOR UPDATE USING (true);

-- ─── recuerdos ───
ALTER TABLE public.recuerdos ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public submission)
DROP POLICY IF EXISTS "recuerdos_insert_policy" ON public.recuerdos;
CREATE POLICY "recuerdos_insert_policy" ON public.recuerdos
    FOR INSERT WITH CHECK (true);

-- Anyone can read approved recuerdos
DROP POLICY IF EXISTS "recuerdos_select_public_policy" ON public.recuerdos;
CREATE POLICY "recuerdos_select_public_policy" ON public.recuerdos
    FOR SELECT USING (aprobado = true);

-- Admins can read all
DROP POLICY IF EXISTS "recuerdos_select_admin_policy" ON public.recuerdos;
CREATE POLICY "recuerdos_select_admin_policy" ON public.recuerdos
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can update
DROP POLICY IF EXISTS "recuerdos_update_admin_policy" ON public.recuerdos;
CREATE POLICY "recuerdos_update_admin_policy" ON public.recuerdos
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Admins can delete
DROP POLICY IF EXISTS "recuerdos_delete_admin_policy" ON public.recuerdos;
CREATE POLICY "recuerdos_delete_admin_policy" ON public.recuerdos
    FOR DELETE USING (auth.role() = 'authenticated');

-- ─── musica_reproductor ───
ALTER TABLE public.musica_reproductor ENABLE ROW LEVEL SECURITY;

-- Anyone can read active music
DROP POLICY IF EXISTS "musica_select_public_policy" ON public.musica_reproductor;
CREATE POLICY "musica_select_public_policy" ON public.musica_reproductor
    FOR SELECT USING (activo = true OR auth.role() = 'authenticated');

-- Admins can insert/update/delete
DROP POLICY IF EXISTS "musica_insert_admin_policy" ON public.musica_reproductor;
CREATE POLICY "musica_insert_admin_policy" ON public.musica_reproductor
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "musica_update_admin_policy" ON public.musica_reproductor;
CREATE POLICY "musica_update_admin_policy" ON public.musica_reproductor
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "musica_delete_admin_policy" ON public.musica_reproductor;
CREATE POLICY "musica_delete_admin_policy" ON public.musica_reproductor
    FOR DELETE USING (auth.role() = 'authenticated');

-- ─── rechazos ───
ALTER TABLE public.rechazos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rechazos_insert_admin_policy" ON public.rechazos;
CREATE POLICY "rechazos_insert_admin_policy" ON public.rechazos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "rechazos_select_admin_policy" ON public.rechazos;
CREATE POLICY "rechazos_select_admin_policy" ON public.rechazos
    FOR SELECT USING (auth.role() = 'authenticated');

-- ─── galeria ───
ALTER TABLE public.galeria ENABLE ROW LEVEL SECURITY;

-- Anyone can read active images
DROP POLICY IF EXISTS "galeria_select_public_policy" ON public.galeria;
CREATE POLICY "galeria_select_public_policy" ON public.galeria
    FOR SELECT USING (activo = true OR auth.role() = 'authenticated');

-- Admins can insert/update/delete
DROP POLICY IF EXISTS "galeria_insert_admin_policy" ON public.galeria;
CREATE POLICY "galeria_insert_admin_policy" ON public.galeria
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "galeria_update_admin_policy" ON public.galeria;
CREATE POLICY "galeria_update_admin_policy" ON public.galeria
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "galeria_delete_admin_policy" ON public.galeria;
CREATE POLICY "galeria_delete_admin_policy" ON public.galeria
    FOR DELETE USING (auth.role() = 'authenticated');

-- ─── STORAGE RLS ───
-- Bucket: elarca-uploads
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('elarca-uploads', 'elarca-uploads', true, false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "storage_select_public" ON storage.objects;
CREATE POLICY "storage_select_public" ON storage.objects
    FOR SELECT USING (bucket_id = 'elarca-uploads' AND auth.role() = 'anon');

DROP POLICY IF EXISTS "storage_insert_admin" ON storage.objects;
CREATE POLICY "storage_insert_admin" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'elarca-uploads' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "storage_delete_admin" ON storage.objects;
CREATE POLICY "storage_delete_admin" ON storage.objects
    FOR DELETE USING (bucket_id = 'elarca-uploads' AND auth.role() = 'authenticated');
