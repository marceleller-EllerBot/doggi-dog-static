// src/data/index.js - Data loader using process.cwd()
import { readFileSync } from 'fs';
import { resolve } from 'path';

const dataDir = resolve(process.cwd(), 'src/data/') + '/';

function loadJSON(name) {
  try {
    const path = dataDir + name;
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to load ${name}:`, e.message);
    return [];
  }
}

export const posts = loadJSON('posts.json');
export const pages = loadJSON('pages.json');
export const categories = loadJSON('categories.json');
export const media = loadJSON('media.json');
export const tags = loadJSON('tags.json');

export function getCatMap() {
  const map = {};
  categories.forEach(c => { map[c.id] = c; });
  return map;
}

export function getMediaMap() {
  const map = {};
  media.forEach(m => { map[m.id] = m; });
  return map;
}

// Image map: WordPress media ID → local path
let imageMap = null;
export function getImageMap() {
  if (!imageMap) {
    try {
      imageMap = loadJSON('image-map.json');
    } catch (e) {
      imageMap = {};
    }
  }
  return imageMap;
}

export function img(id) {
  const map = getImageMap();
  return map[id] || null;
}
