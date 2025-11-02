import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeOutputsValue, INodeParams } from '../../../src/Interface'
import {
    getCredentialData,
    getCredentialParam,
    handleDocumentLoaderDocuments,
    handleDocumentLoaderMetadata,
    handleDocumentLoaderOutput
} from '../../../src/utils'
import { S3Client, GetObjectCommand, S3ClientConfig, ListObjectsV2Command, ListObjectsV2Output } from '@aws-sdk/client-s3'
import { getRegions, MODEL_TYPE } from '../../../src/modelLoader'
import { Readable } from 'node:stream'
import * as fsDefault from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'

import { BaseDocumentLoader } from '@langchain/core/document_loaders/base'
import { DirectoryLoader } from '@langchain/classic/document_loaders/fs/directory'
import { JSONLoader } from '@langchain/classic/document_loaders/fs/json'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { TextLoader } from '@langchain/classic/document_loaders/fs/text'
import { TextSplitter } from '@langchain/textsplitters'
import { CSVLoader } from '../Csv/CsvLoader'
import { LoadOfSheet } from '../MicrosoftExcel/ExcelLoader'
import { PowerpointLoader } from '../MicrosoftPowerpoint/PowerpointLoader'
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx'
class S3_DocumentLoaders implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    credential: INodeParams
    inputs?: INodeParams[]
    outputs: INodeOutputsValue[]

    constructor() {
        this.label = 'S3 Directory'
        this.name = 's3Directory'
        this.version = 4.0
        this.type = 'Document'
        this.icon = 's3.svg'
        this.category = 'Document Loaders'
        this.description = 'Load Data from S3 Buckets'
        this.baseClasses = [this.type]
        this.credential = {
            label: 'Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['awsApi'],
            optional: true
        }
        this.inputs = [
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Bucket',
                name: 'bucketName',
                type: 'string'
            },
            {
                label: 'Region',
                name: 'region',
                type: 'asyncOptions',
                loadMethod: 'listRegions',
                default: 'us-east-1'
            },
            {
                label: 'Server URL',
                name: 'serverUrl',
                description:
                    'The fully qualified endpoint of the webservice. This is only for using a custom endpoint (for example, when using a local version of S3).',
                type: 'string',
                optional: true
            },
            {
                label: 'Prefix',
                name: 'prefix',
                type: 'string',
                description: 'Limits the response to keys that begin with the specified prefix',
                placeholder: 'TestFolder/Something',
                optional: true
            },
            {
                label: 'Pdf Usage',
                name: 'pdfUsage',
                type: 'options',
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

    loadMethods = {
        async listRegions(): Promise<INodeOptionsValue[]> {
            return await getRegions(MODEL_TYPE.CHAT, 'awsChatBedrock')
        }
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const textSplitter = nodeData.inputs?.textSplitter as TextSplitter
        const bucketName = nodeData.inputs?.bucketName as string
        const prefix = nodeData.inputs?.prefix as string
        const region = nodeData.inputs?.region as string
        const serverUrl = nodeData.inputs?.serverUrl as string
        const pdfUsage = nodeData.inputs?.pdfUsage
        const metadata = nodeData.inputs?.metadata
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys as string
        const output = nodeData.outputs?.output as string

        let credentials: S3ClientConfig['credentials'] | undefined

        if (nodeData.credential) {
            const credentialData = await getCredentialData(nodeData.credential, options)
            const accessKeyId = getCredentialParam('awsKey', credentialData, nodeData)
            const secretAccessKey = getCredentialParam('awsSecret', credentialData, nodeData)

            if (accessKeyId && secretAccessKey) {
                credentials = {
                    accessKeyId,
                    secretAccessKey
                }
            }
        }

        let s3Config: S3ClientConfig = {
            region: region,
            credentials: credentials
        }

        if (serverUrl) {
            s3Config = {
                region: region,
                credentials: credentials,
                endpoint: serverUrl,
                forcePathStyle: true
            }
        }

        const tempDir = fsDefault.mkdtempSync(path.join(os.tmpdir(), 's3fileloader-'))

        try {
            const s3Client = new S3Client(s3Config)

            const listObjectsOutput: ListObjectsV2Output = await s3Client.send(
                new ListObjectsV2Command({
                    Bucket: bucketName,
                    Prefix: prefix
                })
            )

            const keys: string[] = (listObjectsOutput?.Contents ?? []).filter((item) => item.Key && item.ETag).map((item) => item.Key!)

            await Promise.all(
                keys.map(async (key) => {
                    const filePath = path.join(tempDir, key)
                    try {
                        const response = await s3Client.send(
                            new GetObjectCommand({
                                Bucket: bucketName,
                                Key: key
                            })
                        )

                        const objectData = await new Promise<Buffer>((resolve, reject) => {
                            const chunks: Buffer[] = []

                            if (response.Body instanceof Readable) {
                                response.Body.on('data', (chunk: Buffer) => chunks.push(chunk))
                                response.Body.on('end', () => resolve(Buffer.concat(chunks)))
                                response.Body.on('error', reject)
                            } else {
                                reject(new Error('Response body is not a readable stream.'))
                            }
                        })

                        // create the directory if it doesnt already exist
                        fsDefault.mkdirSync(path.dirname(filePath), { recursive: true })

                        // write the file to the directory
                        fsDefault.writeFileSync(filePath, objectData)
                    } catch (e: any) {
                        throw new Error(`Failed to download file ${key} from S3 bucket ${bucketName}: ${e.message}`)
                    }
                })
            )

            const loader = new DirectoryLoader(
                tempDir,
                {
                    '.json': (path) => new JSONLoader(path) as any,
                    '.txt': (path) => new TextLoader(path) as any,
                    '.csv': (path) => new CSVLoader(path) as any,
                    '.xls': (path) => new LoadOfSheet(path) as any,
                    '.xlsx': (path) => new LoadOfSheet(path) as any,
                    '.xlsm': (path) => new LoadOfSheet(path) as any,
                    '.xlsb': (path) => new LoadOfSheet(path) as any,
                    '.docx': (path) => new DocxLoader(path) as any,
                    '.ppt': (path) => new PowerpointLoader(path) as any,
                    '.pptx': (path) => new PowerpointLoader(path) as any,
                    '.pdf': (path) =>
                        new PDFLoader(path, {
                            splitPages: pdfUsage !== 'perFile',
                            // @ts-ignore
                            pdfjs: () => import('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js')
                        }) as any,
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
                true
            ) as any as BaseDocumentLoader

            let docs = await handleDocumentLoaderDocuments(loader, textSplitter)

            docs = handleDocumentLoaderMetadata(docs, _omitMetadataKeys, metadata)

            return handleDocumentLoaderOutput(docs, output)
        } catch (e: any) {
            throw new Error(`Failed to load data from bucket ${bucketName}: ${e.message}`)
        } finally {
            // remove the temp directory before returning docs
            fsDefault.rmSync(tempDir, { recursive: true })
        }
    }
}
module.exports = { nodeClass: S3_DocumentLoaders }
