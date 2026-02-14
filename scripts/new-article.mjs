import inquirer from 'inquirer';
import { format } from 'date-fns';
import { promises as fs } from 'fs';
import path from 'path';
import slugify from 'slugify';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const CONTENT_DIR = path.join(ROOT, 'content', 'articles');

async function run() {
  const answers = await inquirer.prompt([
    { name: 'title', message: 'Article title', validate: (v) => !!v || 'Required' },
    { name: 'author', message: 'Author', default: 'Jarvis Research Desk' },
    { name: 'summary', message: 'One-line summary', default: '' },
    { name: 'tags', message: 'Tags (comma separated)', default: '' },
    { name: 'heroImage', message: 'Hero image URL', default: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80' }
  ]);

  const date = new Date();
  const slug = slugify(answers.title, { lower: true, strict: true });
  const fileName = `${format(date, 'yyyy-MM-dd')}-${slug}.md`;
  const tagsYaml = answers.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => `  - ${tag}`)
    .join('\n');

  const frontMatter = `---\ntitle: "${answers.title}"\ndate: ${format(date, 'yyyy-MM-dd')}\nauthor: "${answers.author}"\ntags:\n${tagsYaml || '  - Research Log'}\nheroImage: "${answers.heroImage}"\nsummary: "${answers.summary}"\n---\n\n`;

  const templateBody = `## Why this matters\n\n- Point one\n- Point two\n\n## Key takeaways\n\n1. Takeaway 1\n2. Takeaway 2\n\n`;

  await fs.writeFile(path.join(CONTENT_DIR, fileName), frontMatter + templateBody, 'utf-8');
  console.log(`Created content/articles/${fileName}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
