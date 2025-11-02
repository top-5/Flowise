# Fix missing LangChain v1.0 imports

$fixes = @(
    @{
        Pattern = "@langchain/community/storage/in_memory"
        OldImport = "@langchain/community/storage/in_memory"
        NewImport = "@langchain/community/storage/ioredis"
        Comment = "# in_memory storage was removed - using ioredis or commenting out"
    },
    @{
        Pattern = "@langchain/community/document_loaders/text"
        OldImport = "@langchain/community/document_loaders/text"
        NewImport = "@langchain/community/document_loaders/fs/text"
        Comment = "# text loader moved to fs/text"
    },
    @{
        Pattern = "@langchain/community/document_loaders/json"
        OldImport = "@langchain/community/document_loaders/json"
        NewImport = "@langchain/community/document_loaders/fs/json"
        Comment = "# json loader moved to fs/json"
    },
    @{
        Pattern = "@langchain/community/document_loaders/directory"
        OldImport = "@langchain/community/document_loaders/directory"
        NewImport = "@langchain/community/document_loaders/fs/directory"
        Comment = "# directory loader moved to fs/directory"
    },
    @{
        Pattern = "@langchain/community/document_loaders/buffer"
        OldImport = "@langchain/community/document_loaders/buffer"
        NewImport = "@langchain/community/document_loaders/fs/buffer"
        Comment = "# buffer loader moved to fs/buffer"
    },
    @{
        Pattern = "@langchain/community/utils/sql_db"
        OldImport = "@langchain/community/utils/sql_db"
        NewImport = "@langchain/community/tools/sql"
        Comment = "# sql_db moved to tools/sql"
    },
    @{
        Pattern = "@langchain/community/types/ibm"
        OldImport = "@langchain/community/types/ibm"
        NewImport = "@langchain/community/utils/ibm"
        Comment = "# ibm types moved to utils/ibm"
    },
    @{
        Pattern = "@langchain/community/llms/ollama"
        OldImport = "@langchain/community/llms/ollama"
        NewImport = "@langchain/ollama"
        Comment = "# ollama moved to separate package @langchain/ollama"
    },
    @{
        Pattern = "@langchain/community/dist/utils/bedrock"
        OldImport = "@langchain/community/dist/utils/bedrock"
        NewImport = "@langchain/aws"
        Comment = "# bedrock utilities moved to @langchain/aws package"
    },
    @{
        Pattern = "langchain/memory/buffer_memory"
        OldImport = "langchain/memory/buffer_memory"
        NewImport = "@langchain/langgraph/checkpoint/memory"
        Comment = "# BufferMemory is now part of langgraph checkpoint system"
    },
    @{
        Pattern = "langchain/retrievers/hyde"
        OldImport = "langchain/retrievers/hyde"
        NewImport = "@langchain/community/retrievers/hyde"
        Comment = "# hyde retriever moved to community package"
    },
    @{
        Pattern = "langchain/retrievers/multi_query"
        OldImport = "langchain/retrievers/multi_query"
        NewImport = "@langchain/community/retrievers/multi_query"
        Comment = "# multi_query retriever moved to community package"
    },
    @{
        Pattern = "langchain/retrievers/score_threshold"
        OldImport = "langchain/retrievers/score_threshold"
        NewImport = "@langchain/community/retrievers/score_threshold"
        Comment = "# score_threshold retriever moved to community package"
    },
    @{
        Pattern = "langchain/retrievers/document_compressors/chain_extract"
        OldImport = "langchain/retrievers/document_compressors/chain_extract"
        NewImport = "@langchain/community/retrievers/document_compressors/chain_extract"
        Comment = "# chain_extract moved to community package"
    }
)

Write-Host "Fixing missing LangChain v1.0 imports..."

$updatedFiles = 0
foreach ($fix in $fixes) {
    Write-Host "`n$($fix.Comment)"
    Write-Host "  Finding: $($fix.OldImport)"
    Write-Host "  Replacing with: $($fix.NewImport)"
    
    $files = Get-ChildItem -Path . -Filter "*.ts" -Recurse -Exclude "*.disabled" | 
        Where-Object { $_.DirectoryName -notlike "*node_modules*" }
    
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
