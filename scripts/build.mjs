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
  ctaText: 'Daily Lupus Signal',
  ctaLink: 'mailto:hello@lupuslab.org?subject=Daily%20Lupus%20Signal',
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

const css = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500&display=swap');
:root{--bg:#f5f8fc;--surface:#ffffff;--surface-muted:#eef4ff;--border:#e2e8f0;--border-strong:#cad4e0;--text:#0f1c3f;--muted:#5d6b8c;--accent:#31c6c0;--accent-dark:#1f9b96;--ink:#0b2447}
*{box-sizing:border-box;font-family:'Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
body{margin:0;background:var(--bg);color:var(--text);line-height:1.7}
a{text-decoration:none;color:inherit}
button,input{font-family:'Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.page{max-width:1180px;margin:0 auto;padding:40px 24px 120px}
.eyebrow{font-size:.78rem;text-transform:uppercase;letter-spacing:.18em;color:var(--accent-dark);font-weight:600;margin:0 0 4px}
.site-header{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:24px;padding:12px 0;border-bottom:1px solid var(--border)}
.brand{display:flex;align-items:center;gap:14px}
.brand-mark{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,var(--accent),#7ee0c9);display:flex;align-items:center;justify-content:center;font-family:'Space Grotesk',sans-serif;color:var(--surface);font-weight:600;font-size:1.1rem;box-shadow:0 8px 24px rgba(16,24,64,.18)}
.brand-text strong{display:block;font-size:1.05rem;color:var(--ink)}
.brand-text span{font-size:.9rem;color:var(--muted)}
.site-nav{display:flex;gap:12px;align-items:center;font-weight:500;flex-wrap:wrap}
.site-nav a{padding:10px 16px;border-radius:999px;color:var(--muted)}
.site-nav a:hover{background:var(--surface-muted);color:var(--text)}
.primary-button{padding:12px 22px;border-radius:12px;background:var(--accent);color:#fff;font-weight:600;box-shadow:0 10px 28px rgba(49,198,192,.3)}
.primary-button:hover{background:var(--accent-dark)}
.feature{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:28px;margin-top:40px}
.feature-article{background:var(--surface);border:1px solid var(--border);border-radius:28px;padding:32px 32px 40px;box-shadow:0 24px 60px rgba(15,28,63,.08)}
.feature-meta{color:var(--muted);font-size:.95rem;margin-bottom:4px}
.feature-article h1{font-size:2.45rem;margin:0 0 16px;color:var(--ink)}
.feature-summary{color:#2c385f;font-size:1.05rem;margin:0 0 18px}
.feature-article .tag-list{margin-bottom:20px}
.feature-article img{width:100%;border-radius:24px;margin-top:28px;object-fit:cover}
.feature-actions{display:flex;flex-wrap:wrap;gap:16px}
.feature-widgets{display:flex;flex-direction:column;gap:18px}
.panel{background:var(--surface);border:1px solid var(--border);border-radius:22px;padding:24px;box-shadow:0 12px 30px rgba(15,28,63,.05)}
.reaction-card h3{margin:0 0 14px;font-size:1.1rem}
.reaction-buttons{display:flex;justify-content:space-between;gap:10px}
.reaction-button{flex:1;border:1px solid var(--border);border-radius:16px;padding:12px 8px;text-align:center;font-size:.9rem;color:var(--muted);display:flex;flex-direction:column;gap:4px;align-items:center;background:var(--surface-muted)}
.reaction-button span{font-size:1.4rem}
.reaction-button:nth-child(3){border-color:var(--accent);background:rgba(49,198,192,.08);color:var(--accent-dark)}
.newsletter-card h3{margin:0 0 10px;font-size:1.15rem}
.newsletter-card p{margin:0 0 16px;color:var(--muted)}
.input-group{display:flex;gap:12px}
.input-group input{flex:1;padding:12px 14px;border-radius:14px;border:1px solid var(--border-strong);font-size:.95rem}
.input-group button{border:none;padding:12px 18px;border-radius:14px;background:var(--accent);color:#fff;font-weight:600;cursor:pointer}
.input-group button:hover{background:var(--accent-dark)}
.newsletter-card small{display:block;margin-top:10px;color:var(--muted);font-size:.85rem}
.stat-panel{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.stat-card{border:1px dashed var(--border-strong);border-radius:18px;padding:16px;background:var(--surface-muted)}
.stat-card .value{font-size:1.7rem;font-weight:700;color:var(--ink)}
.stat-card .label{font-size:.9rem;color:var(--muted)}
.section{margin-top:60px}
.section-header{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:24px}
.section-header h2{margin:4px 0 0;font-size:1.8rem}
.ghost-link{color:var(--accent-dark);font-weight:600}
.post-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px}
.post-card{background:var(--surface);border:1px solid var(--border);border-radius:24px;box-shadow:0 16px 40px rgba(15,28,63,.05);overflow:hidden;display:flex;flex-direction:column}
.post-card img{width:100%;height:160px;object-fit:cover}
.post-card .card-body{padding:20px 22px;display:flex;flex-direction:column;gap:10px}
.tag-list{display:flex;flex-wrap:wrap;gap:8px;font-size:.78rem}
.tag{background:var(--surface-muted);color:var(--accent-dark);padding:4px 10px;border-radius:999px;font-weight:600}
.post-card footer{display:flex;justify-content:space-between;align-items:center;padding:0 22px 22px;font-size:.9rem;color:var(--muted)}
.post-card footer a{color:var(--accent-dark);font-weight:600}
.downloads-card{display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between}
.downloads-card h3{margin:6px 0 10px;font-size:1.5rem}
footer{margin-top:60px;text-align:center;color:var(--muted);font-size:.9rem;padding:32px}
.article-page{max-width:780px;margin:0 auto;padding:40px 24px 120px}
.article-page header{margin-bottom:24px}
.article-page h1{margin:8px 0 10px;font-size:2.4rem;color:var(--ink)}
.article-page .meta{color:var(--muted);font-size:.95rem}
.article-page img{width:100%;border-radius:26px;margin:32px 0}
.article-page article{line-height:1.8;color:#1e2744}
.article-page article h2{margin-top:32px}
.article-page a{color:var(--accent-dark);font-weight:600}
@media(max-width:1080px){.feature{grid-template-columns:1fr}}
@media(max-width:960px){.site-nav{justify-content:flex-start}.feature{gap:20px}.feature-article h1{font-size:2.2rem}}
@media(max-width:720px){.page{padding:32px 18px 100px}.site-header{flex-direction:column;align-items:flex-start;padding-bottom:20px}.site-nav{width:100%}.site-nav a,.site-nav .primary-button,.feature .primary-button{width:100%;text-align:center}.feature-article{padding:22px}.feature-article h1{font-size:2rem}.feature-actions{flex-direction:column}.reaction-buttons{flex-wrap:wrap}.reaction-button{flex:1 1 calc(50% - 8px)}.input-group{flex-direction:column}.stat-panel{grid-template-columns:1fr}.post-card img{height:200px}}
@media(max-width:540px){.page{padding:28px 16px 90px}.brand{width:100%;justify-content:flex-start}.site-nav{gap:8px}.reaction-button{flex:1 1 100%}.feature-article img{margin-top:18px}.post-card{border-radius:20px}.downloads-card{flex-direction:column;align-items:flex-start;width:100%}.section-header{flex-direction:column;align-items:flex-start}}
`;
const reactionButtons = [
  { label: 'Worried', emoji: '😟' },
  { label: 'Concerned', emoji: '😕' },
  { label: 'OK', emoji: '🙂' },
  { label: 'Good', emoji: '😌' },
  { label: 'Hopeful', emoji: '🤗' }
];

marked.use({ async: false });

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
  if (!articles.length) {
    return baseTemplate({
      title: siteConfig.title,
      body: '<div class="page"><p>No articles yet. Come back soon.</p></div>'
    });
  }

  const [feature, ...rest] = articles;

  const nav = siteConfig.nav
    .map((item) => `<a href="${item.href}">${item.label}</a>`)
    .join('');

  const featureTags = (feature.tags || [])
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join('');

  const stats = siteConfig.heroStats
    .map((stat) => `<div class="stat-card"><div class="value">${stat.value}</div><div class="label">${stat.label}</div></div>`)
    .join('');

  const reactionMarkup = reactionButtons
    .map((btn) => `<button class="reaction-button" type="button"><span>${btn.emoji}</span>${btn.label}</button>`)
    .join('');

  const restCards = rest
    .map((article) => {
      const tags = (article.tags || [])
        .map((tag) => `<span class="tag">${tag}</span>`)
        .join('');

      return `<article class="post-card">
        <img src="${article.heroImage}" alt="${article.title}">
        <div class="card-body">
          <div class="tag-list">${tags}</div>
          <h3>${article.title}</h3>
          <p>${article.summary || ''}</p>
        </div>
        <footer>
          <span>${article.dateDisplay}</span>
          <a href="articles/${article.slug}/">Read ⟶</a>
        </footer>
      </article>`;
    })
    .join('');

  const postsBlock = restCards || '<p>No additional articles yet.</p>';

  const body = `
  <div class="page">
    <header class="site-header">
      <div class="brand">
        <div class="brand-mark">LA</div>
        <div class="brand-text">
          <span class="eyebrow">${siteConfig.tagline}</span>
          <strong>${siteConfig.title}</strong>
        </div>
      </div>
      <nav class="site-nav">
        ${nav}
        <a class="primary-button" href="${siteConfig.ctaLink}">${siteConfig.ctaText}</a>
      </nav>
    </header>

    <section class="feature">
      <article class="feature-article">
        <p class="feature-meta">Published ${feature.dateDisplay} • ${feature.author}</p>
        <h1>${feature.title}</h1>
        <p class="feature-summary">${feature.summary || ''}</p>
        <div class="tag-list">${featureTags}</div>
        <div class="feature-actions">
          <a class="primary-button" href="articles/${feature.slug}/">Read full briefing</a>
          <a class="ghost-link" href="mailto:hello@lupuslab.org?subject=Share%20this%20briefing&body=${encodeURIComponent(feature.title)}">Share with care team</a>
        </div>
        <img src="${feature.heroImage}" alt="${feature.title}">
      </article>
      <div class="feature-widgets">
        <div class="panel reaction-card">
          <h3>Choose your reaction</h3>
          <div class="reaction-buttons">${reactionMarkup}</div>
        </div>
        <div class="panel newsletter-card">
          <h3>Subscribe to our Lupus Signal</h3>
          <p>One concise research + patient story email shipped nightly.</p>
          <div class="input-group">
            <input type="email" placeholder="Email address" aria-label="Email address">
            <button type="button" onclick="window.location='mailto:hello@lupuslab.org?subject=Subscribe%20me%20to%20the%20Lupus%20Signal'">Subscribe</button>
          </div>
          <small>No spam. Just daily lupus intelligence.</small>
        </div>
        <div class="panel stat-panel">${stats}</div>
      </div>
    </section>

    <section id="articles" class="section">
      <div class="section-header">
        <div>
          <p class="eyebrow">Daily Lupus Briefings</p>
          <h2>More signals from the lab</h2>
        </div>
        <a class="ghost-link" href="mailto:hello@lupuslab.org?subject=Send%20full%20archive">View archive</a>
      </div>
      <div class="post-grid">${postsBlock}</div>
    </section>

    <section id="downloads" class="section">
      <div class="downloads-card panel">
        <div>
          <p class="eyebrow">Care Kit (beta)</p>
          <h3>Printable trackers & shared decision guides</h3>
          <p>Daily flare log, family autoimmune map, trial watchlist template, and clinic-ready summary sheets.</p>
        </div>
        <a class="primary-button" href="mailto:hello@lupuslab.org?subject=Care%20kit%20request">Request early access</a>
      </div>
    </section>
  </div>`;

  return baseTemplate({ title: siteConfig.title, body });
}

function renderArticle(article) {
  const tagHtml = (article.tags || [])
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join('');

  const body = `
  <div class="page article-page">
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

build()
  .then(() => console.log('Site built at dist/ and copied to docs/'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
