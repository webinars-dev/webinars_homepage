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

const findAuthUserIdByEmailInAuthors = async (supabaseAdmin, email) => {
  const { data, error } = await supabaseAdmin
    .from('authors')
    .select('id')
    .eq('email', email)
    .limit(1);

  if (error) throw error;
  return data?.[0]?.id || null;
};

const findAuthUserByEmail = async (supabaseAdmin, email) => {
  const perPage = 200;
  const lowerEmail = email.toLowerCase();
  let totalPages = null;

  for (let page = 1; page <= 200; page += 1) {
    if (typeof totalPages === 'number' && page > totalPages) break;
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users || [];
    const found = users.find((u) => (u.email || '').toLowerCase() === lowerEmail);
    if (found) return found;
    if (typeof data?.total === 'number') {
      totalPages = Math.ceil(data.total / perPage);
    }
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

  const existingRow = existing?.[0] || null;
  const fallbackName = email?.split('@')?.[0] || 'Admin';

  const payload = {
    id: userId,
    email,
    name: name || existingRow?.name || fallbackName,
    role: 'admin',
  };

  if (existing?.length) {
    const { data, error } = await supabaseAdmin
      .from('authors')
      .update({
        role: 'admin',
        email: payload.email,
        ...(name ? { name: payload.name } : {}),
      })
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
          if (isLikelySupabaseAdminKeyError(error)) {
            return json(res, 500, {
              error: '서버 설정 오류: SUPABASE_SERVICE_ROLE_KEY(또는 SUPABASE_SECRET_KEY)에 service_role/secret key를 설정해주세요.',
            });
          }
          const alreadyExists = String(error.message || '').toLowerCase().includes('already');
          if (!alreadyExists) return json(res, 400, { error: error.message });
        } else {
          authUser = data?.user || null;
        }
      }

      if (!authUser) {
        const authorUserId = await findAuthUserIdByEmailInAuthors(supabaseAdmin, email).catch(() => null);
        if (authorUserId) {
          const { data, error } = await supabaseAdmin.auth.admin.getUserById(authorUserId);
          if (error) {
            if (isLikelySupabaseAdminKeyError(error)) {
              return json(res, 500, {
                error: '서버 설정 오류: SUPABASE_SERVICE_ROLE_KEY(또는 SUPABASE_SECRET_KEY)에 service_role/secret key를 설정해주세요.',
              });
            }
          } else {
            authUser = data?.user || null;
          }
        }
      }

      if (!authUser) {
        try {
          authUser = await findAuthUserByEmail(supabaseAdmin, email);
        } catch (error) {
          if (isLikelySupabaseAdminKeyError(error)) {
            return json(res, 500, {
              error: '서버 설정 오류: SUPABASE_SERVICE_ROLE_KEY(또는 SUPABASE_SECRET_KEY)에 service_role/secret key를 설정해주세요.',
            });
          }
          throw error;
        }
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

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const body = (await readJsonBody(req)) || {};
      const userId = String(body.userId || '').trim();
      const email = String(body.email || '').trim();
      const password = String(body.password || '').trim();
      const name = String(body.name || '').trim();

      if (!userId) return json(res, 400, { error: 'userId가 필요합니다.' });
      if (!email) return json(res, 400, { error: '이메일을 입력해주세요.' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 400, { error: '이메일 형식이 올바르지 않습니다.' });
      if (password && password.length < 8) return json(res, 400, { error: '비밀번호는 8자 이상이어야 합니다.' });

      const { data: authorRows, error: authorSelectError } = await supabaseAdmin
        .from('authors')
        .select('id, name, email, role, created_at')
        .eq('id', userId)
        .limit(1);

      if (authorSelectError) return json(res, 500, { error: authorSelectError.message });
      const authorRow = authorRows?.[0] || null;
      if (!authorRow) return json(res, 404, { error: '관리자를 찾을 수 없습니다.' });
      if ((authorRow.role || '').toLowerCase() !== 'admin') return json(res, 400, { error: '대상 계정이 관리자가 아닙니다.' });

      let authUser = null;
      try {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (error) throw error;
        authUser = data?.user || null;
      } catch (error) {
        if (isLikelySupabaseAdminKeyError(error)) {
          return json(res, 500, {
            error: '서버 설정 오류: SUPABASE_SERVICE_ROLE_KEY(또는 SUPABASE_SECRET_KEY)에 service_role/secret key를 설정해주세요.',
          });
        }
        return json(res, 400, { error: error?.message || '사용자 정보를 불러오지 못했습니다.' });
      }

      if (!authUser) return json(res, 404, { error: 'Supabase Auth 사용자를 찾을 수 없습니다.' });

      const authUpdate = {};

      if (email && email !== authUser.email) {
        authUpdate.email = email;
        authUpdate.email_confirm = true;
      }

      if (password) {
        authUpdate.password = password;
      }

      if (name) {
        authUpdate.user_metadata = { ...(authUser.user_metadata || {}), name };
      }

      if (Object.keys(authUpdate).length) {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdate);
        if (updateError) {
          if (isLikelySupabaseAdminKeyError(updateError)) {
            return json(res, 500, {
              error: '서버 설정 오류: SUPABASE_SERVICE_ROLE_KEY(또는 SUPABASE_SECRET_KEY)에 service_role/secret key를 설정해주세요.',
            });
          }
          return json(res, 400, { error: updateError.message });
        }
      }

      const authorUpdate = {
        ...(email ? { email } : {}),
        ...(name ? { name } : {}),
      };

      if (Object.keys(authorUpdate).length) {
        const { data, error } = await supabaseAdmin
          .from('authors')
          .update(authorUpdate)
          .eq('id', userId)
          .select('id, name, email, role, created_at')
          .single();

        if (error) {
          const isUniqueError = String(error.code || '') === '23505';
          return json(res, 400, { error: isUniqueError ? '이미 사용 중인 이메일입니다.' : error.message });
        }

        return json(res, 200, { admin: data });
      }

      return json(res, 200, { admin: authorRow });
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

    res.setHeader('Allow', 'GET,POST,PUT,PATCH,DELETE');
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
