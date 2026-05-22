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
const confirmToken = 'phase2-image-migration';

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
    pathname = new URL(imageUrl, 'https://webinars.co.kr').pathname;
  } catch {
    // Keep relative path as-is.
  }

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
    localPath: found || '',
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

function roleForSource(source, index) {
  if (source === 'reference_items.image_url') return 'card';
  if (source === 'reference_items.modal_html') return `modal-${index}`;
  if (source === 'posts.featured_image') return 'featured';
  if (source === 'posts.content') return `content-${index}`;
  return `image-${index}`;
}

function targetPrefix(row) {
  if (row.table_name === 'reference_items') return `references/${row.row_id}`;
  if (row.table_name === 'posts') return `posts/${row.row_id}`;
  return 'common/migration';
}

function targetPath(row, sourceHash) {
  const ext = extensionFromUrl(row.url);
  const role = roleForSource(row.source, row.index_in_field);
  return `${targetPrefix(row)}/${role}-${sourceHash.slice(0, 12)}.${ext}`.normalize('NFC');
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

async function fetchRows(supabase) {
  const [referenceResult, postResult] = await Promise.all([
    supabase
      .from('reference_items')
      .select('id,title,image_url,modal_path,modal_html,is_published,deleted_at')
      .is('deleted_at', null)
      .order('order', { ascending: true }),
    supabase
      .from('posts')
      .select('id,slug,title,featured_image,content,status,deleted_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),
  ]);

  if (referenceResult.error) throw referenceResult.error;
  if (postResult.error) throw postResult.error;
  return {
    referenceRows: referenceResult.data || [],
    postRows: postResult.data || [],
  };
}

function collectCandidates(referenceRows, postRows, limit) {
  const refs = [];
  let id = 1;

  for (const item of referenceRows) {
    if (item.image_url) {
      refs.push({
        candidate_id: id++,
        table_name: 'reference_items',
        row_id: item.id,
        title: item.title || '',
        source: 'reference_items.image_url',
        field: 'image_url',
        html_kind: 'field',
        index_in_field: 1,
        url: item.image_url,
      });
    }

    extractHtmlImages(item.modal_html).forEach((ref, refIndex) => {
      refs.push({
        candidate_id: id++,
        table_name: 'reference_items',
        row_id: item.id,
        title: item.title || '',
        source: 'reference_items.modal_html',
        field: 'modal_html',
        html_kind: ref.kind,
        index_in_field: refIndex + 1,
        url: ref.url,
      });
    });
  }

  for (const post of postRows) {
    if (post.featured_image) {
      refs.push({
        candidate_id: id++,
        table_name: 'posts',
        row_id: post.id,
        title: post.title || post.slug || '',
        source: 'posts.featured_image',
        field: 'featured_image',
        html_kind: 'field',
        index_in_field: 1,
        url: post.featured_image,
      });
    }

    extractHtmlImages(post.content).forEach((ref, refIndex) => {
      refs.push({
        candidate_id: id++,
        table_name: 'posts',
        row_id: post.id,
        title: post.title || post.slug || '',
        source: 'posts.content',
        field: 'content',
        html_kind: ref.kind,
        index_in_field: refIndex + 1,
        url: ref.url,
      });
    });
  }

  const candidates = refs
    .map((ref) => {
      const local = resolveLocal(ref.url);
      return {
        ...ref,
        classification: classifyUrl(ref.url),
        ...local,
      };
    })
    .filter((ref) => ref.classification === 'public 파일');

  return limit ? candidates.slice(0, limit) : candidates;
}

async function readSource(candidate) {
  if (candidate.localPath) {
    const buffer = fs.readFileSync(candidate.localPath);
    return {
      buffer,
      source: 'local',
      contentType: MIME_BY_EXT[extensionFromUrl(candidate.url)] || 'application/octet-stream',
    };
  }

  const absoluteUrl = candidate.url.startsWith('http')
    ? candidate.url
    : new URL(candidate.url, 'https://webinars.co.kr').toString();
  const response = await fetch(absoluteUrl);
  if (!response.ok) {
    throw new Error(`Source fetch failed ${response.status}: ${candidate.url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    source: 'remote',
    contentType: response.headers.get('content-type')?.split(';')[0] || MIME_BY_EXT[extensionFromUrl(candidate.url)] || 'application/octet-stream',
  };
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

async function listStorageObjects(supabase, prefix = '') {
  const objects = [];
  const pageSize = 1000;

  async function walk(currentPrefix) {
    let offset = 0;
    while (true) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(currentPrefix, {
          limit: pageSize,
          offset,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (error) throw error;
      const entries = data || [];
      for (const entry of entries) {
        const objectPath = currentPrefix ? `${currentPrefix}/${entry.name}` : entry.name;
        if (entry.metadata) {
          objects.push({
            name: objectPath,
            id: entry.id,
            updated_at: entry.updated_at,
            created_at: entry.created_at,
            last_accessed_at: entry.last_accessed_at,
            metadata: entry.metadata,
          });
        } else {
          await walk(objectPath);
        }
      }

      if (entries.length < pageSize) break;
      offset += pageSize;
    }
  }

  await walk(prefix);
  return objects;
}

function buildRowUpdates(rows, tableName, fieldNames, urlMap) {
  const updates = [];

  for (const row of rows) {
    const patch = {};
    for (const fieldName of fieldNames) {
      const original = row[fieldName] || '';
      let next = original;
      for (const [oldUrl, newUrl] of urlMap) {
        if (next.includes(oldUrl)) {
          next = next.split(oldUrl).join(newUrl);
        }
      }
      if (next !== original) {
        patch[fieldName] = next;
      }
    }

    if (Object.keys(patch).length > 0) {
      updates.push({
        table_name: tableName,
        row_id: row.id,
        patch,
      });
    }
  }

  return updates;
}

async function writeBackups(baseDir, referenceRows, postRows, mappingRows, rowUpdates, storageObjects = []) {
  fs.mkdirSync(baseDir, { recursive: true });
  fs.writeFileSync(path.join(baseDir, 'reference_items.before.json'), `${JSON.stringify(referenceRows, null, 2)}\n`);
  fs.writeFileSync(path.join(baseDir, 'posts.before.json'), `${JSON.stringify(postRows, null, 2)}\n`);
  fs.writeFileSync(path.join(baseDir, 'row-updates.json'), `${JSON.stringify(rowUpdates, null, 2)}\n`);
  fs.writeFileSync(path.join(baseDir, 'storage-objects.before.json'), `${JSON.stringify(storageObjects, null, 2)}\n`);
  writeCsv(path.join(baseDir, 'url-mapping.csv'), mappingRows, [
    'candidate_id',
    'table_name',
    'row_id',
    'field',
    'html_kind',
    'old_url',
    'new_url',
    'storage_path',
    'source_hash',
    'source',
    'upload_status',
  ]);
}

async function updateRows(supabase, rowUpdates) {
  for (const update of rowUpdates) {
    const { error } = await supabase
      .from(update.table_name)
      .update(update.patch)
      .eq('id', update.row_id);

    if (error) throw error;
  }
}

async function rollback(supabase, backupDir) {
  const mappingPath = path.join(backupDir, 'url-mapping.csv');
  if (!fs.existsSync(mappingPath)) {
    throw new Error(`Rollback mapping file is missing: ${mappingPath}`);
  }

  const mappings = readCsv(mappingPath).filter((row) => row.table_name && row.row_id && row.field && row.old_url && row.new_url);
  const grouped = new Map();

  for (const mapping of mappings) {
    const key = `${mapping.table_name}:${mapping.row_id}`;
    const current = grouped.get(key) || {
      table_name: mapping.table_name,
      row_id: mapping.row_id,
      fields: new Map(),
    };
    const fieldMappings = current.fields.get(mapping.field) || [];
    fieldMappings.push(mapping);
    current.fields.set(mapping.field, fieldMappings);
    grouped.set(key, current);
  }

  let updatedRows = 0;
  let replacements = 0;

  for (const group of grouped.values()) {
    const fields = [...group.fields.keys()];
    const { data: currentRow, error: selectError } = await supabase
      .from(group.table_name)
      .select(['id', ...fields].join(','))
      .eq('id', group.row_id)
      .single();

    if (selectError) throw selectError;

    const patch = {};
    for (const [field, fieldMappings] of group.fields.entries()) {
      let next = currentRow?.[field] || '';
      const original = next;
      for (const mapping of fieldMappings) {
        if (next.includes(mapping.new_url)) {
          const before = next;
          next = next.split(mapping.new_url).join(mapping.old_url);
          replacements += before === next ? 0 : 1;
        }
      }
      if (next !== original) {
        patch[field] = next;
      }
    }

    if (Object.keys(patch).length > 0) {
      const { error: updateError } = await supabase
        .from(group.table_name)
        .update(patch)
        .eq('id', group.row_id);

      if (updateError) throw updateError;
      updatedRows += 1;
    }
  }

  return { updatedRows, replacements };
}

async function main() {
  const args = parseArgs();
  const env = { ...process.env, ...loadEnv(path.join(repoRoot, '.env.local')) };
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const rollbackDir = args.get('rollback');
  if (rollbackDir) {
    const result = await rollback(supabase, path.resolve(String(rollbackDir)));
    console.log(JSON.stringify({ mode: 'rollback', ...result }, null, 2));
    return;
  }

  const apply = args.has('apply');
  const dryRun = !apply;
  if (apply && args.get('confirm') !== confirmToken) {
    throw new Error(`Apply mode requires --confirm=${confirmToken}`);
  }

  const limit = args.has('limit') ? Number(args.get('limit')) : null;
  const outDir = path.resolve(String(args.get('out') || defaultOutDir));
  const runDir = path.join(outDir, `${apply ? 'phase2-apply' : 'phase2-dry-run'}-${timestampKstForPath()}`);
  fs.mkdirSync(runDir, { recursive: true });

  const storageObjectsBefore = apply ? await listStorageObjects(supabase) : [];
  const { referenceRows, postRows } = await fetchRows(supabase);
  const candidates = collectCandidates(referenceRows, postRows, Number.isFinite(limit) && limit > 0 ? limit : null);
  const uploadByUrl = new Map();
  const mappingRows = [];
  const errors = [];

  for (const candidate of candidates) {
    try {
      let uploaded = uploadByUrl.get(candidate.url);
      let source = 'reused-url';
      let sourceHash = uploaded?.sourceHash;
      let bufferLength = uploaded?.bytes || 0;

      if (!uploaded) {
        const sourceData = await readSource(candidate);
        sourceHash = crypto.createHash('sha256').update(sourceData.buffer).digest('hex');
        const objectPath = targetPath(candidate, sourceHash);
        const uploadResult = await uploadOrReuse(supabase, objectPath, sourceData.buffer, sourceData.contentType, dryRun);
        uploaded = {
          publicUrl: uploadResult.publicUrl,
          objectPath,
          sourceHash,
          source: sourceData.source,
          uploadStatus: uploadResult.status,
          bytes: sourceData.buffer.length,
        };
        uploadByUrl.set(candidate.url, uploaded);
        source = sourceData.source;
        bufferLength = sourceData.buffer.length;
      }

      mappingRows.push({
        candidate_id: candidate.candidate_id,
        table_name: candidate.table_name,
        row_id: candidate.row_id,
        field: candidate.field,
        html_kind: candidate.html_kind,
        old_url: candidate.url,
        new_url: uploaded.publicUrl,
        storage_path: uploaded.objectPath,
        source_hash: sourceHash,
        source,
        upload_status: uploaded.uploadStatus,
        bytes: bufferLength,
      });
    } catch (error) {
      errors.push({
        candidate_id: candidate.candidate_id,
        table_name: candidate.table_name,
        row_id: candidate.row_id,
        field: candidate.field,
        old_url: candidate.url,
        error: error.message || String(error),
      });
    }
  }

  if (errors.length > 0) {
    writeCsv(path.join(runDir, 'errors.csv'), errors, ['candidate_id', 'table_name', 'row_id', 'field', 'old_url', 'error']);
    throw new Error(`Migration preparation failed for ${errors.length} candidate(s). See ${path.join(runDir, 'errors.csv')}`);
  }

  const urlMap = new Map(mappingRows.map((row) => [row.old_url, row.new_url]));
  const rowUpdates = [
    ...buildRowUpdates(referenceRows, 'reference_items', ['image_url', 'modal_html'], urlMap),
    ...buildRowUpdates(postRows, 'posts', ['featured_image', 'content'], urlMap),
  ];

  await writeBackups(runDir, referenceRows, postRows, mappingRows, rowUpdates, storageObjectsBefore);

  if (apply) {
    await updateRows(supabase, rowUpdates);
  }

  const summary = {
    mode: dryRun ? 'dry-run' : 'apply',
    scanned_at_kst: timestampKst(),
    run_dir: runDir,
    candidates: candidates.length,
    unique_source_urls: uploadByUrl.size,
    row_updates: rowUpdates.length,
    uploaded_or_reused_objects: new Set(mappingRows.map((row) => row.storage_path)).size,
    bytes: mappingRows.reduce((sum, row) => sum + Number(row.bytes || 0), 0),
  };

  fs.writeFileSync(path.join(runDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
