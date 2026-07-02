-- ============================================================
-- MIGRACIÓN: Agregar columna 'seccion' a la tabla recuerdos
-- ============================================================

-- Agregar columna seccion con valores permitidos
alter table public.recuerdos
  add column if not exists seccion text
  check (seccion in ('relatos', 'legado', 'jano', 'arca', 'organizaciones', 'general'));

-- Valor por defecto
alter table public.recuerdos
  alter column seccion set default 'general';

-- Actualizar registros existentes sin sección
update public.recuerdos
  set seccion = 'general'
  where seccion is null;

-- Índice para filtrar por sección
create index if not exists idx_recuerdos_seccion on public.recuerdos(seccion);
