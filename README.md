# Phoenix Adventures

A dependency-free static adventure game skeleton for `phoenixadventures.org`.

## Project layout

- `site/index.html` - game shell
- `site/styles.css` - responsive interface styling
- `site/adventure-data.js` - editable scene, map, choice, and storyline data
- `site/game.js` - reusable scene engine, internal dice checks, inventory, and save-state logic
- `site/assets/` - replaceable art assets
- `docs/art-direction.md` - source notes and fictionalization rules for the school-to-castle treatment
- `deploy.ps1` - syncs the static site folder to S3

## Local preview

Open `site/index.html` in a browser. No build step is required.

## Deploy

```powershell
.\deploy.ps1 -Profile georgist-login
```

The deploy script syncs only the `site/` folder to `s3://phoenixadventures-org`.

## AWS resources

- AWS profile: `georgist-login`
- Region: `us-west-1`
- Hosted zone: `Z06866673H2QKV8JHQJ8W`
- Site bucket: `s3://phoenixadventures-org`
- Logging bucket: `s3://s3.logs.645377689567.us-west-1/s3/phoenixadventures.org/`
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
