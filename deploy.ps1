param(
  [string]$Profile = "georgist-login",
  [string]$Bucket = "phoenixadventures-org",
  [string]$Region = "us-west-1"
)

$ErrorActionPreference = "Stop"
$Aws = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"
$SitePath = Join-Path $PSScriptRoot "site"

if (-not (Test-Path $Aws)) {
  throw "AWS CLI was not found at $Aws"
}

& $Aws s3 sync $SitePath "s3://$Bucket" `
  --delete `
  --profile $Profile `
  --region $Region `
  --cache-control "public, max-age=300"
