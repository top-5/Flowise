# Fix remaining this.serde.parse/stringify calls to use this.jsonSerializer

$files = @(
    "nodes/memory/AgentMemory/PostgresAgentMemory/pgSaver.ts",
    "nodes/memory/AgentMemory/SQLiteAgentMemory/sqliteSaver.ts"
)

foreach ($file in $files) {
    Write-Host "Processing $file..."
    $content = Get-Content $file -Raw
    
    # Replace this.serde.parse with this.jsonSerializer.parse
    $content = $content -replace 'this\.serde\.parse\(', 'this.jsonSerializer.parse('
    
    # Replace this.serde.stringify with this.jsonSerializer.stringify
    $content = $content -replace 'this\.serde\.stringify\(', 'this.jsonSerializer.stringify('
    
    Set-Content -Path $file -Value $content -NoNewline
    Write-Host "  Updated parse/stringify calls"
}

Write-Host "`nDone!"
