# Cub Scout Pack 60 Website

This repository contains the public static website for Cub Scout Pack 60, serving families in the Morgantown, WV area.

The site is designed as a public front door for prospective families and community members. It intentionally does not include private pack operations, rosters, payment records, advancement data, private meeting links, or personal information.

Production domain target: `pack60.org`

GitHub repository: `https://github.com/onlyjus/pack60-website`

## Technology Stack

- Astro
- TypeScript
- Astro Content Collections
- Markdown content files
- Static site generation
- Responsive CSS
- Cloudflare Pages-compatible output

## Local Development

Install dependencies:

```bash
npm install
```

Start the local dev server:

```bash
npm run dev
```

Build the site:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Editing Content

Most editable content lives in `src/content/` as Markdown files. Pages, activities, dens, volunteer roles, resources, and FAQ items are all content collections with frontmatter at the top of each file.

Helpful docs:

- `docs/EDITING_FOR_HUMANS.md`
- `docs/EDITING_WITH_AI.md`
- `docs/CONTENT_RULES.md`
- `docs/PHOTO_POLICY.md`
- `docs/MAINTENANCE_CHECKLIST.md`

## Quality Checks

Run formatting checks:

```bash
npm run format:check
```

Run Astro checks:

```bash
npm run check
```

Run the full build:

```bash
npm run build
```

## Deployment

This project is ready for Cloudflare Pages.

- Framework preset: Astro
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

See `docs/DEPLOYMENT.md` and `docs/DOMAIN_SETUP.md`.

## Public Content Safety

This is a public website for a youth organization. Do not add youth rosters, youth last names, parent contact information, medical forms, permission slips with personal data, private addresses, exact travel details, private meeting links, or any private Scoutbook data.

When a fact is not approved for public posting, leave it off the live site and note it for human review. Keep all content public-safe.
