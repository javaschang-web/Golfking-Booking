param(
  [string]$BaseUrl
)

if (-not $BaseUrl) {
  Write-Error 'Usage: .\smoke-check.ps1 -BaseUrl https://your-app.vercel.app'
  exit 1
}

$paths = @(
  '/',
  '/api/health',
  '/search?date=2026-04-30&region=%EA%B2%BD%EA%B8%B0',
  '/courses/seowon-hills?date=2026-04-30&region=%EA%B2%BD%EA%B8%B0',
  '/admin/login'
)

foreach ($path in $paths) {
  $url = "$BaseUrl$path"
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20
    Write-Host "[OK] $($response.StatusCode) $url"
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "[FAIL] $status $url"
  }
}
