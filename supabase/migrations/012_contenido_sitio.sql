-- ===============================================================
-- EL ARCA — Contenido editable del sitio (textos e imágenes)
-- Cada fila es una edición hecha desde el panel admin sobre un texto
-- o imagen del HTML original. Si se borra la fila, vuelve el original.
--   clave = <pagina>|t|<hash del texto original>   (texto)
--           <pagina>|i|<ruta original de la imagen> (imagen)
-- ===============================================================

CREATE TABLE IF NOT EXISTS public.contenido_sitio (
    clave       TEXT PRIMARY KEY,
    pagina      TEXT NOT NULL,
    tipo        TEXT NOT NULL CHECK (tipo IN ('texto', 'imagen')),
    original    TEXT,
    valor       TEXT NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by  TEXT
);

CREATE INDEX IF NOT EXISTS idx_contenido_sitio_pagina ON public.contenido_sitio(pagina);

ALTER TABLE public.contenido_sitio ENABLE ROW LEVEL SECURITY;

-- Cualquier visitante puede leer (el sitio público aplica las ediciones)
DROP POLICY IF EXISTS "contenido_sitio_select_policy" ON public.contenido_sitio;
CREATE POLICY "contenido_sitio_select_policy" ON public.contenido_sitio
    FOR SELECT USING (true);

-- Solo administradores autenticados pueden crear, modificar o borrar
DROP POLICY IF EXISTS "contenido_sitio_insert_policy" ON public.contenido_sitio;
CREATE POLICY "contenido_sitio_insert_policy" ON public.contenido_sitio
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "contenido_sitio_update_policy" ON public.contenido_sitio;
CREATE POLICY "contenido_sitio_update_policy" ON public.contenido_sitio
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "contenido_sitio_delete_policy" ON public.contenido_sitio;
CREATE POLICY "contenido_sitio_delete_policy" ON public.contenido_sitio
    FOR DELETE USING (auth.role() = 'authenticated');
