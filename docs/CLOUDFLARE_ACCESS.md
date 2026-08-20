# Cloudflare Access and Member Accounts

The private member area uses two separate controls:

1. **Cloudflare Access authenticates identity.** It verifies a Google account or
   an email one-time PIN and sends a signed identity token to the site.
2. **The Pack 60 member database authorizes access.** Only active, invited email
   addresses may open member pages or APIs.

This separation makes invitation links and immediate account removal possible
without giving the website a high-privilege Cloudflare API token.

Do not publish real private content until every production check in this guide
passes.

## Production layout

- Public site: `https://pack60.org`
- Private sign-in and member area: `https://members.pack60.org/members/`
- Cloudflare Worker APIs: `/api/members/*`
- D1 binding name: `DB`

The same Worker serves both custom domains. Requests for a member page on
`pack60.org` redirect to the private hostname. Cloudflare Access protects the
**entire `members.pack60.org` hostname**, not just one path.

## 1. Create and bind the D1 database

Authenticate Wrangler and create the production database:

```bash
npx wrangler login
npx wrangler d1 create pack60-members --location enam
```

The production and preview database UUIDs are checked into `wrangler.jsonc`.

Apply the checked-in migration:

```bash
npx wrangler d1 migrations apply DB --remote
```

Confirm the Worker reports the production D1 binding as `DB`. Preview builds
use the separate `pack60-members-preview` database. Never connect an
unprotected preview hostname to the production member database.

## 2. Add the private custom domain

Both `pack60.org` and `members.pack60.org` are declared as Worker custom domains
in `wrangler.jsonc`.

The public header's **Member login** button points to:

```text
https://members.pack60.org/members/
```

## 3. Configure Cloudflare Access

In Cloudflare Zero Trust:

1. Go to **Access controls > Applications**.
2. Create a **Self-hosted** application.
3. Set the application domain to `members.pack60.org` with no path restriction.
4. Enable email one-time PIN. The built-in Cloudflare identity provider may
   remain enabled.
5. Optionally add Google later after creating a Google OAuth client ID and
   secret.
6. Create an Allow policy for authenticated users.
7. Do not add a Bypass policy.
8. Review the session duration. The initial application uses 15 minutes; it can
   be increased after the authentication and removal flow has been exercised.

The Access policy authenticates a broad pool of valid identities. That is
intentional: a newly invited person must be able to authenticate before
redeeming an invitation. Reaching the Cloudflare-protected origin does **not**
grant Pack 60 access. Every member page and API performs the separate D1 member
check.

## 4. Configure production variables

Set these Worker runtime values for production:

| Name                    | Example                                 | Purpose                                           |
| ----------------------- | --------------------------------------- | ------------------------------------------------- |
| `ENVIRONMENT`           | `production`                            | Disables local authentication helpers             |
| `CF_ACCESS_TEAM_DOMAIN` | `rough-brook-dfe1.cloudflareaccess.com` | Access token issuer and signing keys              |
| `CF_ACCESS_AUD`         | Access application AUD tag              | Restricts tokens to this Access application       |
| `MEMBER_APP_ORIGIN`     | `https://members.pack60.org`            | Canonical private hostname and invite-link origin |
| `BOOTSTRAP_ADMIN_EMAIL` | approved adult email                    | Creates the first administrator when none exists  |

Find the AUD tag under the Access application's additional settings. Do not set
`LOCAL_AUTH_BYPASS` or `LOCAL_AUTH_EMAIL` in production.

The bootstrap email only activates when there are no active administrators.
After creating a second administrator, the bootstrap variable may be removed.
The dashboard prevents an administrator from removing their own access or
removing the final active administrator.

## 5. First production sign-in

1. Deploy the site and database migration.
2. Sign in using `BOOTSTRAP_ADMIN_EMAIL`.
3. Open `/members/admin/`.
4. Confirm the account appears as an active administrator.
5. Generate a short-lived test invitation for a different email.
6. Open that link in a private browser session.
7. Authenticate as the invited email and activate access.
8. Confirm another email cannot redeem the link.
9. Confirm the same link cannot be used twice.
10. Remove the test account and confirm its next member request is denied.

## Invitation behavior

- Invitations are single-use.
- They expire after 1 to 30 days.
- They are tied to one normalized email address.
- Only a SHA-256 hash of the secret token is stored.
- Generating a replacement automatically revokes older unused invitations for
  that email.
- The complete link is displayed only once. If it is lost, create a replacement.
- An invitation can reactivate a previously removed account.

Send invitation links privately. They may appear in Cloudflare request logs, so
keep their lifetime short and revoke unused links when plans change.

## Account removal and sign-in history

**Remove access** changes the account to `revoked`; it does not erase its audit
record. The application denies the next page or API request immediately, even
if the user's Cloudflare SSO cookie has not expired.

The admin dashboard records:

- Last SSO sign-in, based on the issue time of the verified Access token
- Last member-area activity
- Current role and status
- Invitation creation, redemption, revocation, role changes, and access removal

Cloudflare also keeps its own identity and session history under **Zero Trust >
Team & Resources > Users**. Use Cloudflare's session revocation when a person's
SSO session must be terminated across every Access application, not just Pack 60.

## Calendar subscription links

Members can create a private iCalendar subscription URL from the calendar page
and add it to Google Calendar, Apple Calendar, or another compatible app. The
external calendar service cannot complete the interactive Cloudflare Access
login, so this URL carries its own high-entropy bearer token.

- Only a SHA-256 hash of the token is stored in D1.
- The complete URL is displayed only when it is created or rotated.
- Rotating or revoking the URL invalidates the previous token immediately.
- Removing the member account also makes its subscription return `404`.
- Anyone who receives the URL can read the calendar feed, so send it only to
  the member's own calendar account and rotate it if it may have leaked.

The public feed route exposes calendar event data only. It never exposes budget,
member, invitation, or audit records.

## Local development

Create the local configuration and replace the example email:

```powershell
Copy-Item .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev:members
```

Open `http://localhost:8788/members/`. The local identity bypass works only
when `ENVIRONMENT` is not `production` and `LOCAL_AUTH_BYPASS=true` is set in
the ignored `.dev.vars` file. Local D1 state is also ignored by Git.

## Required security tests

- A signed-out visitor is redirected to Cloudflare SSO.
- A valid but uninvited identity receives a Pack 60 invitation-required page.
- An active member can open member pages but receives `403` from admin APIs.
- A removed member receives `403` on the next private request.
- A forged identity header without a valid Access JWT is rejected.
- A JWT for another Access application audience is rejected.
- Direct `/members/media/*` requests require active membership.
- Mutation requests from another origin are rejected.
- Member routes and APIs send `private, no-store` and `noindex` headers.
- Preview deployments cannot reach production member data.

## Recovery

D1 Time Travel provides point-in-time recovery. Before a risky migration or
bulk access change, record a Time Travel bookmark and export the database for
longer-term retention. Never hard-delete access records merely to tidy the
dashboard; revoke them so the audit trail remains useful.
