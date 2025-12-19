import { supabase } from '../lib/supabase';

const requireAccessToken = async () => {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data?.session?.access_token;
  if (!token) throw new Error('Not authenticated');
  return token;
};

const fetchJson = async (url) => {
  const token = await requireAccessToken();

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }
  return data;
};

export async function getAnalytics({ rangeDays = 7 } = {}) {
  const days = Number(rangeDays) || 7;
  return await fetchJson(`/api/analytics?rangeDays=${encodeURIComponent(days)}`);
}

