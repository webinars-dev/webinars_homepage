import { createClient } from '@supabase/supabase-js';

const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const pickFirstString = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
};

const decodeJwtPayload = (token) => {
  try {
    const parts = String(token || '').split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
};

const isLikelySupabaseAdminKeyError = (error) => {
  const message = String(error?.message || '');
  const lower = message.toLowerCase();
  return (
    lower.includes('service_role') ||
    lower.includes('admin api') ||
    lower.includes('invalid api key') ||
    lower.includes('apikey') ||
    lower.includes('not authorized')
  );
};

const readJsonBody = async (req) => {
  if (req?.body) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        throw new Error('Invalid JSON body');
      }
    }
    return req.body;
  }

  return await new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve(null);
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', (error) => reject(error));
  });
};

const getBearerToken = (req) => {
  const header = req.headers?.authorization;
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
};

const requireEnv = (env) => {
  const url = pickFirstString(
    env.SUPABASE_URL,
    env.VITE_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.WEBI_SUPABASE_URL
  );
  const serviceRoleKey = pickFirstString(
    env.SUPABASE_SERVICE_ROLE_KEY,
    env.SUPABASE_SECRET_KEY,
    env.SUPABASE_SECRET_API_KEY,
    env.SUPABASE_SECRET,
    env.SUPABASE_SERVICE_KEY
  );
  if (!url) throw new Error('Missing SUPABASE_URL');
  if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)');

  const publishableKey = pickFirstString(env.VITE_SUPABASE_ANON_KEY, env.SUPABASE_ANON_KEY, env.SUPABASE_PUBLISHABLE_KEY);
  if (publishableKey && publishableKey === serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is set to anon/publishable key (needs service_role/secret key)');
  }

  const payload = decodeJwtPayload(serviceRoleKey);
  if (payload?.role && payload.role !== 'service_role') {
    throw new Error(`SUPABASE_SERVICE_ROLE_KEY role is "${payload.role}" (needs "service_role")`);
  }

  return { url, serviceRoleKey };
};

const createAdminClient = (env) => {
  const { url, serviceRoleKey } = requireEnv(env);
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const requireAdminActor = async (supabaseAdmin, token) => {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    const err = new Error(error?.message || 'Invalid token');
    err.status = 401;
    throw err;
  }

  const user = data.user;

  if (user?.app_metadata?.role === 'admin') {
    return user;
  }

  const { data: authors, error: authorError } = await supabaseAdmin
    .from('authors')
    .select('role')
    .eq('id', user.id)
    .limit(1);

  if (authorError) {
    const err = new Error(authorError.message || 'Failed to load author role');
    err.status = 500;
    throw err;
  }

  if ((authors?.[0]?.role || '').toLowerCase() !== 'admin') {
    const err = new Error('Not authorized');
    err.status = 403;
    throw err;
  }

  return user;
};

export async function handlePostsRequest(req, res, { env = process.env } = {}) {
  try {
    const supabaseAdmin = createAdminClient(env);
    const token = getBearerToken(req);
    if (!token) return json(res, 401, { error: 'Missing Authorization header' });

    const actor = await requireAdminActor(supabaseAdmin, token);

    if (req.method === 'DELETE') {
      const body = (await readJsonBody(req)) || {};
      const postId = String(body.postId || body.id || '').trim();

      if (!postId) return json(res, 400, { error: 'postId가 필요합니다.' });

      const { error } = await supabaseAdmin
        .from('posts')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: actor.id,
        })
        .eq('id', postId);

      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { ok: true });
    }

    res.setHeader('Allow', 'DELETE');
    return json(res, 405, { error: `Method ${req.method} not allowed` });
  } catch (error) {
    const status = typeof error?.status === 'number' ? error.status : 500;
    if (isLikelySupabaseAdminKeyError(error)) {
      return json(res, 500, {
        error: '서버 설정 오류: SUPABASE_SERVICE_ROLE_KEY(또는 SUPABASE_SECRET_KEY)에 service_role/secret key를 설정해주세요.',
      });
    }
    return json(res, status, { error: error?.message || 'Unknown error' });
  }
}
