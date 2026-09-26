import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AppRole = 'phc' | 'worker';

/** सध्याच्या user ची भूमिका वाचा (app_roles तक्ता नसेल तर 'worker'). */
export async function fetchMyRole(): Promise<AppRole> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 'worker';
    const { data, error } = await supabase
      .from('app_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error || !data) return 'worker';
    return data.role === 'phc' ? 'phc' : 'worker';
  } catch {
    return 'worker';
  }
}

export interface UserReportRow {
  user_id: string;
  data: any;
  updated_at: string;
}

/** PHC साठी: सर्व users चे अहवाल वाचा (RLS फक्त PHC ला परवानगी देते). */
export async function fetchAllUserReports(): Promise<UserReportRow[]> {
  const { data, error } = await supabase
    .from('user_app_data')
    .select('user_id, data, updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as UserReportRow[];
}
