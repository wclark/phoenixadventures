# Phoenix Adventures

A dependency-free static adventure game skeleton for `phoenixadventures.org`.

## Project layout

- `site/index.html` - game shell
- `site/styles.css` - responsive interface styling
- `site/game.js` - scene, dice, inventory, and save-state logic
- `site/assets/` - replaceable art assets
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

Route 53 assigned these nameservers:

```text
ns-1907.awsdns-46.co.uk
ns-58.awsdns-07.com
ns-1372.awsdns-43.org
ns-522.awsdns-01.net
```
