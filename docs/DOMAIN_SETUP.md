# Domain Setup

Potential domain options:

- `pack60.org`
- `pack60wv.org`
- `cubpack60.org`

Use a pack-owned account for domain registration, DNS, Cloudflare, and GitHub access. Avoid tying the site to one volunteer's personal account.

## DNS overview

DNS tells browsers where to find the website for a domain. Cloudflare can manage DNS and host the static site through Cloudflare Pages.

## Cloudflare DNS setup

1. Add the domain to Cloudflare.
2. Update nameservers at the domain registrar if needed.
3. Confirm Cloudflare shows the domain as active.

## Custom domain in Cloudflare Pages

1. Open the Cloudflare Pages project.
2. Go to Custom domains.
3. Add the chosen domain.
4. Follow Cloudflare's DNS instructions.
5. Confirm the domain resolves to the Pages project.

## SSL note

Cloudflare provides HTTPS certificates for custom domains. Wait for certificate provisioning before announcing the public URL.
