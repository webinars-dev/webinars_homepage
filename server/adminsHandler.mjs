import { createClient } from '@supabase/supabase-js';

const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const readJsonBody = async (req) => {
  return await new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve(null);
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
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
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error('Missing SUPABASE_URL');
  if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
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
    const message = error?.message || 'Invalid token';
    const err = new Error(message);
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

const findAuthUserByEmail = async (supabaseAdmin, email) => {
  const perPage = 200;
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users || [];
    const found = users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (users.length < perPage) break;
  }
  return null;
};

const upsertAuthorAdmin = async (supabaseAdmin, { userId, email, name }) => {
  const { data: existing, error: selectError } = await supabaseAdmin
    .from('authors')
    .select('id, name, email, role')
    .eq('id', userId)
    .limit(1);

  if (selectError) throw selectError;

  const payload = {
    id: userId,
    email,
    name: name || email?.split('@')?.[0] || 'Admin',
    role: 'admin',
  };

  if (existing?.length) {
    const { data, error } = await supabaseAdmin
      .from('authors')
      .update({ role: 'admin', name: payload.name, email: payload.email })
      .eq('id', userId)
      .select('id, name, email, role, created_at')
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabaseAdmin
    .from('authors')
    .insert(payload)
    .select('id, name, email, role, created_at')
    .single();
  if (error) throw error;
  return data;
};

const setUserAppRole = async (supabaseAdmin, userId, role, name) => {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error) throw error;
  const user = data?.user;
  const nextAppMetadata = { ...(user?.app_metadata || {}), role };
  const nextUserMetadata = name
    ? { ...(user?.user_metadata || {}), name }
    : user?.user_metadata || {};

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: nextAppMetadata,
    user_metadata: nextUserMetadata,
  });
  if (updateError) throw updateError;
};

const requireNotLastAdmin = async (supabaseAdmin, targetUserId) => {
  const { data: admins, error, count } = await supabaseAdmin
    .from('authors')
    .select('id', { count: 'exact' })
    .eq('role', 'admin');

  if (error) throw error;

  const total = typeof count === 'number' ? count : admins?.length || 0;
  if (total <= 1 && admins?.[0]?.id === targetUserId) {
    const err = new Error('마지막 관리자는 제거할 수 없습니다.');
    err.status = 400;
    throw err;
  }
};

export async function handleAdminsRequest(req, res, { env = process.env } = {}) {
  try {
    const supabaseAdmin = createAdminClient(env);
    const token = getBearerToken(req);
    if (!token) return json(res, 401, { error: 'Missing Authorization header' });

    const actor = await requireAdminActor(supabaseAdmin, token);

    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('authors')
        .select('id, name, email, role, created_at')
        .eq('role', 'admin')
        .order('created_at', { ascending: true });

      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { admins: data || [] });
    }

    if (req.method === 'POST') {
      const body = (await readJsonBody(req)) || {};
      const email = String(body.email || '').trim();
      const password = String(body.password || '').trim();
      const name = String(body.name || '').trim();
      const createUser = Boolean(body.createUser);

      if (!email) return json(res, 400, { error: '이메일을 입력해주세요.' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 400, { error: '이메일 형식이 올바르지 않습니다.' });

      let authUser = null;

      if (createUser) {
        if (!password || password.length < 8) {
          return json(res, 400, { error: '새 계정 생성 시 비밀번호(8자 이상)가 필요합니다.' });
        }

        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: name ? { name } : {},
          app_metadata: { role: 'admin' },
        });

        if (error) {
          const alreadyExists = String(error.message || '').toLowerCase().includes('already');
          if (!alreadyExists) return json(res, 400, { error: error.message });
        } else {
          authUser = data?.user || null;
        }
      }

      if (!authUser) {
        authUser = await findAuthUserByEmail(supabaseAdmin, email);
      }

      if (!authUser) {
        return json(res, 404, {
          error: '사용자를 찾을 수 없습니다. 새 계정 생성 옵션을 사용하거나 Supabase Auth에 먼저 계정을 생성해주세요.',
        });
      }

      await setUserAppRole(supabaseAdmin, authUser.id, 'admin', name || undefined);
      const author = await upsertAuthorAdmin(supabaseAdmin, { userId: authUser.id, email, name: name || undefined });

      return json(res, 200, { admin: author });
    }

    if (req.method === 'DELETE') {
      const body = (await readJsonBody(req)) || {};
      const userId = String(body.userId || '').trim();

      if (!userId) return json(res, 400, { error: 'userId가 필요합니다.' });

      await requireNotLastAdmin(supabaseAdmin, userId);

      if (userId === actor.id) {
        const { data, error, count } = await supabaseAdmin
          .from('authors')
          .select('id', { count: 'exact' })
          .eq('role', 'admin');

        const total = typeof count === 'number' ? count : data?.length || 0;
        if (error) return json(res, 500, { error: error.message });
        if (total <= 1) return json(res, 400, { error: '마지막 관리자는 제거할 수 없습니다.' });
      }

      await setUserAppRole(supabaseAdmin, userId, 'author');

      const { error: authorError } = await supabaseAdmin
        .from('authors')
        .update({ role: 'author' })
        .eq('id', userId);

      if (authorError) return json(res, 500, { error: authorError.message });

      return json(res, 200, { ok: true });
    }

    res.setHeader('Allow', 'GET,POST,DELETE');
    return json(res, 405, { error: `Method ${req.method} not allowed` });
  } catch (error) {
    const status = typeof error?.status === 'number' ? error.status : 500;
    return json(res, status, { error: error?.message || 'Unknown error' });
  }
}

