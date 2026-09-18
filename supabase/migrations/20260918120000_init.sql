-- Rifa Feira dos Países 2026 — Estados Unidos
-- Schema, funções, RLS e Storage.
-- Execute no SQL Editor do Supabase ou via: supabase db push / migration up

create extension if not exists "pgcrypto";

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to postgres, service_role, authenticated, anon;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  login text not null unique,
  email text not null unique,
  role text not null default 'student'
    check (role in ('student', 'admin', 'super_admin')),
  must_change_password boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.numeros (
  id uuid primary key default gen_random_uuid(),
  numero integer not null unique check (numero >= 1 and numero <= 435),
  aluno_id uuid not null references public.profiles (id) on delete restrict,
  status text not null default 'DISPONIVEL'
    check (status in ('DISPONIVEL', 'PEGO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.registros (
  id uuid primary key default gen_random_uuid(),
  numero_id uuid not null unique references public.numeros (id) on delete cascade,
  aluno_id uuid not null references public.profiles (id) on delete restrict,
  nome_comprador text not null check (char_length(btrim(nome_comprador)) >= 3),
  telefone text not null,
  comprovante_url text not null default '',
  valor numeric(10, 2) not null default 5.00 check (valor = 5.00),
  status text not null default 'PEGO' check (status in ('PEGO', 'CANCELADO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists numeros_aluno_id_idx on public.numeros (aluno_id);
create index if not exists numeros_status_idx on public.numeros (status);
create index if not exists registros_aluno_id_idx on public.registros (aluno_id);
create index if not exists registros_telefone_idx on public.registros (telefone);
create index if not exists registros_nome_comprador_idx
  on public.registros (lower(nome_comprador));

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function private.touch_updated_at();

drop trigger if exists numeros_touch_updated_at on public.numeros;
create trigger numeros_touch_updated_at
before update on public.numeros
for each row execute function private.touch_updated_at();

drop trigger if exists registros_touch_updated_at on public.registros;
create trigger registros_touch_updated_at
before update on public.registros
for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Role helpers (SECURITY DEFINER, schema privado)
-- Nunca use raw_user_meta_data / user_metadata para autorização.
-- ---------------------------------------------------------------------------

create or replace function private.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.profiles
  where id = auth.uid()
    and is_active = true
$$;

create or replace function private.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and is_active = true
$$;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
      and role in ('admin', 'super_admin')
  )
$$;

create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
      and role = 'super_admin'
  )
$$;

grant execute on function private.current_profile() to authenticated, anon;
grant execute on function private.current_role() to authenticated, anon;
grant execute on function private.is_staff() to authenticated, anon;
grant execute on function private.is_super_admin() to authenticated, anon;

-- Impede que o aluno altere role, dono, login etc. via UPDATE direto.
create or replace function private.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'O id do perfil não pode ser alterado';
  end if;

  if new.role is distinct from old.role
     and current_setting('rifa.allow_role_change', true) is distinct from 'on'
     and coalesce(auth.role(), '') not in ('service_role', 'postgres') then
    new.role := old.role;
  end if;

  if coalesce(auth.role(), '') not in ('service_role', 'postgres')
     and not private.is_super_admin() then
    new.login := old.login;
    new.email := old.email;
    new.is_active := old.is_active;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_columns on public.profiles;
create trigger profiles_protect_columns
before update on public.profiles
for each row execute function private.protect_profile_columns();

create or replace function private.protect_numero_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.aluno_id is distinct from old.aluno_id then
    raise exception 'O dono do número não pode ser alterado';
  end if;
  if tg_op = 'UPDATE' and new.numero is distinct from old.numero then
    raise exception 'O número da rifa não pode ser alterado';
  end if;
  return new;
end;
$$;

drop trigger if exists numeros_protect_owner on public.numeros;
create trigger numeros_protect_owner
before update on public.numeros
for each row execute function private.protect_numero_owner();

create or replace function private.ensure_registro_matches_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_aluno uuid;
begin
  select aluno_id into v_aluno from public.numeros where id = new.numero_id;
  if v_aluno is null then
    raise exception 'Número não encontrado';
  end if;
  if new.aluno_id is distinct from v_aluno then
    raise exception 'O registro deve pertencer ao aluno dono do número';
  end if;
  return new;
end;
$$;

drop trigger if exists registros_match_owner on public.registros;
create trigger registros_match_owner
before insert or update on public.registros
for each row execute function private.ensure_registro_matches_owner();

-- ---------------------------------------------------------------------------
-- View (security_invoker para respeitar RLS)
-- ---------------------------------------------------------------------------

create or replace view public.student_progress
with (security_invoker = true) as
select
  p.id,
  p.nome,
  p.login,
  p.role,
  count(n.id)::integer as total,
  count(n.id) filter (where n.status = 'PEGO')::integer as vendidos,
  count(n.id) filter (where n.status = 'DISPONIVEL')::integer as disponiveis,
  (count(n.id) filter (where n.status = 'PEGO') * 5.00)::numeric(10, 2) as arrecadado
from public.profiles p
left join public.numeros n on n.aluno_id = p.id
group by p.id, p.nome, p.login, p.role;

grant select on public.student_progress to authenticated;

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

create or replace function private.get_raffle_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'total', count(*)::integer,
    'sold', count(*) filter (where status = 'PEGO')::integer,
    'available', count(*) filter (where status = 'DISPONIVEL')::integer,
    'raised', (count(*) filter (where status = 'PEGO') * 5)::integer
  )
  from public.numeros
$$;

create or replace function public.get_raffle_stats()
returns jsonb
language sql
stable
security invoker
set search_path = public, private
as $$
  select private.get_raffle_stats()
$$;

grant execute on function public.get_raffle_stats() to anon, authenticated;
grant execute on function private.get_raffle_stats() to anon, authenticated;

create or replace function private.register_raffle_number(
  p_numero_id uuid,
  p_nome_comprador text,
  p_telefone text,
  p_comprovante_path text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_numero public.numeros;
  v_nome text;
  v_telefone text;
  v_digits text;
  v_updated integer;
  v_registro public.registros;
begin
  select * into v_profile from public.profiles where id = auth.uid() and is_active = true;
  if v_profile.id is null then
    raise exception 'Não autenticado';
  end if;

  v_nome := btrim(p_nome_comprador);
  if char_length(v_nome) < 3 then
    raise exception 'Informe o nome completo do comprador';
  end if;

  v_digits := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
  if char_length(v_digits) not in (10, 11) then
    raise exception 'Informe um telefone válido com DDD';
  end if;
  v_telefone := v_digits;

  if p_comprovante_path is null or length(p_comprovante_path) < 8 then
    raise exception 'Envie o comprovante de pagamento';
  end if;

  if split_part(p_comprovante_path, '/', 1) is distinct from auth.uid()::text
     and v_profile.role not in ('admin', 'super_admin') then
    raise exception 'Comprovante inválido';
  end if;

  select * into v_numero
  from public.numeros
  where id = p_numero_id
  for update;

  if v_numero.id is null then
    raise exception 'Número não encontrado';
  end if;

  if v_numero.aluno_id is distinct from auth.uid()
     and v_profile.role not in ('admin', 'super_admin') then
    raise exception 'Você só pode registrar os seus números';
  end if;

  if v_numero.status is distinct from 'DISPONIVEL' then
    raise exception 'Este número já está PEGO';
  end if;

  update public.numeros
  set status = 'PEGO'
  where id = p_numero_id
    and status = 'DISPONIVEL'
  returning * into v_numero;

  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    raise exception 'Este número já está PEGO';
  end if;

  insert into public.registros (
    numero_id,
    aluno_id,
    nome_comprador,
    telefone,
    comprovante_url,
    valor,
    status
  )
  values (
    v_numero.id,
    v_numero.aluno_id,
    v_nome,
    v_telefone,
    p_comprovante_path,
    5.00,
    'PEGO'
  )
  returning * into v_registro;

  return jsonb_build_object(
    'ok', true,
    'numero', v_numero.numero,
    'registro_id', v_registro.id,
    'message', 'Número registrado com sucesso'
  );
exception
  when unique_violation then
    raise exception 'Este número já está PEGO';
end;
$$;

create or replace function public.register_raffle_number(
  p_numero_id uuid,
  p_nome_comprador text,
  p_telefone text,
  p_comprovante_path text
)
returns jsonb
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  return private.register_raffle_number(
    p_numero_id,
    p_nome_comprador,
    p_telefone,
    p_comprovante_path
  );
end;
$$;

grant execute on function private.register_raffle_number(uuid, text, text, text) to authenticated;
grant execute on function public.register_raffle_number(uuid, text, text, text) to authenticated;

create or replace function private.admin_set_role(
  p_user_id uuid,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.profiles;
  v_super_count integer;
begin
  if not private.is_super_admin() then
    raise exception 'Somente o SUPER ADMIN pode gerenciar cargos';
  end if;

  if p_role not in ('student', 'admin') then
    raise exception 'Não é permitido criar outro SUPER ADMIN';
  end if;

  select * into v_target from public.profiles where id = p_user_id;
  if v_target.id is null then
    raise exception 'Usuário não encontrado';
  end if;

  if v_target.role = 'super_admin' then
    select count(*) into v_super_count
    from public.profiles
    where role = 'super_admin' and is_active = true;

    if v_super_count <= 1 then
      raise exception 'Não é possível remover o último SUPER ADMIN';
    end if;
  end if;

  perform set_config('rifa.allow_role_change', 'on', true);

  update public.profiles
  set role = p_role
  where id = p_user_id;

  return jsonb_build_object('ok', true, 'user_id', p_user_id, 'role', p_role);
end;
$$;

create or replace function public.admin_set_role(p_user_id uuid, p_role text)
returns jsonb
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  return private.admin_set_role(p_user_id, p_role);
end;
$$;

grant execute on function private.admin_set_role(uuid, text) to authenticated;
grant execute on function public.admin_set_role(uuid, text) to authenticated;

create or replace function private.admin_release_number(p_numero_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_numero public.numeros;
  v_path text;
begin
  if not private.is_staff() then
    raise exception 'Acesso restrito a administradores';
  end if;

  select * into v_numero from public.numeros where id = p_numero_id for update;
  if v_numero.id is null then
    raise exception 'Número não encontrado';
  end if;

  select comprovante_url into v_path
  from public.registros
  where numero_id = p_numero_id;

  delete from public.registros where numero_id = p_numero_id;

  update public.numeros
  set status = 'DISPONIVEL'
  where id = p_numero_id;

  return jsonb_build_object(
    'ok', true,
    'numero', v_numero.numero,
    'comprovante_url', coalesce(v_path, '')
  );
end;
$$;

create or replace function public.admin_release_number(p_numero_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  return private.admin_release_number(p_numero_id);
end;
$$;

grant execute on function private.admin_release_number(uuid) to authenticated;
grant execute on function public.admin_release_number(uuid) to authenticated;

create or replace function private.admin_mark_number_taken(
  p_numero_id uuid,
  p_nome_comprador text,
  p_telefone text,
  p_comprovante_path text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_numero public.numeros;
  v_nome text;
  v_digits text;
  v_updated integer;
begin
  if not private.is_staff() then
    raise exception 'Acesso restrito a administradores';
  end if;

  v_nome := btrim(p_nome_comprador);
  if char_length(v_nome) < 3 then
    raise exception 'Informe o nome do comprador';
  end if;

  v_digits := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
  if char_length(v_digits) not in (10, 11) then
    raise exception 'Informe um telefone válido com DDD';
  end if;

  select * into v_numero from public.numeros where id = p_numero_id for update;
  if v_numero.id is null then
    raise exception 'Número não encontrado';
  end if;

  if v_numero.status is distinct from 'DISPONIVEL' then
    raise exception 'Este número já está PEGO';
  end if;

  update public.numeros
  set status = 'PEGO'
  where id = p_numero_id and status = 'DISPONIVEL';

  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    raise exception 'Este número já está PEGO';
  end if;

  insert into public.registros (
    numero_id, aluno_id, nome_comprador, telefone, comprovante_url, valor, status
  ) values (
    v_numero.id, v_numero.aluno_id, v_nome, v_digits, coalesce(p_comprovante_path, ''), 5.00, 'PEGO'
  );

  return jsonb_build_object('ok', true, 'numero', v_numero.numero);
exception
  when unique_violation then
    raise exception 'Este número já está PEGO';
end;
$$;

create or replace function public.admin_mark_number_taken(
  p_numero_id uuid,
  p_nome_comprador text,
  p_telefone text,
  p_comprovante_path text default ''
)
returns jsonb
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  return private.admin_mark_number_taken(
    p_numero_id, p_nome_comprador, p_telefone, p_comprovante_path
  );
end;
$$;

grant execute on function private.admin_mark_number_taken(uuid, text, text, text) to authenticated;
grant execute on function public.admin_mark_number_taken(uuid, text, text, text) to authenticated;

create or replace function private.admin_delete_registro(p_registro_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg public.registros;
begin
  if not private.is_staff() then
    raise exception 'Acesso restrito a administradores';
  end if;

  select * into v_reg from public.registros where id = p_registro_id;
  if v_reg.id is null then
    raise exception 'Registro não encontrado';
  end if;

  delete from public.registros where id = p_registro_id;

  update public.numeros
  set status = 'DISPONIVEL'
  where id = v_reg.numero_id;

  return jsonb_build_object(
    'ok', true,
    'numero_id', v_reg.numero_id,
    'comprovante_url', v_reg.comprovante_url
  );
end;
$$;

create or replace function public.admin_delete_registro(p_registro_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  return private.admin_delete_registro(p_registro_id);
end;
$$;

grant execute on function private.admin_delete_registro(uuid) to authenticated;
grant execute on function public.admin_delete_registro(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.numeros enable row level security;
alter table public.registros enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select to authenticated
using (id = auth.uid() or private.is_staff());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists numeros_select on public.numeros;
create policy numeros_select on public.numeros
for select to authenticated
using (aluno_id = auth.uid() or private.is_staff());

drop policy if exists registros_select on public.registros;
create policy registros_select on public.registros
for select to authenticated
using (aluno_id = auth.uid() or private.is_staff());

-- Sem INSERT/UPDATE/DELETE direto nas tabelas de números e registros.
-- Mutações passam pelas funções SECURITY DEFINER.

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  8388608,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists payment_proofs_insert on storage.objects;
create policy payment_proofs_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists payment_proofs_select on storage.objects;
create policy payment_proofs_select on storage.objects
for select to authenticated
using (
  bucket_id = 'payment-proofs'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or private.is_staff()
  )
);

drop policy if exists payment_proofs_delete on storage.objects;
create policy payment_proofs_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'payment-proofs'
  and private.is_staff()
);

notify pgrst, 'reload schema';
