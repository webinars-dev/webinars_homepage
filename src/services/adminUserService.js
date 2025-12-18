import { supabase } from '../lib/supabase';

const requireAccessToken = async () => {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data?.session?.access_token;
  if (!token) throw new Error('Not authenticated');
  return token;
};

const fetchJson = async (url, { method = 'GET', body } = {}) => {
  const token = await requireAccessToken();

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }
  return data;
};

export async function getAdmins() {
  const data = await fetchJson('/api/admins');
  return data?.admins || [];
}

export async function upsertAdmin({ email, name, password, createUser }) {
  const data = await fetchJson('/api/admins', {
    method: 'POST',
    body: { email, name, password, createUser },
  });
  return data?.admin;
}

export async function revokeAdmin(userId) {
  await fetchJson('/api/admins', {
    method: 'DELETE',
    body: { userId },
  });
}

export async function updateAdmin({ userId, email, name, password }) {
  const data = await fetchJson('/api/admins', {
    method: 'PUT',
    body: { userId, email, name, password },
  });
  return data?.admin;
}
