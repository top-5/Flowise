import { Moderation } from '../Moderation'
import OpenAI from 'openai'

export class OpenAIModerationRunner implements Moderation {
    private openAIApiKey = ''
    private moderationErrorMessage: string = "Text was found that violates OpenAI's content policy."

    constructor(openAIApiKey: string) {
        this.openAIApiKey = openAIApiKey
    }

    async checkForViolations(input: string): Promise<string> {
        if (!this.openAIApiKey) {
            throw Error('OpenAI API key not found')
        }

        // Use OpenAI's moderation API directly (OpenAIModerationChain was removed in v1.0)
        const client = new OpenAI({ apiKey: this.openAIApiKey })
        const moderation = await client.moderations.create({ input })

        if (moderation.results[0].flagged) {
            throw Error(this.moderationErrorMessage)
        }

        return input
    }

    setErrorMessage(message: string) {
        this.moderationErrorMessage = message
    }
}
