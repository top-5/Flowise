import { ICommonObject, INode, INodeData, INodeOutputsValue, INodeParams, IServerSideEventStreamer } from '../../../src/Interface'
import { RetrieverQueryEngine, CompactAndRefine, TreeSummarize, Refine, Metadata, NodeWithScore } from 'llamaindex'
import { reformatSourceDocuments } from '../EngineUtils'
import { EvaluationRunTracerLlama } from '../../../evaluation/EvaluationRunTracerLlama'

class QueryEngine_LlamaIndex implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    tags: string[]
    inputs: INodeParams[]
    outputs: INodeOutputsValue[]
    sessionId?: string

    constructor(fields?: { sessionId?: string }) {
        this.label = 'Query Engine'
        this.name = 'queryEngine'
        this.version = 2.0
        this.type = 'QueryEngine'
        this.icon = 'query-engine.png'
        this.category = 'Engine'
        this.description = 'Simple query engine built to answer question over your data, without memory'
        this.baseClasses = [this.type, 'BaseQueryEngine']
        this.tags = ['LlamaIndex']
        this.inputs = [
            {
                label: 'Vector Store Retriever',
                name: 'vectorStoreRetriever',
                type: 'VectorIndexRetriever'
            },
            // ResponseSynthesizer removed per new LlamaIndex API. Use built-in engine postprocessing.
            {
                label: 'Return Source Documents',
                name: 'returnSourceDocuments',
                type: 'boolean',
                optional: true
            }
        ]
        this.sessionId = fields?.sessionId
    }

    async init(nodeData: INodeData): Promise<any> {
        return prepareEngine(nodeData)
    }

    async run(nodeData: INodeData, input: string, options: ICommonObject): Promise<string | object> {
        const returnSourceDocuments = nodeData.inputs?.returnSourceDocuments as boolean
        const queryEngine = prepareEngine(nodeData)

        let text = ''
        let sourceDocuments: ICommonObject[] = []
        let sourceNodes: NodeWithScore<Metadata>[] = []
        let isStreamingStarted = false

        await EvaluationRunTracerLlama.injectEvaluationMetadata(nodeData, options, queryEngine)

        const shouldStreamResponse = options.shouldStreamResponse
        const sseStreamer: IServerSideEventStreamer = options.sseStreamer as IServerSideEventStreamer
        const chatId = options.chatId

        if (shouldStreamResponse) {
            const stream = await queryEngine.query({ query: input, stream: true })
            for await (const chunk of stream) {
                text += chunk.response
                if (chunk.sourceNodes) sourceNodes = chunk.sourceNodes
                if (!isStreamingStarted) {
                    isStreamingStarted = true
                    if (sseStreamer) {
                        sseStreamer.streamStartEvent(chatId, chunk.response)
                    }
                }
                if (sseStreamer) {
                    sseStreamer.streamTokenEvent(chatId, chunk.response)
                }
            }

            if (returnSourceDocuments) {
                sourceDocuments = reformatSourceDocuments(sourceNodes)
                if (sseStreamer) {
                    sseStreamer.streamSourceDocumentsEvent(chatId, sourceDocuments)
                }
            }
        } else {
            const response = await queryEngine.query({ query: input })
            text = response?.response
            sourceDocuments = reformatSourceDocuments(response?.sourceNodes ?? [])
        }

        if (returnSourceDocuments) return { text, sourceDocuments }
        else return { text }
    }
}

const prepareEngine = (nodeData: INodeData) => {
    const vectorStoreRetriever = nodeData.inputs?.vectorStoreRetriever
    // LlamaIndex v2025+: All response synthesis is internal. No manual ResponseSynthesizer/Builder.
    return new RetrieverQueryEngine(vectorStoreRetriever)
}

module.exports = { nodeClass: QueryEngine_LlamaIndex }
