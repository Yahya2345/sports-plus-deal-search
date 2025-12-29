$body = @{ query = 'JP5010B' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:8888/api/search' -Body $body -ContentType 'application/json' |
  ConvertTo-Json -Depth 6 |
  Set-Content -Path 'D:\Backup 3\Sports Plus Deal Search\tmp-search.json'
