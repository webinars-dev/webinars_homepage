#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const defaultOutDir = '/Users/mac_studio/내 드라이브/00_WORKS/plan/webinars_home_plan/projects/2026-05-22-image-storage-audit';

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i].startsWith('--')) {
    args.set(process.argv[i].slice(2), process.argv[i + 1]?.startsWith('--') ? true : process.argv[i + 1]);
  }
}

const outDir = path.resolve(String(args.get('out') || defaultOutDir));
fs.mkdirSync(outDir, { recursive: true });

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return fs.readFileSync(filePath, 'utf8').split(/\r?\n/).reduce((env, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return env;
    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    value = value.replace(/^['"]|['"]$/g, '');
    env[key] = value;
    return env;
  }, {});
}

const env = { ...process.env, ...loadEnv(path.join(repoRoot, '.env.local')) };
const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local');
}

function csvCell(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function writeCsv(fileName, rows, headers) {
  const lines = [headers.map(csvCell).join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header])).join(','));
  }
  fs.writeFileSync(path.join(outDir, fileName), `${lines.join('\n')}\n`);
}

async function fetchTable(table, select) {
  const url = new URL(`/rest/v1/${table}`, supabaseUrl);
  url.searchParams.set('select', select);
  url.searchParams.set('deleted_at', 'is.null');
  url.searchParams.set('limit', '10000');

  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`${table} fetch failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

function decodePathname(pathname) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

function localCandidates(imageUrl) {
  let pathname = imageUrl;
  try {
    const parsed = new URL(imageUrl, 'https://webinars.co.kr');
    pathname = parsed.pathname;
  } catch {
    // Keep relative path as-is.
  }

  if (!pathname.startsWith('/wp-content/') && !pathname.startsWith('/images/') && !pathname.startsWith('/assets/')) {
    return [];
  }

  const decoded = decodePathname(pathname);
  const withoutLeadingSlash = decoded.replace(/^\/+/, '');
  const rawWithoutLeadingSlash = pathname.replace(/^\/+/, '');
  return [
    path.join(repoRoot, 'public', rawWithoutLeadingSlash),
    path.join(repoRoot, 'public', withoutLeadingSlash),
    path.join(repoRoot, 'public', withoutLeadingSlash.normalize('NFC')),
    path.join(repoRoot, 'public', withoutLeadingSlash.normalize('NFD')),
  ];
}

function resolveLocal(imageUrl) {
  const candidates = localCandidates(imageUrl);
  const exact = candidates[0];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  return {
    local_path: found ? path.relative(repoRoot, found) : '',
    missing: candidates.length > 0 && !found,
    normalization_needed: !!found && exact !== found,
  };
}

function classifyUrl(imageUrl) {
  if (!imageUrl) return 'empty';
  if (imageUrl.startsWith('data:image/')) return 'DB inline';
  if (imageUrl.includes('/storage/v1/object/public/')) return 'Storage 사용 중';
  if (/^(https?:)?\/\/webinars\.co\.kr\/wp-content\//.test(imageUrl) || /^\/?(wp-content|images|assets)\//.test(imageUrl)) {
    return 'public 파일';
  }
  if (/^https?:\/\//.test(imageUrl)) return '외부 URL';
  return 'unknown';
}

function extensionFromUrl(imageUrl) {
  const clean = imageUrl.split('?')[0].split('#')[0];
  const ext = path.extname(clean).replace('.', '').toLowerCase();
  return ext || 'bin';
}

function roleForSource(source, index) {
  if (source === 'reference_items.image_url') return 'card';
  if (source === 'reference_items.modal_html') return `modal-${index}`;
  if (source === 'posts.featured_image') return 'featured';
  if (source === 'posts.content') return `content-${index}`;
  return `image-${index}`;
}

function storagePathFor(row) {
  const hash = crypto.createHash('sha256').update(row.url).digest('hex').slice(0, 12);
  const ext = extensionFromUrl(row.url);
  const role = roleForSource(row.source, row.index_in_field);
  if (row.table_name === 'reference_items') {
    return `references/${row.row_id}/${role}-${hash}.${ext}`;
  }
  if (row.table_name === 'posts') {
    return `posts/${row.row_id}/${role}-${hash}.${ext}`;
  }
  return `common/migration/${role}-${hash}.${ext}`;
}

function extractHtmlImages(html) {
  const refs = [];
  const seen = new Set();
  const push = (kind, value) => {
    const url = String(value || '').trim();
    if (!url || seen.has(`${kind}:${url}`)) return;
    seen.add(`${kind}:${url}`);
    refs.push({ kind, url });
  };

  for (const match of String(html || '').matchAll(/\bsrc\s*=\s*["']([^"']+)["']/gi)) {
    push('src', match[1]);
  }

  for (const match of String(html || '').matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/gi)) {
    for (const candidate of match[1].split(',')) {
      const url = candidate.trim().split(/\s+/)[0];
      push('srcset', url);
    }
  }

  for (const match of String(html || '').matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) {
    push('css-url', match[1]);
  }

  return refs;
}

function collectDbRefs(referenceRows, postRows) {
  const refs = [];
  let index = 1;

  for (const item of referenceRows) {
    if (item.image_url) {
      refs.push({
        table_name: 'reference_items',
        row_id: item.id,
        title: item.title || '',
        source: 'reference_items.image_url',
        html_kind: 'field',
        index_in_field: 1,
        url: item.image_url,
      });
    }

    extractHtmlImages(item.modal_html).forEach((ref, refIndex) => {
      refs.push({
        table_name: 'reference_items',
        row_id: item.id,
        title: item.title || '',
        source: 'reference_items.modal_html',
        html_kind: ref.kind,
        index_in_field: refIndex + 1,
        url: ref.url,
      });
    });
  }

  for (const post of postRows) {
    if (post.featured_image) {
      refs.push({
        table_name: 'posts',
        row_id: post.id,
        title: post.title || post.slug || '',
        source: 'posts.featured_image',
        html_kind: 'field',
        index_in_field: 1,
        url: post.featured_image,
      });
    }

    extractHtmlImages(post.content).forEach((ref, refIndex) => {
      refs.push({
        table_name: 'posts',
        row_id: post.id,
        title: post.title || post.slug || '',
        source: 'posts.content',
        html_kind: ref.kind,
        index_in_field: refIndex + 1,
        url: ref.url,
      });
    });
  }

  return refs.map((ref) => {
    const local = resolveLocal(ref.url);
    const classification = classifyUrl(ref.url);
    return {
      dry_run_id: index++,
      ...ref,
      classification,
      migration_target: classification === 'public 파일' ? storagePathFor(ref) : '',
      ...local,
    };
  });
}

function listFiles(dir, result = []) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', 'playwright-report', 'test-results', '.npm-cache'].includes(entry.name)) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listFiles(fullPath, result);
    } else if (/\.(jsx?|tsx?|css|scss|html|md|json)$/i.test(entry.name)) {
      result.push(fullPath);
    }
  }
  return result;
}

function parseActiveRouteFiles() {
  const importMap = new Map();
  const active = new Map();
  const appPath = path.join(repoRoot, 'src', 'App.jsx');
  const app = fs.existsSync(appPath) ? fs.readFileSync(appPath, 'utf8') : '';

  for (const match of app.matchAll(/import\s+([A-Za-z0-9_$]+)\s+from\s+['"]([^'"]+)['"]/g)) {
    importMap.set(match[1], path.resolve(path.dirname(appPath), match[2]));
  }

  for (const match of app.matchAll(/<Route\s+path=["']([^"']+)["']\s+element=\{<([A-Za-z0-9_$]+)/g)) {
    const filePath = importMap.get(match[2]);
    if (!filePath) continue;
    active.set(filePath, match[1]);
  }

  return active;
}

function collectCodeRefs() {
  const activeRoutes = parseActiveRouteFiles();
  const files = listFiles(repoRoot);
  const refs = [];
  const urlRegex = /(?:https?:\/\/[^"'`\s)]+|\/(?:wp-content|images|assets)\/[^"'`\s)]+|(?:wp-content|images|assets)\/[^"'`\s)]+)/g;

  for (const filePath of files) {
    const text = fs.readFileSync(filePath, 'utf8');
    const relative = path.relative(repoRoot, filePath);
    const routePath = activeRoutes.get(filePath) || '';
    for (const match of text.matchAll(urlRegex)) {
      const url = match[0].replace(/[>,.;]+$/, '');
      if (!/\.(avif|gif|jpe?g|png|svg|webp)(\?|#|$)/i.test(url)) continue;
      refs.push({
        file: relative,
        route_path: routePath,
        priority: routePath ? 'active-route' : (relative.startsWith('archive/') ? 'inactive-archive-or-legacy-router' : 'non-archive-code'),
        classification: classifyUrl(url),
        url,
      });
    }
  }

  return refs;
}

const referenceRows = await fetchTable('reference_items', 'id,title,image_url,modal_path,modal_html,is_published,deleted_at');
const postRows = await fetchTable('posts', 'id,slug,title,featured_image,content,status,deleted_at');
const dbRefs = collectDbRefs(referenceRows, postRows);
const codeRefs = collectCodeRefs();

const duplicateMap = new Map();
for (const ref of dbRefs) {
  duplicateMap.set(ref.url, (duplicateMap.get(ref.url) || 0) + 1);
}

const duplicateRows = [...duplicateMap.entries()]
  .filter(([, count]) => count > 1)
  .map(([url, count]) => ({ url, count, classification: classifyUrl(url) }))
  .sort((a, b) => b.count - a.count || a.url.localeCompare(b.url));

const missingRows = dbRefs.filter((ref) => ref.classification === 'public 파일' && ref.missing);
const migrationRows = dbRefs.filter((ref) => ref.classification === 'public 파일');
const srcsetReferenceRows = referenceRows.filter((row) => /\bsrcset\s*=/i.test(row.modal_html || ''));
const srcsetDbRefs = dbRefs.filter((ref) => ref.html_kind === 'srcset');
const activeRouteCodeRefs = codeRefs.filter((ref) => ref.priority === 'active-route');

writeCsv('phase2-dry-run-db-candidates.csv', migrationRows, [
  'dry_run_id',
  'table_name',
  'row_id',
  'title',
  'source',
  'html_kind',
  'index_in_field',
  'classification',
  'url',
  'local_path',
  'missing',
  'normalization_needed',
  'migration_target',
]);

writeCsv('phase2-dry-run-missing-files.csv', missingRows, [
  'dry_run_id',
  'table_name',
  'row_id',
  'title',
  'source',
  'html_kind',
  'url',
  'classification',
]);

writeCsv('phase2-dry-run-duplicates.csv', duplicateRows, ['url', 'count', 'classification']);
writeCsv('phase2-dry-run-code-route-priority.csv', codeRefs, ['file', 'route_path', 'priority', 'classification', 'url']);

const summary = {
  scanned_at_kst: new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date()),
  db: {
    reference_rows: referenceRows.length,
    post_rows: postRows.length,
    image_reference_count: dbRefs.length,
    public_file_candidates: migrationRows.length,
    srcset_reference_items_modal_html_rows: srcsetReferenceRows.length,
    srcset_candidate_count: srcsetDbRefs.length,
    missing_local_file_cases: missingRows.length,
    duplicate_url_groups: duplicateRows.length,
    duplicate_url_extra_references: duplicateRows.reduce((sum, row) => sum + row.count - 1, 0),
    nfd_nfc_normalization_cases: dbRefs.filter((ref) => ref.normalization_needed).length,
  },
  code: {
    image_reference_count: codeRefs.length,
    active_route_image_reference_count: activeRouteCodeRefs.length,
    active_route_file_count: new Set(activeRouteCodeRefs.map((ref) => ref.file)).size,
    inactive_archive_or_legacy_router_count: codeRefs.filter((ref) => ref.priority === 'inactive-archive-or-legacy-router').length,
    non_archive_code_reference_count: codeRefs.filter((ref) => ref.priority === 'non-archive-code').length,
  },
  policy_decisions: {
    storage_paths: {
      interactive_uploads: 'references/{id}/{purpose}-{uuid}.{ext}, posts/{id}/{purpose}-{uuid}.{ext}',
      migration_uploads: 'references/{id}/{role}-{sha256-12}.{ext}, posts/{id}/{role}-{sha256-12}.{ext}',
    },
    srcset: 'Preserve srcset. Upload and rewrite each candidate URL; do not collapse to a single src unless a source file is missing and the fallback is explicitly approved.',
    idempotency: 'Use content/URL hash based object paths; on rerun, reuse an existing object path instead of creating a duplicate.',
    filename_normalization: 'Decode URL path segments, normalize to NFC for Storage object paths, and try raw/NFC/NFD local lookup on macOS.',
  },
};

fs.writeFileSync(path.join(outDir, 'phase2-dry-run-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

console.log(JSON.stringify(summary, null, 2));
