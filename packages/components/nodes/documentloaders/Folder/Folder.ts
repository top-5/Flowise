import { omit } from 'lodash'
import { INode, INodeData, INodeOutputsValue, INodeParams } from '../../../src/Interface'
import { TextSplitter } from '@langchain/textsplitters'
import { BaseDocumentLoader } from '@langchain/core/document_loaders/base'
import { TextLoader } from '@langchain/classic/document_loaders/fs/text'
import { DirectoryLoader } from '@langchain/classic/document_loaders/fs/directory'
import { JSONLinesLoader, JSONLoader } from '@langchain/classic/document_loaders/fs/json'
import { CSVLoader } from '@langchain/community/document_loaders/fs/csv'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx'
import { LoadOfSheet } from '../MicrosoftExcel/ExcelLoader'
import { PowerpointLoader } from '../MicrosoftPowerpoint/PowerpointLoader'
import { handleEscapeCharacters } from '../../../src/utils'
import { isPathTraversal } from '../../../src/validator'

class Folder_DocumentLoaders implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]
    outputs: INodeOutputsValue[]

    constructor() {
        this.label = 'Folder with Files'
        this.name = 'folderFiles'
        this.version = 4.0
        this.type = 'Document'
        this.icon = 'folder.svg'
        this.category = 'Document Loaders'
        this.description = `Load data from folder with multiple files`
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Folder Path',
                name: 'folderPath',
                type: 'string',
                placeholder: ''
            },
            {
                label: 'Recursive',
                name: 'recursive',
                type: 'boolean',
                additionalParams: false
            },
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Pdf Usage',
                name: 'pdfUsage',
                type: 'options',
                description: 'Only when loading PDF files',
                options: [
                    {
                        label: 'One document per page',
                        name: 'perPage'
                    },
                    {
                        label: 'One document per file',
                        name: 'perFile'
                    }
                ],
                default: 'perPage',
                optional: true,
                additionalParams: true
            },
            {
                label: 'JSONL Pointer Extraction',
                name: 'pointerName',
                type: 'string',
                description: 'Only when loading JSONL files',
                placeholder: '<pointerName>',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Additional Metadata',
                name: 'metadata',
                type: 'json',
                description: 'Additional metadata to be added to the extracted documents',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Omit Metadata Keys',
                name: 'omitMetadataKeys',
                type: 'string',
                rows: 4,
                description:
                    'Each document loader comes with a default set of metadata keys that are extracted from the document. You can use this field to omit some of the default metadata keys. The value should be a list of keys, seperated by comma. Use * to omit all metadata keys execept the ones you specify in the Additional Metadata field',
                placeholder: 'key1, key2, key3.nestedKey1',
                optional: true,
                additionalParams: true
            }
        ]
        this.outputs = [
            {
                label: 'Document',
                name: 'document',
                description: 'Array of document objects containing metadata and pageContent',
                baseClasses: [...this.baseClasses, 'json']
            },
            {
                label: 'Text',
                name: 'text',
                description: 'Concatenated string from pageContent of documents',
                baseClasses: ['string', 'json']
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const textSplitter = nodeData.inputs?.textSplitter as TextSplitter
        const folderPath = nodeData.inputs?.folderPath as string
        const metadata = nodeData.inputs?.metadata
        const recursive = nodeData.inputs?.recursive as boolean
        const pdfUsage = nodeData.inputs?.pdfUsage
        const pointerName = nodeData.inputs?.pointerName as string
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys as string
        const output = nodeData.outputs?.output as string

        if (!folderPath) {
            throw new Error('Folder path is required')
        }

        if (isPathTraversal(folderPath)) {
            throw new Error('Invalid folder path: Path traversal detected. Please provide a safe folder path.')
        }

        let omitMetadataKeys: string[] = []
        if (_omitMetadataKeys) {
            omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim())
        }

        const loader = new DirectoryLoader(
            folderPath,
            {
                '.json': (path) => new JSONLoader(path) as any,
                '.jsonl': (blob) => new JSONLinesLoader(blob, '/' + pointerName.trim()) as any,
                '.txt': (path) => new TextLoader(path) as any,
                '.csv': (path) => new CSVLoader(path) as any,
                '.xls': (path) => new LoadOfSheet(path) as any,
                '.xlsx': (path) => new LoadOfSheet(path) as any,
                '.xlsm': (path) => new LoadOfSheet(path) as any,
                '.xlsb': (path) => new LoadOfSheet(path) as any,
                '.doc': (path) => new DocxLoader(path) as any,
                '.docx': (path) => new DocxLoader(path) as any,
                '.ppt': (path) => new PowerpointLoader(path) as any,
                '.pptx': (path) => new PowerpointLoader(path) as any,
                '.pdf': (path) =>
                    (pdfUsage === 'perFile'
                        ? // @ts-ignore
                          new PDFLoader(path, { splitPages: false, pdfjs: () => import('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js') })
                        : // @ts-ignore
                          new PDFLoader(path, { pdfjs: () => import('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js') })) as any,
                '.aspx': (path) => new TextLoader(path) as any,
                '.asp': (path) => new TextLoader(path) as any,
                '.cpp': (path) => new TextLoader(path) as any, // C++
                '.c': (path) => new TextLoader(path) as any,
                '.cs': (path) => new TextLoader(path) as any,
                '.css': (path) => new TextLoader(path) as any,
                '.go': (path) => new TextLoader(path) as any, // Go
                '.h': (path) => new TextLoader(path) as any, // C++ Header files
                '.kt': (path) => new TextLoader(path) as any, // Kotlin
                '.java': (path) => new TextLoader(path) as any, // Java
                '.js': (path) => new TextLoader(path) as any, // JavaScript
                '.less': (path) => new TextLoader(path) as any, // Less files
                '.ts': (path) => new TextLoader(path) as any, // TypeScript
                '.php': (path) => new TextLoader(path) as any, // PHP
                '.proto': (path) => new TextLoader(path) as any, // Protocol Buffers
                '.python': (path) => new TextLoader(path) as any, // Python
                '.py': (path) => new TextLoader(path) as any, // Python
                '.rst': (path) => new TextLoader(path) as any, // reStructuredText
                '.ruby': (path) => new TextLoader(path) as any, // Ruby
                '.rb': (path) => new TextLoader(path) as any, // Ruby
                '.rs': (path) => new TextLoader(path) as any, // Rust
                '.scala': (path) => new TextLoader(path) as any, // Scala
                '.sc': (path) => new TextLoader(path) as any, // Scala
                '.scss': (path) => new TextLoader(path) as any, // Sass
                '.sol': (path) => new TextLoader(path) as any, // Solidity
                '.sql': (path) => new TextLoader(path) as any, //SQL
                '.swift': (path) => new TextLoader(path) as any, // Swift
                '.markdown': (path) => new TextLoader(path) as any, // Markdown
                '.md': (path) => new TextLoader(path) as any, // Markdown
                '.tex': (path) => new TextLoader(path) as any, // LaTeX
                '.ltx': (path) => new TextLoader(path) as any, // LaTeX
                '.html': (path) => new TextLoader(path) as any, // HTML
                '.vb': (path) => new TextLoader(path) as any, // Visual Basic
                '.xml': (path) => new TextLoader(path) as any // XML
            },
            recursive
        ) as any as BaseDocumentLoader
        let docs = []

        if (textSplitter) {
            docs = await loader.load()
            docs = await textSplitter.splitDocuments(docs)
        } else {
            docs = await loader.load()
        }

        if (metadata) {
            const parsedMetadata = typeof metadata === 'object' ? metadata : JSON.parse(metadata)
            docs = docs.map((doc) => ({
                ...doc,
                metadata:
                    _omitMetadataKeys === '*'
                        ? {
                              ...parsedMetadata
                          }
                        : omit(
                              {
                                  ...doc.metadata,
                                  ...parsedMetadata
                              },
                              omitMetadataKeys
                          )
            }))
        } else {
            docs = docs.map((doc) => ({
                ...doc,
                metadata:
                    _omitMetadataKeys === '*'
                        ? {}
                        : omit(
                              {
                                  ...doc.metadata
                              },
                              omitMetadataKeys
                          )
            }))
        }

        if (output === 'document') {
            return docs
        } else {
            let finaltext = ''
            for (const doc of docs) {
                finaltext += `${doc.pageContent}\n`
            }
            return handleEscapeCharacters(finaltext, false)
        }
    }
}

module.exports = { nodeClass: Folder_DocumentLoaders }
