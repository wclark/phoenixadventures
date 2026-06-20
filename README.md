# Phoenix Adventures

A dependency-free static character builder for `phoenixadventures.org`.

## Project layout

- `site/index.html` - game shell
- `site/styles.css` - responsive interface styling
- `site/adventure-data.js` - editable builder data for races, backgrounds, classes, scenes, and choices
- `site/game.js` - reusable scene engine, score assignment, character state, tracking pixel, inventory, and save-state logic
- `site/data/users/` - static hashed player config files used by the login gate
- `site/assets/` - replaceable art assets
- `docs/art-direction.md` - source notes and fictionalization rules for the school-to-castle treatment
- `deploy.ps1` - syncs the static site folder to S3

## Local preview

Run a tiny static server so `fetch()` can load JSON files. No build step is required.

```powershell
cd site
python -m http.server 4199 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:4199/`.

Starter players:

- `Bill Clark` / `test`
- `Duncan Clark` / `test`

The login id is the SHA-256 hash of `lowercase-player-name:password`, and the matching config is fetched from `site/data/users/{hash}.json`.

## Deploy

```powershell
aws login --profile personal-sites
.\deploy.ps1
```

The deploy script syncs only the `site/` folder to `s3://phoenixadventures-org`.

The app emits a hidden request to `assets/character-pixel.svg` with player id/name and character state encoded as query parameters, including race/class/background keys, the rolled score pool, assigned base scores, racial bonuses, final ability scores, gear, and inventory. CloudFront standard logging v2 records those requests in the `cs-uri-query` field under `s3://cloudfront-logs-645377689567-us-west-1/cloudfront/phoenixadventures.org/{yyyy}/{MM}/{dd}/{HH}/`.

## AWS resources

- AWS profile: `personal-sites`
- Region: `us-west-1`
- Hosted zone: `Z06866673H2QKV8JHQJ8W`
- Site bucket: `s3://phoenixadventures-org`
- S3 origin logging bucket: `s3://s3.logs.645377689567.us-west-1/s3/phoenixadventures.org/`
- CloudFront v2 logging bucket: `s3://cloudfront-logs-645377689567-us-west-1/cloudfront/phoenixadventures.org/{yyyy}/{MM}/{dd}/{HH}/`
- CloudFront distribution: `E3M9M426SCMIS4`
- Temporary CloudFront URL: `https://db3tx7bz72qe9.cloudfront.net`
- ACM certificate: `arn:aws:acm:us-east-1:645377689567:certificate/45f1f007-3ff8-4bf9-a6d8-33dd15c294e2`

Route 53 assigned these nameservers:

```text
ns-1907.awsdns-46.co.uk
ns-58.awsdns-07.com
ns-1372.awsdns-43.org
ns-522.awsdns-01.net
```

The AWS hosted zone has working `A` and `AAAA` alias records for `phoenixadventures.org` and `www.phoenixadventures.org` pointing to CloudFront. `http://phoenixadventures.org/` redirects to `https://phoenixadventures.org/`.

The domain had briefly been delegated to the wrong/lame Route 53 nameservers at GoDaddy. That has been corrected; the `.org` registry and public DNS now resolve through the hosted zone above.

The exact S3 bucket name `phoenixadventures.org` is currently unavailable for recreation after the Region consolidation, so the live origin bucket is the clean fallback `phoenixadventures-org`. The public website domain remains `phoenixadventures.org`.
