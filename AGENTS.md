# Agent Notes

## Project

- Static Phoenix Adventures site lives in `site/`.
- There is no build step. Open `site/index.html` directly for a local preview.
- Deploy with `.\deploy.ps1` from this directory.

## AWS Login

- Use the generalized AWS CLI profile `personal-sites`.
- The profile is configured in `~/.aws/config` with:
  - `login_session = arn:aws:iam::645377689567:root`
  - `region = us-east-1`
  - `output = json`
- If AWS commands say the session expired, run:

```powershell
aws login --profile personal-sites
```

- Avoid using the old `georgist-login` name in new docs or scripts. It was historical and may be stale.
- Do not commit AWS credentials.

## AWS Resources

- Public domains: `phoenixadventures.org`, `www.phoenixadventures.org`
- S3 site bucket: `s3://phoenixadventures-org`
- S3 deploy region: `us-west-1`
- CloudFront distribution: `E3M9M426SCMIS4`
- CloudFront URL: `https://db3tx7bz72qe9.cloudfront.net`
- Hosted zone: `Z06866673H2QKV8JHQJ8W`
- ACM certificate: `arn:aws:acm:us-east-1:645377689567:certificate/45f1f007-3ff8-4bf9-a6d8-33dd15c294e2`

## Deploy

```powershell
aws login --profile personal-sites
.\deploy.ps1
```

The deploy script syncs `site/` to `s3://phoenixadventures-org` with short browser caching.
