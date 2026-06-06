$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$terraformDir = Join-Path $root "infra\terraform"

function Get-TerraformOutput {
  param([Parameter(Mandatory = $true)][string]$Name)

  Push-Location $terraformDir
  try {
    $value = & terraform output -raw $Name
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($value)) {
      throw "Unable to read terraform output '$Name' from $terraformDir."
    }

    return $value.Trim()
  } finally {
    Pop-Location
  }
}

$bastionId = Get-TerraformOutput -Name "bastion_id"
$dbEndpoint = Get-TerraformOutput -Name "db_endpoint"
$dbPort = Get-TerraformOutput -Name "db_port"
$localPort = 5432

Write-Host "Opening SSM port forward from localhost:${localPort} to ${dbEndpoint}:${dbPort} via $bastionId..."
Write-Host "Leave this window open while you run the app."

& aws ssm start-session `
  --target $bastionId `
  --document-name AWS-StartPortForwardingSessionToRemoteHost `
  --parameters "host=$dbEndpoint,portNumber=$dbPort,localPortNumber=$localPort"
