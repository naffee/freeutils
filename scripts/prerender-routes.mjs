import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distRoot = path.join(projectRoot, 'dist');
const distIndexPath = path.join(distRoot, 'index.html');
const sitemapPath = path.join(projectRoot, 'public', 'sitemap.xml');

const siteUrl = (process.env.SITE_URL || 'https://freeutils.xyz').replace(/\/+$/, '');
const ogImageUrl = `${siteUrl}/og-image.svg`;

const domainLabels = {
  videos: 'Video',
  audio: 'Audio',
  code: 'Code',
  text: 'Text',
  images: 'Image',
};

const domainDescriptions = {
  videos: 'Free online video tools to trim, compress, resize, convert, crop, subtitle, stabilize, and enhance videos in your browser.',
  audio: 'Free online audio tools to convert, trim, merge, and enhance audio files quickly without complex desktop software.',
  code: 'Free developer utilities for formatting JSON, decoding JWTs, testing regex, generating hashes, minifying code, and more.',
  text: 'Free text utilities for subtitle conversion and related text processing tasks with fast browser-based workflows.',
  images: 'Free online image tools to crop, resize, compress, convert, remove backgrounds, extract colors, and enhance images.',
};

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function titleCaseSlug(slug) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function parseRoutesFromSitemap(xml) {
  const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
  return matches
    .map((match) => {
      const url = match[1];
      return url.startsWith(siteUrl) ? url.slice(siteUrl.length) || '/' : null;
    })
    .filter(Boolean);
}

function groupToolsByDomain(routes) {
  const grouped = {
    videos: [],
    audio: [],
    code: [],
    text: [],
    images: [],
  };

  for (const route of routes) {
    const segments = route.split('/').filter(Boolean);
    if (segments.length === 3 && segments[0] === 'app' && segments[1] in grouped) {
      grouped[segments[1]].push(segments[2]);
    }
  }

  return grouped;
}

function getMetaForPath(pathname) {
  if (pathname === '/') {
    return {
      title: 'freeutils | AI-Powered Media and Developer Toolkit',
      description:
        'Use free online tools for video editing, image processing, audio conversion, subtitle work, and developer utilities directly in your browser.',
      robots: 'index,follow',
      type: 'website',
    };
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== 'app' || !segments[1] || !(segments[1] in domainLabels)) {
    return {
      title: 'Page Not Found | freeutils',
      description: 'The page you requested does not exist on freeutils.',
      robots: 'noindex,nofollow',
      type: 'website',
    };
  }

  const domain = segments[1];
  if (!segments[2]) {
    return {
      title: `${domainLabels[domain]} Tools | freeutils`,
      description: domainDescriptions[domain],
      robots: 'index,follow',
      type: 'article',
    };
  }

  const toolName = titleCaseSlug(segments[2]);
  return {
    title: `${toolName} | freeutils`,
    description: `Use the ${toolName.toLowerCase()} tool online with freeutils for quick, browser-based ${domainLabels[domain].toLowerCase()} workflows.`,
    robots: 'index,follow',
    type: 'article',
  };
}

function renderHomeContent() {
  return `
    <section class="prerender-shell">
      <p class="prerender-eyebrow">Free online utilities</p>
      <h1>AI-Powered Media and Developer Toolkit</h1>
      <p>Use free online tools for video, audio, image, subtitle, and developer workflows directly in your browser.</p>
      <div class="prerender-links">
        <a href="/app/videos">Video Tools</a>
        <a href="/app/images">Image Tools</a>
        <a href="/app/audio">Audio Tools</a>
        <a href="/app/code">Code Tools</a>
        <a href="/app/text">Text Tools</a>
      </div>
    </section>
  `;
}

function renderCategoryContent(domain, tools) {
  const label = domainLabels[domain];
  const toolLinks = tools
    .map((tool) => `<a href="/app/${domain}/${tool}">${escapeHtml(titleCaseSlug(tool))}</a>`)
    .join('');

  return `
    <section class="prerender-shell">
      <p class="prerender-eyebrow">${escapeHtml(label)} category</p>
      <h1>Free Online ${escapeHtml(label)} Tools</h1>
      <p>${escapeHtml(domainDescriptions[domain])}</p>
      <div class="prerender-links">
        ${toolLinks}
      </div>
    </section>
  `;
}

function renderToolContent(domain, tool, tools) {
  const label = domainLabels[domain];
  const toolName = titleCaseSlug(tool);
  const relatedLinks = tools
    .filter((item) => item !== tool)
    .slice(0, 4)
    .map((item) => `<a href="/app/${domain}/${item}">${escapeHtml(titleCaseSlug(item))}</a>`)
    .join('');

  return `
    <section class="prerender-shell">
      <p class="prerender-eyebrow">${escapeHtml(label)} tool</p>
      <h1>${escapeHtml(toolName)}</h1>
      <p>Use this ${escapeHtml(label.toLowerCase())} tool online with freeutils for a fast, browser-based workflow.</p>
      <h2>Related ${escapeHtml(label.toLowerCase())} tools</h2>
      <div class="prerender-links">
        ${relatedLinks}
      </div>
    </section>
  `;
}

function renderNotFoundContent() {
  return `
    <section class="prerender-shell">
      <p class="prerender-eyebrow">404</p>
      <h1>Page not found</h1>
      <p>The page you requested does not exist. Browse the main sections of freeutils instead.</p>
      <div class="prerender-links">
        <a href="/">Home</a>
        <a href="/app/videos">Video Tools</a>
        <a href="/app/images">Image Tools</a>
      </div>
    </section>
  `;
}

function getBodyContent(pathname, toolsByDomain) {
  if (pathname === '/') {
    return renderHomeContent();
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== 'app' || !segments[1] || !(segments[1] in toolsByDomain)) {
    return renderNotFoundContent();
  }

  const domain = segments[1];
  if (!segments[2]) {
    return renderCategoryContent(domain, toolsByDomain[domain]);
  }

  return renderToolContent(domain, segments[2], toolsByDomain[domain]);
}

function buildHeadMarkup(pathname) {
  const meta = getMetaForPath(pathname);
  const canonicalUrl = `${siteUrl}${pathname === '/' ? '/' : pathname}`;

  return [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="robots" content="${meta.robots}" />`,
    `<link rel="canonical" href="${canonicalUrl}" />`,
    `<meta property="og:type" content="${meta.type}" />`,
    `<meta property="og:site_name" content="freeutils" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${canonicalUrl}" />`,
    `<meta property="og:image" content="${ogImageUrl}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${ogImageUrl}" />`,
  ].join('\n  ');
}

function buildPrerenderStyle() {
  return `
  <style data-prerender-styles>
    .prerender-shell {
      max-width: 960px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
      font-family: Inter, system-ui, sans-serif;
      color: #0f172a;
    }
    .prerender-eyebrow {
      color: #8b5cf6;
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin: 0 0 0.75rem;
    }
    .prerender-shell h1 {
      font-size: clamp(2rem, 5vw, 3.25rem);
      line-height: 1.1;
      margin: 0 0 1rem;
    }
    .prerender-shell h2 {
      font-size: 1.1rem;
      margin: 2rem 0 0.75rem;
    }
    .prerender-shell p {
      font-size: 1.05rem;
      line-height: 1.7;
      color: #475569;
      margin: 0;
      max-width: 70ch;
    }
    .prerender-links {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    .prerender-links a {
      display: inline-flex;
      align-items: center;
      min-height: 40px;
      padding: 0.7rem 0.95rem;
      border-radius: 999px;
      text-decoration: none;
      background: #f5f3ff;
      color: #6d28d9;
      border: 1px solid #ddd6fe;
      font-weight: 600;
    }
  </style>`;
}

function updateTemplate(template, pathname, content) {
  let result = template;
  result = result.replace(/\s*<meta name="description"[\s\S]*?\/>/i, '');
  result = result.replace(/\s*<meta name="robots"[\s\S]*?\/>/i, '');
  result = result.replace(/\s*<meta name="twitter:card"[\s\S]*?\/>/i, '');
  result = result.replace(/\s*<meta name="twitter:title"[\s\S]*?\/>/i, '');
  result = result.replace(/\s*<meta name="twitter:description"[\s\S]*?\/>/i, '');
  result = result.replace(/\s*<meta name="twitter:image"[\s\S]*?\/>/i, '');
  result = result.replace(/\s*<meta property="og:type"[\s\S]*?\/>/i, '');
  result = result.replace(/\s*<meta property="og:site_name"[\s\S]*?\/>/i, '');
  result = result.replace(/\s*<meta property="og:title"[\s\S]*?\/>/i, '');
  result = result.replace(/\s*<meta property="og:description"[\s\S]*?\/>/i, '');
  result = result.replace(/\s*<meta property="og:url"[\s\S]*?\/>/i, '');
  result = result.replace(/\s*<meta property="og:image"[\s\S]*?\/>/i, '');
  result = result.replace(/\s*<link rel="canonical"[\s\S]*?\/>/i, '');
  result = result.replace(/<title>[\s\S]*?<\/title>/i, buildHeadMarkup(pathname));
  result = result.replace('<div id="root"></div>', `<div id="root">${content}</div>`);

  if (!result.includes('data-prerender-styles')) {
    result = result.replace('</head>', `${buildPrerenderStyle()}\n</head>`);
  }

  return result;
}

function writeRouteHtml(pathname, html) {
  const targetDir = pathname === '/' ? distRoot : path.join(distRoot, pathname.replace(/^\/+/, ''));
  mkdirSync(targetDir, { recursive: true });
  writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
}

const template = readFileSync(distIndexPath, 'utf8');
const sitemap = readFileSync(sitemapPath, 'utf8');
const routes = parseRoutesFromSitemap(sitemap);
const toolsByDomain = groupToolsByDomain(routes);

for (const route of routes) {
  const html = updateTemplate(template, route, getBodyContent(route, toolsByDomain));
  writeRouteHtml(route, html);
}

const appHtml = updateTemplate(
  template,
  '/app',
  `
    <section class="prerender-shell">
      <p class="prerender-eyebrow">App</p>
      <h1>Browse freeutils tools</h1>
      <p>Select a category to continue into the application.</p>
      <div class="prerender-links">
        <a href="/app/videos">Video Tools</a>
        <a href="/app/images">Image Tools</a>
        <a href="/app/audio">Audio Tools</a>
        <a href="/app/code">Code Tools</a>
        <a href="/app/text">Text Tools</a>
      </div>
    </section>
  `,
);
writeRouteHtml('/app', appHtml);

const notFoundHtml = updateTemplate(template, '/404', renderNotFoundContent());
writeFileSync(path.join(distRoot, '404.html'), notFoundHtml, 'utf8');
