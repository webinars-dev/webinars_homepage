/**
 * Move base64 images embedded in reference_items.modal_html to Supabase Storage.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-reference-modal-data-images.js --dry-run
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-reference-modal-data-images.js
 */

const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PROJECT_URL = 'https://eskwngynvszukwrvhkrw.supabase.co';
const BUCKET = 'blog-images';
const IMAGE_TYPE_TO_EXTENSION = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach((line) => {
    const match = line.match(/^([A-Z0-9_]+)="?([^"]*)"?$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  });
}

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.slice('--limit='.length)) : null;

  return {
    dryRun: args.has('--dry-run'),
    limit: Number.isFinite(limit) && limit > 0 ? limit : null,
  };
}

function requireServiceKey() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SECRET_KEY, or SUPABASE_SERVICE_KEY.');
  }

  return key;
}

function dataUriToBuffer(dataUri) {
  const match = String(dataUri).match(/^data:([^;,]+)(;base64)?,(.*)$/);
  if (!match) throw new Error('Unsupported data URI format.');

  const contentType = match[1].toLowerCase();
  const extension = IMAGE_TYPE_TO_EXTENSION[contentType];
  if (!extension) throw new Error(`Unsupported image type: ${contentType}`);

  const data = match[3] || '';
  const buffer = match[2]
    ? Buffer.from(data, 'base64')
    : Buffer.from(decodeURIComponent(data));

  return { buffer, contentType, extension };
}

function buildObjectPath(itemId, dataUri, index, extension) {
  const hash = crypto.createHash('sha256').update(dataUri).digest('hex').slice(0, 16);
  return `references/${itemId}/modal-${String(index).padStart(2, '0')}-${hash}.${extension}`;
}

async function uploadImage(supabase, objectPath, buffer, contentType) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, buffer, {
      cacheControl: '31536000',
      contentType,
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

async function fetchItems(supabase, limit) {
  let query = supabase
    .from('reference_items')
    .select('id,title,modal_html')
    .is('deleted_at', null)
    .like('modal_html', '%data:image/%')
    .order('order', { ascending: true });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function migrateItem(supabase, item, dryRun) {
  const $ = cheerio.load(item.modal_html || '', { decodeEntities: false }, false);
  const images = $('img[src^="data:image/"]').toArray();
  const uploaded = new Map();
  let convertedCount = 0;
  let totalBytes = 0;

  for (const [index, image] of images.entries()) {
    const node = $(image);
    const src = node.attr('src');
    if (!src) continue;

    let publicUrl = uploaded.get(src);
    const parsed = dataUriToBuffer(src);
    totalBytes += parsed.buffer.length;

    if (!publicUrl && !dryRun) {
      const objectPath = buildObjectPath(item.id, src, index + 1, parsed.extension);
      publicUrl = await uploadImage(supabase, objectPath, parsed.buffer, parsed.contentType);
      uploaded.set(src, publicUrl);
    }

    if (!dryRun) {
      node.attr('src', publicUrl);
      if (node.attr('srcset')?.includes('data:image/')) {
        node.removeAttr('srcset');
      }
    }

    convertedCount += 1;
  }

  if (!dryRun && convertedCount > 0) {
    const { error } = await supabase
      .from('reference_items')
      .update({ modal_html: $.html() })
      .eq('id', item.id);

    if (error) throw error;
  }

  return { convertedCount, totalBytes };
}

async function main() {
  loadEnv();
  const { dryRun, limit } = parseArgs();
  const serviceKey = requireServiceKey();
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || PROJECT_URL;
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  console.log(`Mode: ${dryRun ? 'dry-run' : 'write'}`);
  const items = await fetchItems(supabase, limit);
  console.log(`Rows with embedded data images: ${items.length}`);

  let rowCount = 0;
  let imageCount = 0;
  let byteCount = 0;

  for (const item of items) {
    const result = await migrateItem(supabase, item, dryRun);
    if (result.convertedCount === 0) continue;

    rowCount += 1;
    imageCount += result.convertedCount;
    byteCount += result.totalBytes;
    console.log(
      `${dryRun ? 'Would update' : 'Updated'} ${item.id}: ${result.convertedCount} image(s), ${Math.round(result.totalBytes / 1024)} KB`
    );
  }

  console.log(`Done. Rows: ${rowCount}, images: ${imageCount}, image bytes: ${Math.round(byteCount / 1024)} KB`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
