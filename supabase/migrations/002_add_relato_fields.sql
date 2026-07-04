-- ===============================================================
-- EL ARCA — Add titulo_relato column + CHECK constraint on seccion
-- ===============================================================

ALTER TABLE public.recuerdos
  ADD COLUMN IF NOT EXISTS titulo_relato VARCHAR(500);

-- Drop existing CHECK constraint if any
ALTER TABLE public.recuerdos
  DROP CONSTRAINT IF EXISTS recuerdos_seccion_check;

-- Add CHECK constraint with valid values
ALTER TABLE public.recuerdos
  ADD CONSTRAINT recuerdos_seccion_check
  CHECK (seccion IS NULL OR seccion IN (
    'relatos', 'legado', 'jano', 'arca', 'organizaciones',
    'general', 'entrevista', 'galeria', 'videos'
  ));
