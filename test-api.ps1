Start-Sleep -Seconds 3
Write-Host "Testing API..." -ForegroundColor Cyan

try {
  $r = Invoke-RestMethod -Uri "http://localhost:8888/api/search" -Method Post -Body '{"query":"JG25-252"}' -ContentType "application/json" -ErrorAction Stop
  Write-Host "✓ Connected successfully" -ForegroundColor Green
  Write-Host "  Results: $($r.invoices.Count) invoices" -ForegroundColor Green
} catch {
  Write-Host "✗ Connection failed: $($_.Exception.Message)" -ForegroundColor Red
}
