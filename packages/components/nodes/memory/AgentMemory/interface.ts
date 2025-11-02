import { Checkpoint, CheckpointMetadata } from '@langchain/langgraph'
import { RunnableConfig } from '@langchain/core/runnables'
import { IDatabaseEntity } from '../../../src'
import { DataSource } from 'typeorm'

export type SaverOptions = {
    datasourceOptions: any
    threadId: string
    appDataSource: DataSource
    databaseEntities: IDatabaseEntity
    chatflowid: string
    orgId: string
}

export interface CheckpointTuple {
    config: RunnableConfig
    checkpoint: Checkpoint
    metadata?: CheckpointMetadata
    parentConfig?: RunnableConfig
}

// Simple JSON serializer that implements LangGraph v1.0 SerializerProtocol
// with correct dumpsTyped/loadsTyped API
export class JsonSerializer {
    async dumpsTyped(obj: any): Promise<[string, Uint8Array]> {
        const jsonStr = JSON.stringify(obj)
        return ['json', new TextEncoder().encode(jsonStr)]
    }

    async loadsTyped(_type: string, data: Uint8Array | string): Promise<any> {
        const str = typeof data === 'string' ? data : new TextDecoder().decode(data)
        return JSON.parse(str)
    }

    // Convenience synchronous methods for internal use
    stringify(obj: any): string {
        return JSON.stringify(obj)
    }

    async parse(data: string): Promise<any> {
        return JSON.parse(data)
    }
}
