ALTER TABLE public.recuerdos
  DROP CONSTRAINT IF EXISTS recuerdos_seccion_check;

ALTER TABLE public.recuerdos
  ADD CONSTRAINT recuerdos_seccion_check
  CHECK (seccion IS NULL OR seccion IN (
    'Galeria', 'Videos y Audios',
    'Relatos: El Jano', 'Relatos: El Arca', 'Relatos: Otras organizaciones',
    'Relatos: Anecdotas'
  ));
