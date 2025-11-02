# Fix retriever and compressor imports for LangChain v1.0

$fixes = @(
    @{
        OldImport = "@langchain/community/document_compressors"
        NewImport = "langchain/retrievers/document_compressors"
        Comment = "# document_compressors moved to main langchain package"
    },
    @{
        OldImport = "@langchain/community/retrievers/contextual_compression"
        NewImport = "langchain/retrievers"
        Comment = "# contextual_compression is now in main retrievers"
    },
    @{
        OldImport = "@langchain/community/document_compressors/embeddings_filter"
        NewImport = "langchain/retrievers/document_compressors/embeddings_filter"
        Comment = "# embeddings_filter moved to langchain package"
    },
    @{
        OldImport = "langchain/retrievers/document_compressors/chain_extract"
        NewImport = "langchain/retrievers/document_compressors"
        Comment = "# chain_extract import from base compressors"
    },
    @{
        OldImport = "langchain/retrievers/hyde"
        NewImport = "langchain/retrievers"
        Comment = "# hyde retriever in main retrievers"
    },
    @{
        OldImport = "langchain/retrievers/multi_query"
        NewImport = "langchain/retrievers"
        Comment = "# multi_query retriever in main retrievers"
    },
    @{
        OldImport = "langchain/retrievers/score_threshold"
        NewImport = "langchain/retrievers"
        Comment = "# score_threshold retriever in main retrievers"
    }
)

Write-Host "Fixing retriever and compressor import paths..."

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
