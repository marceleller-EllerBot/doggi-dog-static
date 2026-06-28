#!/usr/bin/env node
// scripts/download-images.js
// Downloads all images from the live WordPress site to public/images/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../src/data');
const imagesDir = path.resolve(__dirname, '../public/images');

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Load media items
const media = JSON.parse(fs.readFileSync(path.join(dataDir, 'media.json'), 'utf-8'));

// Additional URLs not in media.json
const extraUrls = [
  { url: 'https://doggi-dog.com/wp-content/uploads/2023/10/cropped-Logo-mit-hintergrund-Doggi-Dog.png', name: 'og-image.png' },
  { url: 'https://doggi-dog.com/wp-content/uploads/2023/09/cropped-Logo-Dogge-Dog.png', name: 'logo-dogge.png' },
  { url: 'https://doggi-dog.com/wp-content/uploads/2023/09/Logo-mit-hintergrund-Doggi-Dog.png', name: 'logo-full.png' },
];

function getFilename(url) {
  const parts = url.split('/');
  let name = parts[parts.length - 1];
  // Handle scaled suffix
  name = name.replace(/-scaled(\.\w+)$/, '$1');
  // Handle size suffixes like -1024x768
  name = name.replace(/-\d+x\d+(?=\.\w+$)/, '');
  return name;
}

function getUniqueFilename(url, existing) {
  let name = getFilename(url);
  if (!existing.has(name)) {
    existing.add(name);
    return name;
  }
  // Add counter
  const ext = path.extname(name);
  const base = name.slice(0, -ext.length);
  for (let i = 2; ; i++) {
    const candidate = `${base}-${i}${ext}`;
    if (!existing.has(candidate)) {
      existing.add(candidate);
      return candidate;
    }
  }
}

async function download(url, dest) {
  if (fs.existsSync(dest)) return 'cached';
  try {
    const response = await fetch(url);
    if (!response.ok) return `HTTP ${response.status}`;
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(dest, buffer);
    return 'ok';
  } catch (e) {
    return `error: ${e.message}`;
  }
}

async function main() {
  const existing = new Set();
  const results = [];
  let countOk = 0;

  // Download media items
  for (const item of media) {
    if (!item.source_url) continue;
    // Try original URL first
    let filename = getUniqueFilename(item.source_url, existing);
    let dest = path.join(imagesDir, filename);
    let status = await download(item.source_url, dest);
    results.push({ id: item.id, url: item.source_url, filename, status });
    if (status === 'ok') countOk++;
    if (!filename.startsWith('og-')) {
      process.stdout.write(status === 'ok' ? '█' : status === 'cached' ? '░' : '✗');
    }
  }

  // Download extras
  for (const extra of extraUrls) {
    const dest = path.join(imagesDir, extra.name);
    const status = await download(extra.url, dest);
    results.push({ id: 'extra', url: extra.url, filename: extra.name, status });
    if (status === 'ok') countOk++;
    process.stdout.write(status === 'ok' ? '█' : status === 'cached' ? '░' : '✗');
  }

  console.log(`\n\n✅ ${countOk} new + ${results.filter(r => r.status === 'cached').length} cached = ${results.length} total`);
  
  // Save mapping for later use
  const mapping = {};
  for (const r of results) {
    if (r.id && r.id !== 'extra') {
      mapping[r.id] = '/images/' + r.filename;
    }
  }
  fs.writeFileSync(path.join(__dirname, '../src/data/image-map.json'), JSON.stringify(mapping, null, 2));
  console.log('📝 Image map saved to src/data/image-map.json');
}

main().catch(console.error);
