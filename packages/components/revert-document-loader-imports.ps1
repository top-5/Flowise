# Revert document loader imports back to @langchain/community

$fixes = @(
    @{
        OldImport = "langchain/document_loaders/fs/text"
        NewImport = "@langchain/community/document_loaders/fs/text"
        Comment = "# Reverting TextLoader back to community package"
    },
    @{
        OldImport = "langchain/document_loaders/fs/json"
        NewImport = "@langchain/community/document_loaders/fs/json"
        Comment = "# Reverting JSONLoader back to community package"
    },
    @{
        OldImport = "langchain/document_loaders/fs/directory"
        NewImport = "@langchain/community/document_loaders/fs/directory"
        Comment = "# Reverting DirectoryLoader back to community package"
    },
    @{
        OldImport = "langchain/document_loaders/base"
        NewImport = "@langchain/community/document_loaders/fs/buffer"
        Comment = "# Reverting BufferLoader back to community package"
    }
)

Write-Host "Reverting document loader import paths..."

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

Write-Host "`nReverted $updatedFiles file(s)"
