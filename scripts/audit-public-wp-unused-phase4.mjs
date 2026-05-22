#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const defaultOutDir = '/Users/mac_studio/내 드라이브/00_WORKS/plan/webinars_home_plan/projects/2026-05-22-image-storage-audit';

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (!arg.startsWith('--')) continue;
  const [key, inlineValue] = arg.slice(2).split('=');
  const nextValue = process.argv[i + 1];
  args.set(key, inlineValue ?? (nextValue?.startsWith('--') ? true : nextValue ?? true));
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

function listFiles(dir, result = []) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listFiles(fullPath, result);
    } else {
      result.push(fullPath);
    }
  }
  return result;
}

function listTextFiles(dir, result = []) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', 'playwright-report', 'test-results', '.npm-cache'].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listTextFiles(fullPath, result);
    } else if (/\.(jsx?|tsx?|css|scss|html|md|json|mjs|cjs)$/i.test(entry.name)) {
      result.push(fullPath);
    }
  }
  return result;
}

function decodePathname(pathname) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

function wpPathFromUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  let pathname = raw;
  try {
    pathname = new URL(raw, 'https://webinars.co.kr').pathname;
  } catch {
    pathname = raw.startsWith('/') ? raw : `/${raw}`;
  }
  pathname = decodePathname(pathname).normalize('NFC');
  if (!pathname.startsWith('/wp-content/uploads/')) return '';
  return `public${pathname}`;
}

function extractWpReferencesFromText(text) {
  const refs = new Set();
  const regex = /https?:\/\/(?:www\.)?webinars\.co\.kr\/wp-content\/uploads\/[^"'`\s)]+|(?<![A-Za-z0-9_.-])\/wp-content\/uploads\/[^"'`\s)]+/gi;
  for (const match of String(text || '').matchAll(regex)) {
    const cleaned = match[0].replace(/[>,.;]+$/, '');
    const localPath = wpPathFromUrl(cleaned);
    if (localPath) refs.add(localPath);
  }
  return refs;
}

function extractDbImageRefs(rows) {
  const refs = new Set();
  const fields = ['image_url', 'modal_html', 'featured_image', 'content'];
  for (const row of rows) {
    for (const field of fields) {
      for (const ref of extractWpReferencesFromText(row[field] || '')) {
        refs.add(ref);
      }
    }
  }
  return refs;
}

async function fetchDbRows() {
  const env = { ...process.env, ...loadEnv(path.join(repoRoot, '.env.local')) };
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return { rows: [], skipped: true };
  }

  const tables = [
    ['reference_items', 'id,image_url,modal_html,deleted_at'],
    ['posts', 'id,featured_image,content,deleted_at'],
  ];
  const rows = [];

  for (const [table, select] of tables) {
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
    rows.push(...await response.json());
  }

  return { rows, skipped: false };
}

function parseActiveRouteFiles() {
  const appPath = path.join(repoRoot, 'src', 'App.jsx');
  const app = fs.existsSync(appPath) ? fs.readFileSync(appPath, 'utf8') : '';
  const importMap = new Map();
  const activeFiles = new Set();

  for (const match of app.matchAll(/import\s+([A-Za-z0-9_$]+)\s+from\s+['"]([^'"]+)['"]/g)) {
    importMap.set(match[1], path.resolve(path.dirname(appPath), match[2]));
  }

  for (const match of app.matchAll(/<Route\s+path=["'][^"']+["']\s+element=\{<([A-Za-z0-9_$]+)/g)) {
    const filePath = importMap.get(match[1]);
    if (filePath) activeFiles.add(path.relative(repoRoot, filePath));
  }

  return activeFiles;
}

const wpRoot = path.join(repoRoot, 'public', 'wp-content', 'uploads');
const localFiles = listFiles(wpRoot).filter((file) => /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(file));
const activeFiles = parseActiveRouteFiles();
const codeRefs = new Map();
const codeRefDetails = [];

for (const filePath of listTextFiles(repoRoot)) {
  const relativeFile = path.relative(repoRoot, filePath);
  const refs = extractWpReferencesFromText(fs.readFileSync(filePath, 'utf8'));
  for (const ref of refs) {
    const current = codeRefs.get(ref) || { active: 0, inactive: 0, files: new Set() };
    if (activeFiles.has(relativeFile)) current.active += 1;
    else current.inactive += 1;
    current.files.add(relativeFile);
    codeRefs.set(ref, current);
    codeRefDetails.push({
      local_path: ref,
      file: relativeFile,
      active_route_file: activeFiles.has(relativeFile),
    });
  }
}

const dbResult = await fetchDbRows();
const dbRefs = extractDbImageRefs(dbResult.rows);

const rows = localFiles.map((filePath) => {
  const relative = path.relative(repoRoot, filePath).normalize('NFC');
  const stat = fs.statSync(filePath);
  const code = codeRefs.get(relative);
  const usedByDb = dbRefs.has(relative);
  const activeCodeRefs = code?.active || 0;
  const inactiveCodeRefs = code?.inactive || 0;
  const status = usedByDb || activeCodeRefs > 0
    ? 'keep-active'
    : inactiveCodeRefs > 0
      ? 'archive-referenced-only'
      : 'unused-candidate';

  return {
    local_path: relative,
    size_bytes: stat.size,
    used_by_db: usedByDb,
    active_route_code_refs: activeCodeRefs,
    inactive_code_refs: inactiveCodeRefs,
    referencing_files: code ? [...code.files].join(' | ') : '',
    status,
  };
});

const unused = rows.filter((row) => row.status === 'unused-candidate');
const archiveOnly = rows.filter((row) => row.status === 'archive-referenced-only');
const keepActive = rows.filter((row) => row.status === 'keep-active');

writeCsv('phase4-public-wp-files.csv', rows, [
  'local_path',
  'size_bytes',
  'used_by_db',
  'active_route_code_refs',
  'inactive_code_refs',
  'referencing_files',
  'status',
]);
writeCsv('phase4-unused-wp-candidates.csv', unused, ['local_path', 'size_bytes', 'status']);
writeCsv('phase4-archive-referenced-wp-files.csv', archiveOnly, [
  'local_path',
  'size_bytes',
  'inactive_code_refs',
  'referencing_files',
  'status',
]);
writeCsv('phase4-active-wp-files.csv', keepActive, [
  'local_path',
  'size_bytes',
  'used_by_db',
  'active_route_code_refs',
  'referencing_files',
  'status',
]);
writeCsv('phase4-code-wp-reference-details.csv', codeRefDetails, ['local_path', 'file', 'active_route_file']);

const sumBytes = (items) => items.reduce((sum, item) => sum + Number(item.size_bytes || 0), 0);
const summary = {
  scanned_at_kst: new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date()),
  db_scan_skipped: dbResult.skipped,
  public_wp_files: rows.length,
  public_wp_size_bytes: sumBytes(rows),
  keep_active_files: keepActive.length,
  keep_active_size_bytes: sumBytes(keepActive),
  archive_referenced_only_files: archiveOnly.length,
  archive_referenced_only_size_bytes: sumBytes(archiveOnly),
  unused_candidate_files: unused.length,
  unused_candidate_size_bytes: sumBytes(unused),
  db_wp_references: dbRefs.size,
  active_route_wp_references: [...codeRefs.values()].reduce((sum, ref) => sum + ref.active, 0),
  inactive_code_wp_references: [...codeRefs.values()].reduce((sum, ref) => sum + ref.inactive, 0),
};

fs.writeFileSync(path.join(outDir, 'phase4-unused-wp-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
