-- ============================================================
-- PHC डॅशबोर्ड: उपकेंद्र अहवाल व कर्मचारी डिलीट करण्याची परवानगी
--
-- वापरण्याची पद्धत: Supabase Dashboard -> SQL Editor -> New query
-- यात संपूर्ण code paste करून Run दाबा.
--
-- अट: आधी supabase-phc-setup.sql चालवलेला असावा
-- (त्यात public.app_roles व public.is_phc() तयार होते)
-- ============================================================

-- 1. PHC ला इतरांचे अहवाल (डेटा rows) डिलीट करण्याची परवानगी
--    स्वतःचा डेटा डिलीट करता येणार नाही
drop policy if exists "PHC deletes reports" on public.user_app_data;
create policy "PHC deletes reports"
  on public.user_app_data for delete
  using (public.is_phc() and auth.uid() <> user_id);

-- 2. कर्मचारी account कायमचे डिलीट करणारे function
--    (auth.users मधून डिलीट फक्त server बाजूने शक्य आहे,
--     म्हणून SECURITY DEFINER function वापरले आहे)
create or replace function public.delete_worker_account(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role text;
begin
  -- फक्त PHC अधिकारीच डिलीट करू शकतात
  if not public.is_phc() then
    raise exception 'फक्त PHC अधिकारीच कर्मचारी डिलीट करू शकतात';
  end if;
  -- स्वतःचे account डिलीट करता येणार नाही
  if target_user_id = auth.uid() then
    raise exception 'स्वतःचे account डिलीट करता येणार नाही';
  end if;
  -- दुसऱ्या PHC अधिकाऱ्याचे account डिलीट करता येणार नाही
  select role into target_role from public.app_roles where user_id = target_user_id;
  if target_role = 'phc' then
    raise exception 'PHC अधिकाऱ्याचे account डिलीट करता येणार नाही';
  end if;
  -- क्रमाने डिलीट: भूमिका -> अहवाल डेटा -> login account
  delete from public.app_roles where user_id = target_user_id;
  delete from public.user_app_data where user_id = target_user_id;
  delete from auth.users where id = target_user_id;
end;
$$;

grant execute on function public.delete_worker_account(uuid) to authenticated;
