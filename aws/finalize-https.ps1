param(
  [string]$Profile = "georgist-login",
  [string]$HostedZoneId = "Z06866673H2QKV8JHQJ8W",
  [string]$DistributionId = "E3M9M426SCMIS4",
  [string]$CertificateArn = "arn:aws:acm:us-east-1:645377689567:certificate/15653f44-fe31-46e5-9528-bacf55664f5a",
  [switch]$WaitForCertificate
)

$ErrorActionPreference = "Stop"
$Aws = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"
$TmpDir = Join-Path (Split-Path $PSScriptRoot -Parent) "tmp"
$DistributionConfigPath = Join-Path $TmpDir "cloudfront-distribution-custom-cert.json"
$Route53BatchPath = Join-Path $PSScriptRoot "cloudfront-route53-records.json"

New-Item -ItemType Directory -Force $TmpDir | Out-Null

if ($WaitForCertificate) {
  & $Aws acm wait certificate-validated `
    --certificate-arn $CertificateArn `
    --region us-east-1 `
    --profile $Profile
}

$Certificate = & $Aws acm describe-certificate `
  --certificate-arn $CertificateArn `
  --region us-east-1 `
  --profile $Profile | ConvertFrom-Json

if ($Certificate.Certificate.Status -ne "ISSUED") {
  throw "ACM certificate is $($Certificate.Certificate.Status). Fix registrar nameservers first, then wait for validation."
}

$ConfigResponse = & $Aws cloudfront get-distribution-config `
  --id $DistributionId `
  --profile $Profile | ConvertFrom-Json

$Config = $ConfigResponse.DistributionConfig
$Config.Aliases = @{
  Quantity = 2
  Items = @("phoenixadventures.org", "www.phoenixadventures.org")
}
$Config.ViewerCertificate = @{
  ACMCertificateArn = $CertificateArn
  SSLSupportMethod = "sni-only"
  MinimumProtocolVersion = "TLSv1.2_2021"
}

$Config | ConvertTo-Json -Depth 100 | Set-Content -Encoding UTF8 $DistributionConfigPath

& $Aws cloudfront update-distribution `
  --id $DistributionId `
  --if-match $ConfigResponse.ETag `
  --distribution-config "file://$DistributionConfigPath" `
  --profile $Profile

& $Aws cloudfront wait distribution-deployed `
  --id $DistributionId `
  --profile $Profile

& $Aws route53 change-resource-record-sets `
  --hosted-zone-id $HostedZoneId `
  --change-batch "file://$Route53BatchPath" `
  --profile $Profile

Write-Host "HTTPS custom domain setup submitted for phoenixadventures.org."
