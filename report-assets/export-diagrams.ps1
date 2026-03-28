$ErrorActionPreference = "Stop"

# Run from project root:
# powershell -ExecutionPolicy Bypass -File .\report-assets\export-diagrams.ps1

npx -y @mermaid-js/mermaid-cli -i .\report-assets\figure-1-architecture.mmd -o .\report-assets\figure-1-architecture.png -b transparent
npx -y @mermaid-js/mermaid-cli -i .\report-assets\figure-2-er-diagram.mmd -o .\report-assets\figure-2-er-diagram.png -b transparent
npx -y @mermaid-js/mermaid-cli -i .\report-assets\figure-3-data-flow.mmd -o .\report-assets\figure-3-data-flow.png -b transparent

Write-Host "Export completed: PNG files generated in report-assets." -ForegroundColor Green
