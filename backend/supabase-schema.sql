-- ============================================================
-- ESQUEMA SUPABASE — PROYECTO "MEMORIA VIVA DE EL ARCA"
-- Nivel de seguridad: Enterprise GOLD + Row Level Security
-- ============================================================

-- 0. EXTENSIONES
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. TABLA: recuerdos (Archivo comunitario)
-- ============================================================
create table if not exists public.recuerdos (
  id uuid primary key default gen_random_uuid(),
  nombre varchar(255) not null default 'Anónimo',
  anio varchar(4),
  mensaje text,
  tipo_archivo varchar(50),
  url_archivo text,
  storage_path text,
  nombre_original varchar(255),
  tamanio_bytes bigint,
  aprobado boolean not null default false,
  created_at timestamptz default now()
);

-- ============================================================
-- 2. TABLA: admin_users (Solo insersión manual vía SQL)
-- ============================================================
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) unique not null,
  password_hash text not null,
  nombre varchar(255) not null,
  created_at timestamptz default now()
);

-- Insertar admin inicial (cambiar email y hash en producción)
-- El hash es de "Admin2026!" con bcrypt (generar con: https://bcrypt-generator.com)
-- insert into public.admin_users (email, password_hash, nombre)
-- values ('admin@elarca.cl', '$2a$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5GzGJ8z7N5O1X2Y3W4Z5A6B7', 'Administrador');

-- ============================================================
-- 3. TABLA: musica_reproductor (MP3 del admin)
-- ============================================================
create table if not exists public.musica_reproductor (
  id uuid primary key default gen_random_uuid(),
  titulo varchar(255) not null,
  artista varchar(255) default 'El Arca',
  url_mp3 text not null,
  storage_path text not null,
  activo boolean not null default true,
  orden int default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- 4. ROW LEVEL SECURITY — ACTIVAR
-- ============================================================
alter table public.recuerdos enable row level security;
alter table public.admin_users enable row level security;
alter table public.musica_reproductor enable row level security;

-- ============================================================
-- 5. POLÍTICAS RLS — recuerdos
-- ============================================================
-- Público anónimo: puede INSERTAR (subir archivos)
drop policy if exists "anon_insert_recuerdos" on public.recuerdos;
create policy "anon_insert_recuerdos" on public.recuerdos
  for insert to anon
  with check (true);

-- Público anónimo: puede LEER solo lo aprobado
drop policy if exists "anon_select_recuerdos_aprobados" on public.recuerdos;
create policy "anon_select_recuerdos_aprobados" on public.recuerdos
  for select to anon
  using (aprobado = true);

-- Servicio (admin): control total
drop policy if exists "service_all_recuerdos" on public.recuerdos;
create policy "service_all_recuerdos" on public.recuerdos
  for all to service_role
  using (true)
  with check (true);

-- ============================================================
-- 6. POLÍTICAS RLS — admin_users
-- ============================================================
-- Solo service_role puede hacer anything
drop policy if exists "service_all_admin_users" on public.admin_users;
create policy "service_all_admin_users" on public.admin_users
  for all to service_role
  using (true)
  with check (true);

-- ============================================================
-- 7. POLÍTICAS RLS — musica_reproductor
-- ============================================================
-- Público: solo canciones activas
drop policy if exists "anon_select_musica_activa" on public.musica_reproductor;
create policy "anon_select_musica_activa" on public.musica_reproductor
  for select to anon
  using (activo = true);

-- Servicio (admin): control total
drop policy if exists "service_all_musica" on public.musica_reproductor;
create policy "service_all_musica" on public.musica_reproductor
  for all to service_role
  using (true)
  with check (true);

-- ============================================================
-- 8. BUCKETS DE STORAGE (crear desde dashboard o SQL)
-- ============================================================
-- insert into storage.buckets (id, name, public)
-- values ('elarca', 'elarca', true)
-- on conflict (id) do nothing;
--
-- Políticas para storage:
--   - anon: INSERT en /recuerdos/*
--   - anon: SELECT en /galeria/*
--   - service_role: todo
-- ============================================================

-- ============================================================
-- 9. ÍNDICES PARA RENDIMIENTO
-- ============================================================
create index if not exists idx_recuerdos_aprobado on public.recuerdos(aprobado);
create index if not exists idx_recuerdos_created_at on public.recuerdos(created_at desc);
create index if not exists idx_musica_activo_orden on public.musica_reproductor(activo, orden);
create index if not exists idx_admin_users_email on public.admin_users(email);

-- ============================================================
-- FIN DEL ESQUEMA
-- ============================================================
