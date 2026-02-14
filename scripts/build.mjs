import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { format } from 'date-fns';
import fse from 'fs-extra';
import slugify from 'slugify';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const CONTENT_DIR = path.join(ROOT, 'content', 'articles');
const DIST_DIR = path.join(ROOT, 'dist');
const DOCS_DIR = path.join(ROOT, 'docs');
const ASSET_DIR = path.join(DIST_DIR, 'assets');

const siteConfig = {
  title: 'Lupus Awareness Lab',
  tagline: 'Daily research, patient voices, and digital health breakthroughs.',
  ctaText: 'Get the daily digest',
  ctaLink: 'mailto:hello@lupuslab.org',
  heroStats: [
    { label: 'Days of continuous research log', value: '112' },
    { label: 'Clinical trials on watchlist', value: '27' },
    { label: 'Patient stories captured this quarter', value: '14' }
  ],
  nav: [
    { label: 'Articles', href: '#articles' },
    { label: 'Downloads', href: '#downloads' },
    { label: 'Contact', href: 'mailto:hello@lupuslab.org' }
  ]
};

marked.setOptions({ mangle: false, headerIds: false });

const css = `:root{--bg:#04070f;--panel:#101426;--border:rgba(255,255,255,.08);--accent:#c084fc;--accent2:#60a5fa;--text:#f5f7ff;--muted:#93a3c8;--highlight:#f9a8d4}
*{box-sizing:border-box;font-family:'Space Grotesk',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
body{margin:0;background:var(--bg);color:var(--text);line-height:1.6}
main{max-width:1100px;margin:0 auto;padding:32px 20px 80px}
header{display:flex;flex-wrap:wrap;justify-content:space-between;gap:24px;margin-bottom:40px}
header h1{font-size:2.8rem;margin:0}
header p{max-width:540px;color:var(--muted)}
nav{display:flex;gap:18px;flex-wrap:wrap;font-size:.95rem}
nav a{text-decoration:none;color:var(--text);padding:8px 14px;border:1px solid transparent;border-radius:999px}
nav a:hover{border-color:var(--accent)}
.hero{border:1px solid var(--border);border-radius:18px;padding:28px;background:linear-gradient(120deg,rgba(96,165,250,.15),rgba(192,132,252,.1))}
.hero-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-top:24px}
.stat{padding:14px;border:1px solid var(--border);border-radius:16px;background:rgba(255,255,255,.02)}
.stat .value{font-size:2rem;font-weight:600}
.section{margin-top:50px}
.section h2{margin-bottom:16px;font-size:1.4rem}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}
.card{border:1px solid var(--border);border-radius:18px;overflow:hidden;background:var(--panel);display:flex;flex-direction:column}
.card img{width:100%;height:160px;object-fit:cover}
.card-content{padding:18px;display:flex;flex-direction:column;gap:10px}
.tag-list{display:flex;flex-wrap:wrap;gap:8px;font-size:.75rem}
.tag{background:rgba(96,165,250,.15);color:var(--accent2);padding:4px 10px;border-radius:999px}
.card a{margin-top:auto;color:var(--accent2);text-decoration:none;font-weight:600}
.article-page{max-width:800px;margin:0 auto;padding:40px 20px 100px}
.article-page header{margin-bottom:24px}
.article-page h1{margin-bottom:12px}
.article-page .meta{color:var(--muted);font-size:.9rem}
.article-page img{width:100%;border-radius:16px;margin:24px 0}
article{line-height:1.8;color:#dfe6ff}
article h2{margin-top:28px}
footer{margin-top:60px;text-align:center;color:var(--muted);font-size:.85rem}
@media(max-width:640px){header{flex-direction:column}}
`;

async function loadArticles() {
  const files = await fs.readdir(CONTENT_DIR);
  const articles = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const raw = await fs.readFile(path.join(CONTENT_DIR, file), 'utf-8');
    const { data, content } = matter(raw);
    const slug = data.slug || slugify(data.title, { lower: true, strict: true });
    const html = marked.parse(content);
    const date = new Date(data.date);

    articles.push({
      slug,
      ...data,
      date,
      dateDisplay: format(date, 'MMM d, yyyy'),
      html
    });
  }

  return articles.sort((a, b) => b.date - a.date);
}

function baseTemplate({ title, body, extraHead = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | ${siteConfig.title}</title>
  <link rel="stylesheet" href="${title === siteConfig.title ? '' : '../../'}assets/styles.css">
  ${extraHead}
</head>
<body>
  ${body}
  <footer>
    <p>&copy; ${new Date().getFullYear()} ${siteConfig.title}. Built by Jarvis for daily lupus awareness.</p>
  </footer>
</body>
</html>`;
}

function renderIndex(articles) {
  const heroStats = siteConfig.heroStats
    .map((stat) => `<div class="stat"><div class="value">${stat.value}</div><div class="label">${stat.label}</div></div>`)
    .join('');

  const cards = articles
    .map((article) => {
      const tagHtml = (article.tags || [])
        .map((tag) => `<span class="tag">${tag}</span>`)
        .join('');
      return `<article class="card">
        <img src="${article.heroImage}" alt="${article.title}">
        <div class="card-content">
          <div class="tag-list">${tagHtml}</div>
          <h3>${article.title}</h3>
          <p>${article.summary || ''}</p>
          <small>${article.dateDisplay} • ${article.author}</small>
          <a href="articles/${article.slug}/">Read report →</a>
        </div>
      </article>`;
    })
    .join('');

  const nav = siteConfig.nav
    .map((item) => `<a href="${item.href}">${item.label}</a>`)
    .join('');

  const body = `
  <main>
    <header>
      <div>
        <p class="eyebrow">${siteConfig.tagline}</p>
        <h1>${siteConfig.title}</h1>
        <p>We translate lupus research, highlight patient advocates, and track digital health pilots every day so families can make faster decisions.</p>
      </div>
      <nav>${nav}</nav>
    </header>

    <section class="hero">
      <h2>Today’s Signals</h2>
      <p>Fresh notes from the field, matched with the stats that keep us accountable.</p>
      <div class="hero-stats">${heroStats}</div>
    </section>

    <section id="articles" class="section">
      <h2>Latest briefs & patient voices</h2>
      <div class="cards">${cards}</div>
    </section>

    <section id="downloads" class="section">
      <h2>Downloads</h2>
      <p>Coming soon: Daily Flare Log, Family Autoimmune Map, Trial Watchlist.</p>
    </section>
  </main>`;

  return baseTemplate({ title: siteConfig.title, body, extraHead: '' }).replace('assets/styles.css', 'assets/styles.css');
}

function renderArticle(article) {
  const tagHtml = (article.tags || [])
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join('');

  const body = `
  <div class="article-page">
    <header>
      <p class="meta">${article.dateDisplay} • ${article.author}</p>
      <h1>${article.title}</h1>
      <div class="tag-list">${tagHtml}</div>
    </header>
    <img src="${article.heroImage}" alt="${article.title}">
    <article>${article.html}</article>
    <p><a href="../../index.html">← Back to all articles</a></p>
  </div>`;

  return baseTemplate({ title: article.title, body });
}

async function build() {
  const articles = await loadArticles();
  await fse.emptyDir(DIST_DIR);
  await fse.ensureDir(ASSET_DIR);
  await fs.writeFile(path.join(ASSET_DIR, 'styles.css'), css);

  const indexHtml = renderIndex(articles);
  await fs.writeFile(path.join(DIST_DIR, 'index.html'), indexHtml, 'utf-8');

  for (const article of articles) {
    const articleDir = path.join(DIST_DIR, 'articles', article.slug);
    await fse.ensureDir(articleDir);
    const html = renderArticle(article);
    await fs.writeFile(path.join(articleDir, 'index.html'), html, 'utf-8');
  }

  await fse.ensureDir(DOCS_DIR);
  await fse.emptyDir(DOCS_DIR);
  await fse.copy(DIST_DIR, DOCS_DIR);
}

build().then(() => console.log('Site built at dist/ and copied to docs/')).catch((err) => {
  console.error(err);
  process.exit(1);
});
