-- Historial de versiones del contenido editable del sitio.
-- Cada alta, cambio o restauración en contenido_sitio queda registrado automáticamente.

CREATE TABLE IF NOT EXISTS public.contenido_historial (
  id          bigserial PRIMARY KEY,
  clave       text NOT NULL,
  pagina      text NOT NULL,
  tipo        text NOT NULL,
  accion      text NOT NULL CHECK (accion IN ('crear', 'editar', 'restaurar')),
  valor       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid DEFAULT auth.uid()
);

CREATE INDEX IF NOT EXISTS contenido_historial_clave_idx
  ON public.contenido_historial (clave, created_at DESC);

ALTER TABLE public.contenido_historial ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "historial_select_auth" ON public.contenido_historial;
CREATE POLICY "historial_select_auth" ON public.contenido_historial
  FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.contenido_sitio_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.contenido_historial (clave, pagina, tipo, accion, valor)
    VALUES (OLD.clave, OLD.pagina, OLD.tipo, 'restaurar', NULL);
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.contenido_historial (clave, pagina, tipo, accion, valor)
    VALUES (NEW.clave, NEW.pagina, NEW.tipo, 'crear', NEW.valor);
    RETURN NEW;
  ELSE
    INSERT INTO public.contenido_historial (clave, pagina, tipo, accion, valor)
    VALUES (NEW.clave, NEW.pagina, NEW.tipo, 'editar', NEW.valor);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS contenido_sitio_log_trg ON public.contenido_sitio;
CREATE TRIGGER contenido_sitio_log_trg
  AFTER INSERT OR UPDATE OR DELETE ON public.contenido_sitio
  FOR EACH ROW EXECUTE FUNCTION public.contenido_sitio_log();

-- Texto alternativo de imágenes: se guarda en contenido_sitio con tipo 'alt'.
ALTER TABLE public.contenido_sitio DROP CONSTRAINT IF EXISTS contenido_sitio_tipo_check;
ALTER TABLE public.contenido_sitio
  ADD CONSTRAINT contenido_sitio_tipo_check CHECK (tipo IN ('texto', 'imagen', 'alt'));
