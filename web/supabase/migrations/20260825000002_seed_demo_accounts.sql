-- =========================================================================
-- PackCheck — Pre-created Demo Accounts Migration (002)
-- Legal Metrology Compliance & Inspection Intelligence Platform
-- =========================================================================

-- Enable pgcrypto for password hashing
create extension if not exists "pgcrypto";

do $$
declare
  officer_uuid uuid := 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'::uuid;
  consumer_uuid uuid := 'b2c3d4e5-f6a1-4b5c-9d0e-1f2a3b4c5d6e'::uuid;
begin
  -- 1. Create or Update Investigator Demo Account (officer@packcheck.in / Pack@123)
  if exists (select 1 from auth.users where email = 'officer@packcheck.in') then
    update auth.users
    set encrypted_password = crypt('Pack@123', gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"role":"investigator","full_name":"Officer R. Sharma"}'::jsonb,
        updated_at = now()
    where email = 'officer@packcheck.in';
  else
    insert into auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token
    ) values (
      officer_uuid,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'officer@packcheck.in',
      crypt('Pack@123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"role":"investigator","full_name":"Officer R. Sharma"}'::jsonb,
      now(),
      now(),
      'authenticated',
      'authenticated',
      ''
    );
  end if;

  -- Upsert matching investigator profile in public.profiles
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    designation,
    badge_number,
    is_verified,
    created_at,
    updated_at
  )
  select
    id,
    'officer@packcheck.in',
    'Officer R. Sharma',
    'investigator'::public.user_role_type,
    'Legal Metrology Inspector',
    'LM-INSP-2026-088',
    true,
    now(),
    now()
  from auth.users
  where email = 'officer@packcheck.in'
  on conflict (id) do update
  set role = 'investigator'::public.user_role_type,
      designation = 'Legal Metrology Inspector',
      badge_number = 'LM-INSP-2026-088',
      full_name = 'Officer R. Sharma',
      updated_at = now();

  -- 2. Create or Update Consumer Demo Account (user@packcheck.in / User@123)
  if exists (select 1 from auth.users where email = 'user@packcheck.in') then
    update auth.users
    set encrypted_password = crypt('User@123', gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"role":"consumer","full_name":"Citizen Consumer"}'::jsonb,
        updated_at = now()
    where email = 'user@packcheck.in';
  else
    insert into auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token
    ) values (
      consumer_uuid,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'user@packcheck.in',
      crypt('User@123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"role":"consumer","full_name":"Citizen Consumer"}'::jsonb,
      now(),
      now(),
      'authenticated',
      'authenticated',
      ''
    );
  end if;

  -- Upsert matching consumer profile in public.profiles
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    designation,
    is_verified,
    created_at,
    updated_at
  )
  select
    id,
    'user@packcheck.in',
    'Citizen Consumer',
    'consumer'::public.user_role_type,
    'Consumer',
    true,
    now(),
    now()
  from auth.users
  where email = 'user@packcheck.in'
  on conflict (id) do update
  set role = 'consumer'::public.user_role_type,
      designation = 'Consumer',
      full_name = 'Citizen Consumer',
      updated_at = now();

end $$;
