import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const appPath = path.join(projectRoot, 'src', 'App.tsx');
const homePath = path.join(projectRoot, 'src', 'components', 'home', 'Home.tsx');
const sitemapPath = path.join(projectRoot, 'public', 'sitemap.xml');

const baseUrl = (process.env.SITE_URL || 'https://freeutils.xyz').replace(/\/+$/, '');
const today = new Date().toISOString().split('T')[0];

const appSource = readFileSync(appPath, 'utf8');
const homeSource = readFileSync(homePath, 'utf8');

const appRouteRegex = /navigate\('([^']+)'\)/g;
const homeRouteRegex = /<Link\s+to="([^"]+)"/g;

const routes = new Set(['/']);

for (const match of appSource.matchAll(appRouteRegex)) {
  const route = match[1];
  if (route.startsWith('/app/')) {
    routes.add(route);
  }
}

for (const match of homeSource.matchAll(homeRouteRegex)) {
  const route = match[1];
  if (route === '/') {
    routes.add(route);
  }
}

const priorityFor = (route) => {
  if (route === '/') {
    return '1.0';
  }

  const segments = route.split('/').filter(Boolean);
  return segments.length === 2 ? '0.8' : '0.7';
};

const changefreqFor = (route) => (route === '/' ? 'weekly' : 'monthly');

const urls = [...routes]
  .filter((route) => route !== '/app')
  .sort((left, right) => {
    if (left === '/') {
      return -1;
    }

    if (right === '/') {
      return 1;
    }

    return left.localeCompare(right);
  })
  .map((route) => {
    const url = `${baseUrl}${route}`;
    return [
      '  <url>',
      `    <loc>${url}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <changefreq>${changefreqFor(route)}</changefreq>`,
      `    <priority>${priorityFor(route)}</priority>`,
      '  </url>',
    ].join('\n');
  });

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls,
  '</urlset>',
  '',
].join('\n');

writeFileSync(sitemapPath, sitemap, 'utf8');
