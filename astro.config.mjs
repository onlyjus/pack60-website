import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: process.env.SITE_URL || 'https://pack60.org',
  output: 'static',
  integrations: [sitemap()],
  adapter: cloudflare()
});