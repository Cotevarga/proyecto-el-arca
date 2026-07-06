-- ===============================================================
-- EL ARCA — Búsqueda de texto completo + transcripciones
-- ===============================================================

ALTER TABLE public.recuerdos
  ADD COLUMN IF NOT EXISTS transcripcion TEXT,
  ADD COLUMN IF NOT EXISTS buscador TSVECTOR;

-- Poblar desde datos existentes
UPDATE public.recuerdos
  SET buscador = to_tsvector('spanish',
    COALESCE(nombre, '') || ' ' ||
    COALESCE(mensaje_largo, '') || ' ' ||
    COALESCE(mensaje, '') || ' ' ||
    COALESCE(texto, '') || ' ' ||
    COALESCE(transcripcion, '') || ' ' ||
    COALESCE(tags::text, '')
  );

-- Índice GIN para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_recuerdos_buscador ON public.recuerdos USING GIN(buscador);

-- Trigger para mantener actualizado
DROP FUNCTION IF EXISTS public.recuerdos_buscador_update() CASCADE;
CREATE FUNCTION public.recuerdos_buscador_update()
RETURNS trigger AS $$
BEGIN
  NEW.buscador := to_tsvector('spanish',
    COALESCE(NEW.nombre, '') || ' ' ||
    COALESCE(NEW.mensaje_largo, '') || ' ' ||
    COALESCE(NEW.mensaje, '') || ' ' ||
    COALESCE(NEW.texto, '') || ' ' ||
    COALESCE(NEW.transcripcion, '') || ' ' ||
    COALESCE(NEW.tags::text, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recuerdos_buscador ON public.recuerdos;
CREATE TRIGGER trg_recuerdos_buscador
  BEFORE INSERT OR UPDATE OF nombre, mensaje_largo, mensaje, texto, transcripcion, tags
  ON public.recuerdos
  FOR EACH ROW
  EXECUTE FUNCTION public.recuerdos_buscador_update();
