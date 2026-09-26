-- ============================================================
-- PHC लॉगिन सेटअप — Supabase Dashboard → SQL Editor मध्ये एकदा चालवा
-- (हे आधीच्या user_app_data सेटअपनंतर चालवा)
-- ============================================================

-- 1. भूमिका तक्ता: कोणता user PHC आहे, कोणता कर्मचारी
create table if not exists public.app_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('phc', 'worker')),
  created_at timestamptz default now()
);
alter table public.app_roles enable row level security;

-- 2. helper function: सध्याचा user PHC आहे का?
create or replace function public.is_phc()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_roles
    where user_id = auth.uid() and role = 'phc'
  );
$$;

-- 3. app_roles वरील policies
drop policy if exists "Users read own role" on public.app_roles;
create policy "Users read own role"
  on public.app_roles for select
  using (auth.uid() = user_id);

drop policy if exists "PHC reads all roles" on public.app_roles;
create policy "PHC reads all roles"
  on public.app_roles for select
  using (public.is_phc());

drop policy if exists "PHC manages roles" on public.app_roles;
create policy "PHC manages roles"
  on public.app_roles for all
  using (public.is_phc())
  with check (public.is_phc());

grant select, insert, update, delete on public.app_roles to authenticated;

-- 4. PHC ला सर्वांचे अहवाल वाचण्याची परवानगी
drop policy if exists "PHC reads all reports" on public.user_app_data;
create policy "PHC reads all reports"
  on public.user_app_data for select
  using (public.is_phc());

-- ============================================================
-- 5. PHC खाते निश्चित करा:
--    खालील ओळींमधला email तुमच्या PHC अधिकाऱ्याच्या login email ने
--    बदला, -- काढा आणि स्वतंत्रपणे चालवा.
-- ============================================================
-- insert into public.app_roles (user_id, role)
-- select id, 'phc' from auth.users where email = 'phc-officer@example.com'
-- on conflict (user_id) do update set role = excluded.role;
