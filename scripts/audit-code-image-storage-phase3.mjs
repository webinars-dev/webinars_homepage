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
  const arg = process.argv[i];
  if (!arg.startsWith('--')) continue;
  const [key, inlineValue] = arg.slice(2).split('=');
  const nextValue = process.argv[i + 1];
  args.set(key, inlineValue ?? (nextValue?.startsWith('--') ? true : nextValue ?? true));
}

const outDir = path.resolve(String(args.get('out') || defaultOutDir));
fs.mkdirSync(outDir, { recursive: true });

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

function decodePathname(pathname) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

function normalizeRoute(routePath) {
  return String(routePath || 'root')
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'root';
}

function classifyUrl(imageUrl) {
  if (!imageUrl) return 'empty';
  if (imageUrl.startsWith('data:image/')) return 'inline';
  if (imageUrl.includes('/storage/v1/object/public/')) return 'Storage 사용 중';
  if (/^(https?:)?\/\/webinars\.co\.kr\/wp-content\//.test(imageUrl) || /^\/?(wp-content|images|assets)\//.test(imageUrl)) {
    return 'public 파일';
  }
  if (/^https?:\/\//.test(imageUrl)) return '외부 URL';
  return 'unknown';
}

function publicPathname(imageUrl) {
  try {
    return new URL(imageUrl, 'https://webinars.co.kr').pathname;
  } catch {
    return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  }
}

function localCandidates(imageUrl) {
  const pathname = publicPathname(imageUrl);
  if (!pathname.startsWith('/wp-content/') && !pathname.startsWith('/images/') && !pathname.startsWith('/assets/')) {
    return [];
  }

  const decoded = decodePathname(pathname);
  const rawWithoutLeadingSlash = pathname.replace(/^\/+/, '');
  const withoutLeadingSlash = decoded.replace(/^\/+/, '');
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
    absoluteLocalPath: found || '',
    local_path: found ? path.relative(repoRoot, found) : '',
    missing: candidates.length > 0 && !found,
    normalization_needed: !!found && exact !== found,
  };
}

function extensionFromUrl(imageUrl) {
  const clean = imageUrl.split('?')[0].split('#')[0];
  const ext = path.extname(clean).replace('.', '').toLowerCase();
  return ext || 'bin';
}

function contentHash(localPath, fallback) {
  if (localPath) {
    return crypto.createHash('sha256').update(fs.readFileSync(localPath)).digest('hex');
  }
  return crypto.createHash('sha256').update(fallback).digest('hex');
}

function storagePathFor(ref) {
  const pathname = decodePathname(publicPathname(ref.url)).normalize('NFC');
  const ext = extensionFromUrl(ref.url);
  const parsed = path.parse(pathname);
  const baseName = parsed.name.replace(/[^a-zA-Z0-9가-힣._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'image';
  const prefix = parsed.dir.replace(/^\/+/, '').replace(/[^a-zA-Z0-9/_-]+/g, '-').replace(/\/+/g, '/');
  return `site-assets/${prefix}/${baseName}-${ref.source_hash.slice(0, 12)}.${ext}`.normalize('NFC');
}

function parseActiveRouteFiles() {
  const appPath = path.join(repoRoot, 'src', 'App.jsx');
  const app = fs.readFileSync(appPath, 'utf8');
  const importMap = new Map();
  const activeFiles = new Map();

  for (const match of app.matchAll(/import\s+([A-Za-z0-9_$]+)\s+from\s+['"]([^'"]+)['"]/g)) {
    importMap.set(match[1], path.resolve(path.dirname(appPath), match[2]));
  }

  for (const match of app.matchAll(/<Route\s+path=["']([^"']+)["']\s+element=\{<([A-Za-z0-9_$]+)/g)) {
    const routePath = match[1];
    const component = match[2];
    const filePath = importMap.get(component);
    if (!filePath) continue;
    const current = activeFiles.get(filePath) || { component, routes: [] };
    current.routes.push(routePath);
    activeFiles.set(filePath, current);
  }

  return activeFiles;
}

function collectRefsFromFile(filePath, routeInfo) {
  const text = fs.readFileSync(filePath, 'utf8');
  const relative = path.relative(repoRoot, filePath);
  const urlRegex = /(?:https?:\/\/[^"'`\s)]+|(?<![A-Za-z0-9_.-])\/(?:wp-content|images|assets)\/[^"'`\s)]+)/g;
  const refs = [];
  let index = 1;

  for (const match of text.matchAll(urlRegex)) {
    const url = match[0].replace(/[>,.;]+$/, '');
    if (!/\.(avif|gif|jpe?g|png|svg|webp)(\?|#|$)/i.test(url)) continue;
    const line = text.slice(0, match.index).split('\n').length;
    const local = resolveLocal(url);
    const sourceHash = contentHash(local.absoluteLocalPath, url);
    refs.push({
      file: relative,
      line,
      component: routeInfo.component,
      routes: routeInfo.routes.join(' | '),
      primary_route: routeInfo.routes[0],
      route_slug: normalizeRoute(routeInfo.routes[0]),
      ref_index: index++,
      classification: classifyUrl(url),
      url,
      local_path: local.local_path,
      missing: local.missing,
      normalization_needed: local.normalization_needed,
      source_hash: sourceHash,
    });
  }

  return refs.map((ref) => ({
    ...ref,
    migration_target: ref.classification === 'public 파일' ? storagePathFor(ref) : '',
  }));
}

const activeFiles = parseActiveRouteFiles();
const allRefs = [...activeFiles.entries()].flatMap(([filePath, routeInfo]) => collectRefsFromFile(filePath, routeInfo));
const publicRefs = allRefs.filter((ref) => ref.classification === 'public 파일');
const missingRefs = publicRefs.filter((ref) => ref.missing);
const duplicateByUrl = new Map();
const duplicateByTarget = new Map();

for (const ref of publicRefs) {
  duplicateByUrl.set(ref.url, (duplicateByUrl.get(ref.url) || 0) + 1);
  duplicateByTarget.set(ref.migration_target, (duplicateByTarget.get(ref.migration_target) || 0) + 1);
}

const duplicateUrlRows = [...duplicateByUrl.entries()]
  .filter(([, count]) => count > 1)
  .map(([url, count]) => ({ url, count }))
  .sort((a, b) => b.count - a.count || a.url.localeCompare(b.url));

const routeRows = [...activeFiles.entries()].map(([filePath, routeInfo]) => {
  const file = path.relative(repoRoot, filePath);
  const refs = publicRefs.filter((ref) => ref.file === file);
  return {
    file,
    component: routeInfo.component,
    routes: routeInfo.routes.join(' | '),
    public_image_refs: refs.length,
    unique_urls: new Set(refs.map((ref) => ref.url)).size,
    missing_refs: refs.filter((ref) => ref.missing).length,
  };
}).sort((a, b) => b.public_image_refs - a.public_image_refs || a.file.localeCompare(b.file));

writeCsv('phase3-dry-run-active-route-code-images.csv', publicRefs, [
  'file',
  'line',
  'component',
  'routes',
  'classification',
  'url',
  'local_path',
  'missing',
  'normalization_needed',
  'source_hash',
  'migration_target',
]);
writeCsv('phase3-dry-run-missing-files.csv', missingRefs, [
  'file',
  'line',
  'component',
  'routes',
  'url',
  'classification',
]);
writeCsv('phase3-dry-run-duplicate-urls.csv', duplicateUrlRows, ['url', 'count']);
writeCsv('phase3-dry-run-route-summary.csv', routeRows, [
  'file',
  'component',
  'routes',
  'public_image_refs',
  'unique_urls',
  'missing_refs',
]);

const summary = {
  scanned_at_kst: new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date()),
  active_route_files: activeFiles.size,
  active_route_files_with_public_images: routeRows.filter((row) => Number(row.public_image_refs) > 0).length,
  active_route_public_image_refs: publicRefs.length,
  active_route_unique_public_urls: new Set(publicRefs.map((ref) => ref.url)).size,
  planned_storage_objects: new Set(publicRefs.map((ref) => ref.migration_target)).size,
  missing_local_file_cases: missingRefs.length,
  duplicate_url_groups: duplicateUrlRows.length,
  duplicate_url_extra_references: duplicateUrlRows.reduce((sum, row) => sum + row.count - 1, 0),
  nfd_nfc_normalization_cases: publicRefs.filter((ref) => ref.normalization_needed).length,
  top_routes_by_refs: routeRows.slice(0, 10),
  policy_decisions: {
    scope: 'Only route-mapped files imported by src/App.jsx are counted for Phase 3 priority.',
    storage_paths: 'site-assets/{public-path-dir}/{filename}-{sha256-12}.{ext}',
    idempotency: 'Storage target uses image file content hash where local file exists; identical files converge on the same object path.',
  },
};

fs.writeFileSync(path.join(outDir, 'phase3-dry-run-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
