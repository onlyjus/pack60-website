# Domain Setup

Potential domain options:

- `pack60.org` selected
- `pack60wv.org`
- `cubpack60.org`

Use a pack-owned account for domain registration, DNS, Cloudflare, and GitHub access. Avoid tying the site to one volunteer's personal account.

## DNS overview

DNS tells browsers where to find the website for a domain. Cloudflare manages
DNS and hosts the site through a Worker with static assets.

## Cloudflare DNS setup

1. Add the domain to Cloudflare.
2. Update nameservers at the domain registrar if needed.
3. Confirm Cloudflare shows the domain as active.

## Custom domains on the Cloudflare Worker

1. Open the `pack60-website` Worker.
2. Go to Settings > Domains & Routes.
3. Confirm `pack60.org` serves the public site.
4. Confirm `members.pack60.org` serves the private member application.
5. Keep both custom domains declared in `wrangler.jsonc`.
6. Confirm both domains resolve to the Worker.

Protect the entire `members.pack60.org` hostname with Cloudflare Access. The
application also checks its D1 member list on every private page and API request.
See `docs/CLOUDFLARE_ACCESS.md` for the required policy and runtime settings.

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
