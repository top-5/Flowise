import { vi } from 'vitest'
import { getPhoenixTracer } from './handler'

vi.mock('@opentelemetry/exporter-trace-otlp-proto', () => {
    return {
        OTLPTraceExporter: vi.fn().mockImplementation((args) => {
            return { args }
        })
    }
})

import { OTLPTraceExporter as ProtoOTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'

describe('URL Handling For Phoenix Tracer', () => {
    const apiKey = 'test-api-key'
    const projectName = 'test-project-name'

    const makeOptions = (baseUrl: string) => ({
        baseUrl,
        apiKey,
        projectName,
        enableCallback: false
    })

    beforeEach(() => {
        vi.clearAllMocks()
    })

    const cases: [string, string][] = [
        ['http://localhost:6006', 'http://localhost:6006/v1/traces'],
        ['http://localhost:6006/v1/traces', 'http://localhost:6006/v1/traces'],
        ['https://app.phoenix.arize.com', 'https://app.phoenix.arize.com/v1/traces'],
        ['https://app.phoenix.arize.com/v1/traces', 'https://app.phoenix.arize.com/v1/traces'],
        ['https://app.phoenix.arize.com/s/my-space', 'https://app.phoenix.arize.com/s/my-space/v1/traces'],
        ['https://app.phoenix.arize.com/s/my-space/v1/traces', 'https://app.phoenix.arize.com/s/my-space/v1/traces'],
        ['https://my-phoenix.com/my-slug', 'https://my-phoenix.com/my-slug/v1/traces'],
        ['https://my-phoenix.com/my-slug/v1/traces', 'https://my-phoenix.com/my-slug/v1/traces']
    ]

    it.each(cases)('baseUrl %s - exporterUrl %s', (input, expected) => {
        getPhoenixTracer(makeOptions(input))
        expect(ProtoOTLPTraceExporter).toHaveBeenCalledWith(
            expect.objectContaining({
                url: expected,
                headers: expect.objectContaining({
                    api_key: apiKey,
                    authorization: `Bearer ${apiKey}`
                })
            })
        )
    })
})
