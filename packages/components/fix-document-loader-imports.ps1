# Fix document loader imports for LangChain v1.0

$fixes = @(
    @{
        OldImport = "@langchain/community/document_loaders/fs/text"
        NewImport = "langchain/document_loaders/fs/text"
        Comment = "# TextLoader is in langchain package, not community"
    },
    @{
        OldImport = "@langchain/community/document_loaders/fs/json"
        NewImport = "langchain/document_loaders/fs/json"
        Comment = "# JSONLoader is in langchain package, not community"
    },
    @{
        OldImport = "@langchain/community/document_loaders/fs/directory"
        NewImport = "langchain/document_loaders/fs/directory"
        Comment = "# DirectoryLoader is in langchain package, not community"
    },
    @{
        OldImport = "@langchain/community/document_loaders/fs/buffer"
        NewImport = "langchain/document_loaders/base"
        Comment = "# BufferLoader doesn't exist in v1.0 - use base loader"
    }
)

Write-Host "Fixing document loader import paths..."

$updatedFiles = 0
foreach ($fix in $fixes) {
    Write-Host "`n$($fix.Comment)"
    Write-Host "  Finding: $($fix.OldImport)"
    Write-Host "  Replacing with: $($fix.NewImport)"
    
    $files = Get-ChildItem -Path . -Filter "*.ts" -Recurse -Exclude "*.disabled" | 
        Where-Object { $_.DirectoryName -notlike "*node_modules*" -and $_.DirectoryName -notlike "*dist*" }
    
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if (!$content) { continue }
        
        if ($content -match [regex]::Escape($fix.OldImport)) {
            $newContent = $content -replace [regex]::Escape($fix.OldImport), $fix.NewImport
            Set-Content -Path $file.FullName -Value $newContent -NoNewline
            Write-Host "    Updated: $($file.FullName)"
            $updatedFiles++
        }
    }
}

Write-Host "`nUpdated $updatedFiles file(s)"
