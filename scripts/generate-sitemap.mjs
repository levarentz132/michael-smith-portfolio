import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteUrl = (process.env.PUBLIC_SITE_URL || 'https://highlanderstay.com').replace(/\/$/, '');
const apiUrl = (process.env.SITEMAP_API_URL || siteUrl).replace(/\/$/, '');
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(projectRoot, 'public', 'sitemap.xml');

const slugify = value => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/\s+/g, '-')
  .replace(/[^\w-]+/g, '')
  .replace(/--+/g, '-')
  .replace(/^-+|-+$/g, '');

const escapeXml = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const sitemapDate = value => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
};

const absoluteImageUrl = image => {
  if (!image) return null;
  return String(image).startsWith('http') ? image : `${siteUrl}/${String(image).replace(/^\//, '')}`;
};

const fetchJson = async pathname => {
  const response = await fetch(`${apiUrl}${pathname}`);
  if (!response.ok) throw new Error(`${pathname} returned HTTP ${response.status}`);
  return response.json();
};

const [properties, articles] = await Promise.all([
  fetchJson('/api/properties'),
  fetchJson('/api/articles')
]);

const entries = [
  { loc: `${siteUrl}/`, priority: '1.0', changefreq: 'weekly' },
  {
    loc: `${siteUrl}/resort`,
    priority: '0.9',
    changefreq: 'weekly',
    image: `${siteUrl}/resort-assets/building-main.jpeg`,
    imageTitle: 'Highlander Resort Bogor'
  },
  { loc: `${siteUrl}/privacy-policy`, priority: '0.2', changefreq: 'yearly' },
  ...properties.map(property => ({
    loc: `${siteUrl}/property/${property.id}-${slugify(property.title)}`,
    priority: '0.8',
    changefreq: 'weekly',
    image: absoluteImageUrl(property.image),
    imageTitle: property.title
  })),
  ...articles.map(article => ({
    loc: `${siteUrl}/panduan/${article.id}-${slugify(article.title)}`,
    lastmod: sitemapDate(article.updated_at),
    priority: '0.6',
    changefreq: 'monthly',
    image: absoluteImageUrl(article.image),
    imageTitle: article.title
  }))
];

const today = new Date().toISOString().slice(0, 10);
const urlXml = entries.map(entry => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${escapeXml(entry.lastmod || today)}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>${entry.image ? `
    <image:image>
      <image:loc>${escapeXml(entry.image)}</image:loc>
      <image:title>${escapeXml(entry.imageTitle || '')}</image:title>
    </image:image>` : ''}
  </url>`).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlXml}
</urlset>
`;

await fs.writeFile(outputPath, xml, 'utf8');
console.log(`Generated sitemap with ${entries.length} URLs at ${outputPath}`);
