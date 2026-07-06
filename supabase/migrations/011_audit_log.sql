-- ===============================================================
-- EL ARCA — Auditoría global de acciones admin
-- Registra toda acción curatorial: aprobaciones, rechazos,
-- subidas admin, eliminaciones, cambios de metadata.
-- ===============================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
    id BIGSERIAL PRIMARY KEY,
    accion VARCHAR(50) NOT NULL,         -- approve, reject, admin_upload, delete, update, login
    entidad VARCHAR(50) NOT NULL,         -- recuerdo, galeria, musica, admin_user
    entidad_id BIGINT,                    -- ID del registro afectado
    usuario_id BIGINT,                    -- ID del admin que ejecutó la acción
    usuario_email VARCHAR(255),           -- Email del admin
    ip_address VARCHAR(45),               -- IP desde donde se ejecutó
    metadata JSONB,                       -- Payload adicional (ej: {razon: "...", seccion: "..."})
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_accion ON public.audit_log(accion);
CREATE INDEX IF NOT EXISTS idx_audit_log_entidad ON public.audit_log(entidad);
CREATE INDEX IF NOT EXISTS idx_audit_log_usuario ON public.audit_log(usuario_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Solo admins autenticados pueden leer
DROP POLICY IF EXISTS "audit_log_select_policy" ON public.audit_log;
CREATE POLICY "audit_log_select_policy" ON public.audit_log
    FOR SELECT USING (auth.role() = 'authenticated');

-- Solo service_role puede insertar (vía Edge Function)
DROP POLICY IF EXISTS "audit_log_insert_policy" ON public.audit_log;
CREATE POLICY "audit_log_insert_policy" ON public.audit_log
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ─── Agregar columna categoria si no existe (usada por Edge Functions) ───
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recuerdos' AND column_name = 'categoria'
    ) THEN
        ALTER TABLE public.recuerdos ADD COLUMN categoria VARCHAR(100) DEFAULT 'galeria';
    END IF;
END $$;

-- ─── Agregar columna destacado si no existe ───
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recuerdos' AND column_name = 'destacado'
    ) THEN
        ALTER TABLE public.recuerdos ADD COLUMN destacado BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- ─── Agregar columna titulo_relato si no existe ───
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recuerdos' AND column_name = 'titulo_relato'
    ) THEN
        ALTER TABLE public.recuerdos ADD COLUMN titulo_relato VARCHAR(500);
    END IF;
END $$;

-- ─── Agregar columna fecha_subida si no existe ───
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recuerdos' AND column_name = 'fecha_subida'
    ) THEN
        ALTER TABLE public.recuerdos ADD COLUMN fecha_subida TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;
