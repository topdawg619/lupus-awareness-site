# Lupus Awareness Lab

Custom CMS-style static site for daily lupus research notes, built for GitHub Pages hosting.

## Structure
- `content/articles/*.md` – Markdown sources with front matter
- `scripts/new-article.mjs` – CLI helper to scaffold a new post
- `scripts/build.mjs` – Converts markdown → HTML, outputs to `dist/` and copies to `docs/`
- `docs/` – Production-ready static site served by GitHub Pages

## Usage
```bash
npm install                # one time
npm run new:article        # create a new markdown file
npm run build              # regenerate site (updates dist/ and docs/)
```

## Deployment
1. Push to GitHub (public repo: `topdawg619/lupus-awareness-site`).
2. GitHub Pages is configured to serve from `master` -> `/docs`.
3. Public URL: https://topdawg619.github.io/lupus-awareness-site/

## Inspiration
Design cues and storytelling inspired by the Lupus Foundation of America (https://www.lupus.org/), but rewritten with our own research voice.
