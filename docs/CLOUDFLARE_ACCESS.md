# Cloudflare Access

The private member area depends on Cloudflare Access protecting `/members/*`.
The Astro site does not enforce login by itself.

Do not publish real private calendar details or photos until these checks pass.

## Application setup

In Cloudflare Zero Trust:

1. Go to `Access controls` > `Applications`.
2. Create a self-hosted application.
3. Use the production domain `pack60.org`.
4. Protect the path `/members/*`.
5. Add an allow policy for approved Pack 60 family and leader emails.
6. Enable email one-time PIN.
7. Optionally enable Google SSO.
8. Add Facebook Login only if the pack wants to maintain that provider.

Google or Facebook login only proves identity. Access must still be restricted
to approved email addresses or an approved Access group.

## Required test cases

Before adding real private content, verify:

- Signed-out visitors cannot open `/members/`
- Signed-out visitors cannot open `/members/calendar/`
- Signed-out visitors cannot open `/members/photos/`
- Signed-out visitors cannot open a direct `/members/media/...` image URL
- An approved email address can sign in
- An unapproved email address is denied
- Public pages still load without login
- The generated sitemap does not include `/members/*`

## Preview deployments

Cloudflare Pages preview deployments can have different hostnames from
`pack60.org`.

Before adding real private content, either:

- Protect preview hostnames with an Access policy too
- Disable public preview exposure for member content
- Avoid deploying real member content to preview builds

## Ongoing maintenance

Review access at least once per scouting year and whenever a family leaves the
pack.

Remove access promptly when requested by pack leadership or a parent or
guardian.
