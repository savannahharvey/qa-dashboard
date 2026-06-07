$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$terraformDir = Join-Path $root "infra\terraform"

function Assert-CommandAvailable {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$InstallHint
  )

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw @"
Missing required command: $Name

${InstallHint}

If you already installed it, open a new terminal so PATH refreshes.
"@
  }
}

function Add-SessionManagerPluginToPath {
  $candidateDirs = @(
    (Join-Path $env:ProgramFiles "Amazon\SessionManagerPlugin\bin"),
    (Join-Path ${env:ProgramFiles(x86)} "Amazon\SessionManagerPlugin\bin")
  )

  $candidates = $candidateDirs | Where-Object { $_ -and (Test-Path (Join-Path $_ "session-manager-plugin.exe")) }

  if ($candidates.Count -gt 0) {
    $pluginDir = $candidates[0]
    if ($env:PATH -notlike "*$pluginDir*") {
      $env:PATH = "$pluginDir;$env:PATH"
    }
    return $pluginDir
  }

  return $null
}

Assert-CommandAvailable -Name "terraform" -InstallHint "Install Terraform and make sure it is available on PATH."
Assert-CommandAvailable -Name "aws" -InstallHint "Install the AWS CLI and make sure it is available on PATH."

$pluginDir = Add-SessionManagerPluginToPath
if (-not (Get-Command "session-manager-plugin" -ErrorAction SilentlyContinue)) {
  if ($null -eq $pluginDir) {
    Assert-CommandAvailable -Name "session-manager-plugin" -InstallHint "Install the AWS Session Manager Plugin and make sure it is available on PATH."
  }
}

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
$localPort = 5999

Write-Host "Opening SSM port forward from localhost:${localPort} to ${dbEndpoint}:${dbPort} via $bastionId..."
Write-Host "Leave this window open while you run the app."

& aws ssm start-session `
  --target $bastionId `
  --document-name AWS-StartPortForwardingSessionToRemoteHost `
  --parameters "host=$dbEndpoint,portNumber=$dbPort,localPortNumber=$localPort"
