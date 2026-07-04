ALTER TABLE public.recuerdos
  ADD COLUMN IF NOT EXISTS es_efimero BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_recuerdos_destacado
  ON public.recuerdos(destacado)
  WHERE destacado = TRUE;
