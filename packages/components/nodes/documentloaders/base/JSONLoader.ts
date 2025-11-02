import { Document } from '@langchain/core/documents'
import { BaseDocumentLoader } from '@langchain/core/document_loaders/base'
import * as fs from 'fs/promises'

/**
 * Simple JSON file loader for LangChain v1.0
 * The generic JSONLoader was removed from @langchain/community
 */
export class JSONLoader extends BaseDocumentLoader {
    constructor(
        public filePath: string,
        public pointer?: string
    ) {
        super()
    }

    async load(): Promise<Document[]> {
        const text = await fs.readFile(this.filePath, 'utf8')
        const json = JSON.parse(text)

        // If pointer specified, extract that field
        let content = json
        if (this.pointer) {
            const keys = this.pointer.split('.')
            for (const key of keys) {
                content = content?.[key]
            }
        }

        const pageContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
        const metadata = { source: this.filePath }

        return [new Document({ pageContent, metadata })]
    }
}
