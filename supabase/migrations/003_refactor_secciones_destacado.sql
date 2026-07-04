-- ===============================================================
-- EL ARCA — Refactor secciones + add destacado column
-- ===============================================================

-- Add destacado column for vitrina
ALTER TABLE public.recuerdos
  ADD COLUMN IF NOT EXISTS destacado BOOLEAN NOT NULL DEFAULT FALSE;

-- Drop existing CHECK constraint
ALTER TABLE public.recuerdos
  DROP CONSTRAINT IF EXISTS recuerdos_seccion_check;

-- Add updated CHECK constraint with only the 5 allowed values
ALTER TABLE public.recuerdos
  ADD CONSTRAINT recuerdos_seccion_check
  CHECK (seccion IS NULL OR seccion IN (
    'galeria', 'videos',
    'relatos_jano', 'relatos_arca', 'relatos_organizaciones'
  ));
