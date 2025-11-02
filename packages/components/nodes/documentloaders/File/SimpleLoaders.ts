import { BaseDocumentLoader } from '@langchain/core/document_loaders/base'
import { Document } from '@langchain/core/documents'
import * as fs from 'fs/promises'

/**
 * Simple TextLoader implementation for LangChain v1.0
 * Replaces the removed @langchain/community/document_loaders/fs/text
 */
export class TextLoader extends BaseDocumentLoader {
    constructor(public filePath: string | Blob) {
        super()
    }

    async load(): Promise<Document[]> {
        let text: string

        if (typeof this.filePath === 'string') {
            text = await fs.readFile(this.filePath, 'utf8')
        } else {
            // Handle Blob
            text = await this.filePath.text()
        }

        const metadata = { source: typeof this.filePath === 'string' ? this.filePath : 'blob' }
        return [new Document({ pageContent: text, metadata })]
    }
}

/**
 * Simple JSONLoader implementation for LangChain v1.0
 * Replaces the removed @langchain/community/document_loaders/fs/json
 */
export class JSONLoader extends BaseDocumentLoader {
    constructor(
        public filePath: string | Blob,
        public pointer?: string
    ) {
        super()
    }

    async load(): Promise<Document[]> {
        let jsonData: any

        if (typeof this.filePath === 'string') {
            const text = await fs.readFile(this.filePath, 'utf8')
            jsonData = JSON.parse(text)
        } else {
            const text = await this.filePath.text()
            jsonData = JSON.parse(text)
        }

        const metadata = { source: typeof this.filePath === 'string' ? this.filePath : 'blob' }

        // If pointer is specified, navigate to that path
        if (this.pointer) {
            const parts = this.pointer.split('/').filter((p) => p)
            for (const part of parts) {
                jsonData = jsonData[part]
            }
        }

        // If jsonData is an array, create a document for each item
        if (Array.isArray(jsonData)) {
            return jsonData.map(
                (item, i) =>
                    new Document({
                        pageContent: typeof item === 'string' ? item : JSON.stringify(item, null, 2),
                        metadata: { ...metadata, seq: i }
                    })
            )
        }

        return [
            new Document({
                pageContent: typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData, null, 2),
                metadata
            })
        ]
    }
}

/**
 * Simple JSONLinesLoader implementation for LangChain v1.0
 * Replaces the removed @langchain/community/document_loaders/fs/json
 */
export class JSONLinesLoader extends BaseDocumentLoader {
    constructor(
        public filePath: string | Blob,
        public pointer?: string
    ) {
        super()
    }

    async load(): Promise<Document[]> {
        let text: string

        if (typeof this.filePath === 'string') {
            text = await fs.readFile(this.filePath, 'utf8')
        } else {
            text = await this.filePath.text()
        }

        const lines = text.split('\n').filter((line) => line.trim())
        const documents: Document[] = []
        const metadata = { source: typeof this.filePath === 'string' ? this.filePath : 'blob' }

        for (let i = 0; i < lines.length; i++) {
            try {
                let jsonData = JSON.parse(lines[i])

                // If pointer is specified, navigate to that path
                if (this.pointer) {
                    const parts = this.pointer.split('/').filter((p) => p)
                    for (const part of parts) {
                        jsonData = jsonData[part]
                    }
                }

                documents.push(
                    new Document({
                        pageContent: typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData, null, 2),
                        metadata: { ...metadata, line: i + 1 }
                    })
                )
            } catch (e) {
                // Skip invalid JSON lines
                console.warn(`Skipping invalid JSON at line ${i + 1}`)
            }
        }

        return documents
    }
}
