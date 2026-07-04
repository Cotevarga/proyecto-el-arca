ALTER TABLE public.recuerdos
  ADD COLUMN IF NOT EXISTS es_efimero BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.recuerdos
  ADD COLUMN IF NOT EXISTS fecha_subida TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_recuerdos_destacado
  ON public.recuerdos(destacado)
  WHERE destacado = TRUE;

CREATE INDEX IF NOT EXISTS idx_recuerdos_vitrina
  ON public.recuerdos(destacado, es_efimero, fecha_subida DESC)
  WHERE destacado = TRUE;
