import { Document } from '@langchain/core/documents'
import { BaseDocumentLoader } from '@langchain/core/document_loaders/base'
import * as fs from 'fs/promises'

/**
 * Simple text file loader for LangChain v1.0
 * The generic TextLoader was removed from @langchain/community
 */
export class TextLoader extends BaseDocumentLoader {
    constructor(public filePath: string) {
        super()
    }

    async load(): Promise<Document[]> {
        const text = await fs.readFile(this.filePath, 'utf8')
        const metadata = { source: this.filePath }
        return [new Document({ pageContent: text, metadata })]
    }
}
