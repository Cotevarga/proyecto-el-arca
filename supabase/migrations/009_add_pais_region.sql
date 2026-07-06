-- ===============================================================
-- EL ARCA — Multi-territorio: país / región
-- ===============================================================

ALTER TABLE public.recuerdos
  ADD COLUMN IF NOT EXISTS pais VARCHAR(100),
  ADD COLUMN IF NOT EXISTS region VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_recuerdos_pais   ON public.recuerdos(pais);
CREATE INDEX IF NOT EXISTS idx_recuerdos_region ON public.recuerdos(region);
