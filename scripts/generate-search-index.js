#!/usr/bin/env node
// scripts/generate-search-index.js
// Generates a Fuse.js-compatible search index for the static site

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../src/data');
const publicDir = path.resolve(__dirname, '../public');

// Load posts
const posts = JSON.parse(fs.readFileSync(path.join(dataDir, 'posts.json'), 'utf-8'));

// Load categories for mapping
const categories = JSON.parse(fs.readFileSync(path.join(dataDir, 'categories.json'), 'utf-8'));
const catMap = {};
categories.forEach(c => { catMap[c.id] = c.name; });

// Build search index from posts
const searchIndex = [
  // Add navigation pages with clear labels
  { title: 'Startseite', content: 'Doggi-Dog Startseite – Pfotenabenteuer mit Luna, dem italienischen Wasserhund', url: '/', type: 'Seite', date: '' },
  { title: 'Blog', content: 'Blog Archiv – Geschichten und Erlebnisse mit Luna', url: '/blog/', type: 'Seite', date: '' },
  { title: 'Rezepte für Hunde', content: 'Hundefutter Rezepte selber kochen – Hauptgerichte, Snacks, Kuchen, Eis', url: '/rezepte-fuer-hunde/', type: 'Seite', date: '' },
  { title: 'Tiergesundheit', content: 'Tipps zur Gesundheit des Hundes', url: '/tiergesundheit/', type: 'Seite', date: '' },
  { title: 'Produkttests', content: 'Hundeprodukte im Test', url: '/produkttests/', type: 'Seite', date: '' },
  { title: 'Videos', content: 'Videos von Luna und ihren Pfotenabenteuern', url: '/videos/', type: 'Seite', date: '' },
  { title: 'Urlaub mit Hund', content: 'Reiseziele und Tipps für den Urlaub mit Hund', url: '/urlaub-mit-hund/', type: 'Seite', date: '' },
  { title: 'Über uns', content: 'Über Claudia, Luna und Doggi-Dog', url: '/ueber-uns/', type: 'Seite', date: '' },
  { title: 'Impressum', content: 'Impressum von Doggi-Dog', url: '/impressum/', type: 'Seite', date: '' },
  { title: 'Datenschutzerklärung', content: 'Datenschutzerklärung von Doggi-Dog', url: '/datenschutzerklaerung/', type: 'Seite', date: '' },
  { title: 'Kontakt', content: 'Kontakt zu Doggi-Dog', url: '/kontakt/', type: 'Seite', date: '' },

  // Add all blog posts
  ...posts.map(post => {
    const title = post.title?.rendered || post.title || '';
    const content = (post.content?.rendered || '')
      .replace(/<[^>]+>/g, '')
      .replace(/&#?[a-z0-9]+;/g, ' ')
      .trim()
      .substring(0, 500);
    const excerpt = (post.excerpt?.rendered || '')
      .replace(/<[^>]+>/g, '')
      .replace(/&#?[a-z0-9]+;/g, ' ')
      .trim()
      .substring(0, 200);
    const catNames = (post.categories || []).map(id => catMap[id]).filter(Boolean).join(', ');
    return {
      title,
      content: `${title} ${excerpt} ${content} ${catNames}`.substring(0, 800),
      url: `/blog/${post.slug}/`,
      type: 'Beitrag',
      date: new Date(post.date).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' }),
      category: catNames,
    };
  }).filter(p => p.title)
];

// Write search index
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const indexPath = path.join(publicDir, 'search-index.json');
fs.writeFileSync(indexPath, JSON.stringify(searchIndex, null, 0));
console.log(`\x1b[32m✅ Search index generated:\x1b[0m ${searchIndex.length} entries → ${indexPath}`);
