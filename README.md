# Phoenix Adventures

A dependency-free static adventure game skeleton for `phoenixadventures.org`.

## Project layout

- `site/index.html` - game shell
- `site/styles.css` - responsive interface styling
- `site/game.js` - scene, dice, inventory, and save-state logic
- `site/assets/` - replaceable art assets
- `docs/art-direction.md` - source notes and fictionalization rules for the school-to-castle treatment
- `deploy.ps1` - syncs the static site folder to S3

## Local preview

Open `site/index.html` in a browser. No build step is required.

## Deploy

```powershell
.\deploy.ps1 -Profile georgist-login
```

The deploy script syncs only the `site/` folder to `s3://phoenixadventures.org`.

## AWS resources

- AWS profile: `georgist-login`
- Region: `us-east-1`
- Hosted zone: `Z06866673H2QKV8JHQJ8W`
- Site bucket: `s3://phoenixadventures.org`
- Redirect bucket: `s3://www.phoenixadventures.org`
- CloudFront distribution: `E3M9M426SCMIS4`
- Temporary CloudFront URL: `https://db3tx7bz72qe9.cloudfront.net`
- ACM certificate: `arn:aws:acm:us-east-1:645377689567:certificate/15653f44-fe31-46e5-9528-bacf55664f5a`

Route 53 assigned these nameservers:

```text
ns-1907.awsdns-46.co.uk
ns-58.awsdns-07.com
ns-1372.awsdns-43.org
ns-522.awsdns-01.net
```

The AWS hosted zone has working `A` alias records for `phoenixadventures.org` and `www.phoenixadventures.org`. Public DNS will use those records only after the domain registrar delegates the domain to the Route 53 nameservers above.

As of May 11, 2026, the `.org` registry delegates `phoenixadventures.org` to these incorrect/lame Route 53 nameservers, which refuse queries for this domain:

```text
ns-1441.awsdns-52.org
ns-1965.awsdns-53.co.uk
ns-432.awsdns-54.com
ns-645.awsdns-16.net
```

Update the domain at GoDaddy to the Route 53 nameservers above. After that public DNS will resolve, ACM DNS validation can complete, and the CloudFront distribution can be updated to serve `https://phoenixadventures.org/`.
