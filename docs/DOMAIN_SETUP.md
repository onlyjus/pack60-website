# Domain Setup

Potential domain options:

- `pack60.org` selected
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

## Email routing

The website publishes these pack aliases:

- `info@pack60.org`
- `membership@pack60.org`
- `webmaster@pack60.org`

These addresses must be configured separately from the website. In the
Cloudflare dashboard, open **Compute > Email Service > Email Routing**, onboard
`pack60.org`, and let Cloudflare add the required mail DNS records. Add and
verify an existing pack-owned inbox as a destination, then create one routing
rule for each alias above.

Cloudflare Email Routing forwards incoming messages to the verified destination
inbox; it does not create a separate mailbox to check. Use a full email provider
instead if pack volunteers need to send and reply directly as `@pack60.org`.

After setup, send a test message to each alias from an unrelated email account
and confirm that all three reach the intended destination.
