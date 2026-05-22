#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const defaultOutDir = '/Users/mac_studio/내 드라이브/00_WORKS/plan/webinars_home_plan/projects/2026-05-22-image-storage-audit';
const bucket = 'blog-images';
const confirmToken = 'phase3-code-image-migration';

const MIME_BY_EXT = {
  avif: 'image/avif',
  gif: 'image/gif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};

function parseArgs() {
  const args = new Map();
  for (let i = 2; i < process.argv.length; i += 1) {
    const arg = process.argv[i];
    if (!arg.startsWith('--')) continue;
    const [key, inlineValue] = arg.slice(2).split('=');
    const nextValue = process.argv[i + 1];
    args.set(key, inlineValue ?? (nextValue?.startsWith('--') ? true : nextValue ?? true));
  }
  return args;
}

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

function writeCsv(filePath, rows, headers) {
  const lines = [headers.map(csvCell).join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header])).join(','));
  }
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`);
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }
    current += char;
  }

  values.push(current);
  return values;
}

function readCsv(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/);
  const headers = parseCsvLine(lines.shift() || '');
  return lines.filter(Boolean).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
  });
}

function timestampKstForPath() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date()).replace(/[ :]/g, '-');
}

function timestampKst() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date());
}

function decodePathname(pathname) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

function publicPathname(imageUrl) {
  try {
    return new URL(imageUrl, 'https://webinars.co.kr').pathname;
  } catch {
    return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  }
}

function isPublicImageUrl(imageUrl) {
  if (!/\.(avif|gif|jpe?g|png|svg|webp)(\?|#|$)/i.test(imageUrl)) return false;
  if (/^(https?:)?\/\/webinars\.co\.kr\/wp-content\//.test(imageUrl)) return true;
  return /^\/(?:wp-content|images|assets)\//.test(imageUrl);
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
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  return found || '';
}

function extensionFromUrl(imageUrl) {
  const clean = imageUrl.split('?')[0].split('#')[0];
  return path.extname(clean).replace('.', '').toLowerCase() || 'bin';
}

function sanitizePathPart(value) {
  return String(value || '')
    .normalize('NFC')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'image';
}

function storagePathFor(imageUrl, sourceHash) {
  const pathname = decodePathname(publicPathname(imageUrl)).normalize('NFC');
  const parsed = path.parse(pathname);
  const ext = extensionFromUrl(imageUrl);
  const baseName = sanitizePathPart(parsed.name);

  if (/^img_logo2?$/i.test(parsed.name)) {
    return `site-assets/common/branding/${baseName}-${sourceHash.slice(0, 12)}.${ext}`.normalize('NFC');
  }

  const prefix = parsed.dir.replace(/^\/+/, '').replace(/[^a-zA-Z0-9/_-]+/g, '-').replace(/\/+/g, '/');
  return `site-assets/${prefix}/${baseName}-${sourceHash.slice(0, 12)}.${ext}`.normalize('NFC');
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

function collectRefs() {
  const activeFiles = parseActiveRouteFiles();
  const refs = [];
  const urlRegex = /(?:https?:\/\/[^"'`\s)]+|(?<![A-Za-z0-9_.-])\/(?:wp-content|images|assets)\/[^"'`\s)]+)/g;

  for (const [filePath, routeInfo] of activeFiles.entries()) {
    const text = fs.readFileSync(filePath, 'utf8');
    const relativeFile = path.relative(repoRoot, filePath);
    for (const match of text.matchAll(urlRegex)) {
      const url = match[0].replace(/[>,.;]+$/, '');
      if (!isPublicImageUrl(url)) continue;
      const localPath = resolveLocal(url);
      if (!localPath) {
        throw new Error(`Missing local file for ${url} in ${relativeFile}`);
      }
      const buffer = fs.readFileSync(localPath);
      const sourceHash = crypto.createHash('sha256').update(buffer).digest('hex');
      refs.push({
        file: relativeFile,
        routes: routeInfo.routes.join(' | '),
        old_url: url,
        local_path: path.relative(repoRoot, localPath),
        storage_path: storagePathFor(url, sourceHash),
        source_hash: sourceHash,
        bytes: buffer.length,
        content_type: MIME_BY_EXT[extensionFromUrl(url)] || 'application/octet-stream',
      });
    }
  }

  return refs;
}

async function uploadOrReuse(supabase, objectPath, buffer, contentType, dryRun) {
  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  if (dryRun) {
    return { publicUrl: publicData.publicUrl, status: 'dry-run' };
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(objectPath, buffer, {
      cacheControl: '31536000',
      contentType,
      upsert: false,
    });

  if (!error) {
    return { publicUrl: publicData.publicUrl, status: 'uploaded' };
  }

  const { data: existing, error: downloadError } = await supabase.storage
    .from(bucket)
    .download(objectPath);

  if (!downloadError && existing) {
    return { publicUrl: publicData.publicUrl, status: 'reused-existing' };
  }

  throw error;
}

function buildFilePatches(mappingRows) {
  const byFile = new Map();
  for (const row of mappingRows) {
    const current = byFile.get(row.file) || new Map();
    current.set(row.old_url, row.new_url);
    byFile.set(row.file, current);
  }

  const patches = [];
  for (const [relativeFile, urlMap] of byFile.entries()) {
    const filePath = path.join(repoRoot, relativeFile);
    const original = fs.readFileSync(filePath, 'utf8');
    let next = original;
    const replacements = [...urlMap.entries()].sort((a, b) => b[0].length - a[0].length);
    for (const [oldUrl, newUrl] of replacements) {
      next = next.split(oldUrl).join(newUrl);
    }
    if (next !== original) {
      patches.push({ relativeFile, original, next, replacements: replacements.length });
    }
  }
  return patches;
}

function writeBackups(runDir, filePatches, mappingRows) {
  for (const patch of filePatches) {
    const target = path.join(runDir, 'files.before', patch.relativeFile);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, patch.original);
  }

  fs.writeFileSync(path.join(runDir, 'file-patches.json'), `${JSON.stringify(
    filePatches.map(({ relativeFile, replacements }) => ({ relativeFile, replacements })),
    null,
    2
  )}\n`);

  writeCsv(path.join(runDir, 'url-mapping.csv'), mappingRows, [
    'file',
    'routes',
    'old_url',
    'new_url',
    'storage_path',
    'source_hash',
    'local_path',
    'upload_status',
    'bytes',
  ]);
}

function applyFilePatches(filePatches) {
  for (const patch of filePatches) {
    fs.writeFileSync(path.join(repoRoot, patch.relativeFile), patch.next);
  }
}

function rollback(backupDir) {
  const mappingPath = path.join(backupDir, 'url-mapping.csv');
  if (!fs.existsSync(mappingPath)) {
    throw new Error(`Rollback mapping file is missing: ${mappingPath}`);
  }

  const rows = readCsv(mappingPath);
  const byFile = new Map();
  for (const row of rows) {
    const current = byFile.get(row.file) || new Map();
    current.set(row.new_url, row.old_url);
    byFile.set(row.file, current);
  }

  let updatedFiles = 0;
  for (const [relativeFile, urlMap] of byFile.entries()) {
    const filePath = path.join(repoRoot, relativeFile);
    let next = fs.readFileSync(filePath, 'utf8');
    const original = next;
    for (const [newUrl, oldUrl] of urlMap.entries()) {
      next = next.split(newUrl).join(oldUrl);
    }
    if (next !== original) {
      fs.writeFileSync(filePath, next);
      updatedFiles += 1;
    }
  }

  return updatedFiles;
}

async function main() {
  const args = parseArgs();
  const rollbackDir = args.get('rollback');
  if (rollbackDir) {
    const updatedFiles = rollback(path.resolve(String(rollbackDir)));
    console.log(JSON.stringify({ mode: 'rollback', updated_files: updatedFiles }, null, 2));
    return;
  }

  const apply = args.has('apply');
  if (apply && args.get('confirm') !== confirmToken) {
    throw new Error(`Apply mode requires --confirm=${confirmToken}`);
  }

  const env = { ...process.env, ...loadEnv(path.join(repoRoot, '.env.local')) };
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const outDir = path.resolve(String(args.get('out') || defaultOutDir));
  const runDir = path.join(outDir, `${apply ? 'phase3-apply' : 'phase3-dry-run'}-${timestampKstForPath()}`);
  fs.mkdirSync(runDir, { recursive: true });

  const refs = collectRefs();
  const byStoragePath = new Map();
  for (const ref of refs) {
    byStoragePath.set(ref.storage_path, ref);
  }

  const uploadResults = new Map();
  for (const ref of byStoragePath.values()) {
    const filePath = path.join(repoRoot, ref.local_path);
    const uploadResult = await uploadOrReuse(
      supabase,
      ref.storage_path,
      fs.readFileSync(filePath),
      ref.content_type,
      !apply
    );
    uploadResults.set(ref.storage_path, uploadResult);
  }

  const mappingRows = refs.map((ref) => {
    const uploadResult = uploadResults.get(ref.storage_path);
    return {
      file: ref.file,
      routes: ref.routes,
      old_url: ref.old_url,
      new_url: uploadResult.publicUrl,
      storage_path: ref.storage_path,
      source_hash: ref.source_hash,
      local_path: ref.local_path,
      upload_status: uploadResult.status,
      bytes: ref.bytes,
    };
  });

  const filePatches = buildFilePatches(mappingRows);
  writeBackups(runDir, filePatches, mappingRows);

  if (apply) {
    applyFilePatches(filePatches);
  }

  const summary = {
    mode: apply ? 'apply' : 'dry-run',
    scanned_at_kst: timestampKst(),
    run_dir: runDir,
    image_references: refs.length,
    unique_source_urls: new Set(refs.map((ref) => ref.old_url)).size,
    storage_objects: byStoragePath.size,
    files_to_update: filePatches.length,
    bytes: [...byStoragePath.values()].reduce((sum, ref) => sum + Number(ref.bytes || 0), 0),
    branding_path_policy: 'img_logo*.png -> site-assets/common/branding/',
  };

  fs.writeFileSync(path.join(runDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
