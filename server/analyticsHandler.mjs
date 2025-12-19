import { createClient } from '@supabase/supabase-js';
import { GoogleAuth } from 'google-auth-library';

const GA_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

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

const normalizePropertyId = (raw) => {
  const value = String(raw || '').trim();
  if (!value) return null;
  if (value.startsWith('properties/')) return value.slice('properties/'.length);
  return value;
};

const requireGaEnv = (env) => {
  const propertyId = normalizePropertyId(pickFirstString(env.GA4_PROPERTY_ID, env.GA_PROPERTY_ID));
  if (!propertyId) throw new Error('Missing GA4_PROPERTY_ID');

  const serviceAccountJson = pickFirstString(
    env.GA4_SERVICE_ACCOUNT_JSON,
    env.GOOGLE_SERVICE_ACCOUNT_JSON,
    env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  );

  const clientEmail = pickFirstString(env.GA4_CLIENT_EMAIL, env.GOOGLE_CLIENT_EMAIL);
  const privateKeyRaw = pickFirstString(env.GA4_PRIVATE_KEY, env.GOOGLE_PRIVATE_KEY);

  let credentials = null;
  if (serviceAccountJson) {
    try {
      credentials = JSON.parse(serviceAccountJson);
    } catch {
      throw new Error('GA4_SERVICE_ACCOUNT_JSON is not valid JSON');
    }
  } else if (clientEmail && privateKeyRaw) {
    credentials = {
      client_email: clientEmail,
      private_key: privateKeyRaw.replace(/\\n/g, '\n'),
    };
  } else {
    throw new Error('Missing GA4_SERVICE_ACCOUNT_JSON (or GA4_CLIENT_EMAIL/GA4_PRIVATE_KEY)');
  }

  return { propertyId, credentials };
};

const getGoogleClient = async (env) => {
  const { credentials } = requireGaEnv(env);
  const auth = new GoogleAuth({
    credentials,
    scopes: [GA_SCOPE],
  });
  return await auth.getClient();
};

const runReport = async (googleClient, propertyId, body) => {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
  const response = await googleClient.request({ url, method: 'POST', data: body });
  return response?.data || null;
};

const parseTotalMetrics = (report) => {
  const values = report?.totals?.[0]?.metricValues || [];
  return values.map((mv) => Number(mv?.value || 0));
};

const parseDate = (yyyymmdd) => {
  const raw = String(yyyymmdd || '').trim();
  const match = raw.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!match) return raw || '-';
  return `${match[1]}-${match[2]}-${match[3]}`;
};

const parseRows = (report) => report?.rows || [];

export async function handleAnalyticsRequest(req, res, { env = process.env } = {}) {
  try {
    const token = getBearerToken(req);
    if (!token) return json(res, 401, { error: 'Missing Authorization header' });

    const supabaseAdmin = createAdminClient(env);
    await requireAdminActor(supabaseAdmin, token);

    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return json(res, 405, { error: `Method ${req.method} not allowed` });
    }

    const url = new URL(req.url, 'http://localhost');
    const rangeDaysRaw = url.searchParams.get('rangeDays');
    const rangeDays = Math.min(Math.max(Number(rangeDaysRaw || 7) || 7, 1), 90);
    const startOffset = Math.max(rangeDays - 1, 0);

    const { propertyId } = requireGaEnv(env);
    const googleClient = await getGoogleClient(env);

    const dateRanges = [{ startDate: `${startOffset}daysAgo`, endDate: 'today' }];

    const overviewReport = await runReport(googleClient, propertyId, {
      dateRanges,
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'eventCount' },
      ],
      metricAggregations: ['TOTAL'],
    });

    const dailyReport = await runReport(googleClient, propertyId, {
      dateRanges,
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    });

    const topPagesReport = await runReport(googleClient, propertyId, {
      dateRanges,
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    });

    const topPagesFiltered = async (prefix) => {
      return await runReport(googleClient, propertyId, {
        dateRanges,
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
        dimensionFilter: {
          filter: {
            fieldName: 'pagePath',
            stringFilter: {
              value: prefix,
              matchType: 'BEGINS_WITH',
            },
          },
        },
      });
    };

    const [topBlogReport, topReferenceReport] = await Promise.all([
      topPagesFiltered('/blog'),
      topPagesFiltered('/reference'),
    ]);

    const [activeUsers, sessions, screenPageViews, eventCount] = parseTotalMetrics(overviewReport);

    const daily = parseRows(dailyReport).map((row) => {
      const date = parseDate(row?.dimensionValues?.[0]?.value);
      const active = Number(row?.metricValues?.[0]?.value || 0);
      const sess = Number(row?.metricValues?.[1]?.value || 0);
      const views = Number(row?.metricValues?.[2]?.value || 0);
      return { date, activeUsers: active, sessions: sess, pageViews: views };
    });

    const topPages = parseRows(topPagesReport).map((row) => {
      const path = row?.dimensionValues?.[0]?.value || '-';
      const views = Number(row?.metricValues?.[0]?.value || 0);
      return { path, pageViews: views };
    });

    const topBlogPages = parseRows(topBlogReport).map((row) => {
      const path = row?.dimensionValues?.[0]?.value || '-';
      const views = Number(row?.metricValues?.[0]?.value || 0);
      return { path, pageViews: views };
    });

    const topReferencePages = parseRows(topReferenceReport).map((row) => {
      const path = row?.dimensionValues?.[0]?.value || '-';
      const views = Number(row?.metricValues?.[0]?.value || 0);
      return { path, pageViews: views };
    });

    return json(res, 200, {
      ok: true,
      rangeDays,
      propertyId,
      overview: { activeUsers, sessions, pageViews: screenPageViews, eventCount },
      daily,
      topPages,
      topBlogPages,
      topReferencePages,
      fetchedAt: new Date().toISOString(),
    });
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

