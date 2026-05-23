param(
  [string]$Profile = "personal-sites",
  [string]$Bucket = "phoenixadventures-org",
  [string]$Region = "us-west-1"
)

$ErrorActionPreference = "Stop"
$Aws = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"
$SitePath = Join-Path $PSScriptRoot "site"

if (-not (Test-Path $Aws)) {
  throw "AWS CLI was not found at $Aws"
}

$BucketUri = "s3://$Bucket"

& $Aws s3 sync $SitePath $BucketUri `
  --delete `
  --profile $Profile `
  --region $Region `
  --cache-control "public, max-age=300"

$NoCacheFiles = @(
  @{ Local = "index.html"; ContentType = "text/html" },
  @{ Local = "adventure-data.js"; ContentType = "application/javascript" },
  @{ Local = "game.js"; ContentType = "application/javascript" },
  @{ Local = "styles.css"; ContentType = "text/css" },
  @{ Local = "assets/scene-sracs-tavern.svg"; ContentType = "image/svg+xml" }
)

foreach ($File in $NoCacheFiles) {
  & $Aws s3 cp (Join-Path $SitePath $File.Local) "$BucketUri/$($File.Local)" `
    --profile $Profile `
    --region $Region `
    --cache-control "no-cache, max-age=0, must-revalidate" `
    --content-type $File.ContentType
}
