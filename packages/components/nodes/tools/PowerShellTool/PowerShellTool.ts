import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { z } from 'zod'
import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'
import { exec } from 'child_process'

const execPromise = promisify(exec)

const DESC = `Executes PowerShell scripts in a sandboxed environment. \
The script should be valid PowerShell code. \
The output of the script will be returned as plain text.`

const NAME = 'powershell_tool'

class PowerShellTool implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]

    constructor() {
        this.label = 'PowerShell Tool'
        this.name = 'powerShellTool'
        this.version = 1.0
        this.type = 'PowerShellTool'
        this.icon = 'PowerShell.svg'
        this.category = 'Tools'
        this.description = 'Execute PowerShell scripts in a sandboxed environment'
        this.baseClasses = [this.type, 'Tool', ...getBaseClasses(PowerShellTool)]
        this.inputs = [
            {
                label: 'Tool Name',
                name: 'toolName',
                type: 'string',
                description: 'Specify the name of the tool',
                default: NAME
            },
            {
                label: 'Tool Description',
                name: 'toolDesc',
                type: 'string',
                rows: 4,
                description: 'Specify the description of the tool',
                default: DESC
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const toolDesc = nodeData.inputs?.toolDesc as string
        const toolName = nodeData.inputs?.toolName as string

        return new PowerShellExecutor({
            description: toolDesc ?? DESC,
            name: toolName ?? NAME,
            schema: z.object({
                input: z.string().describe('PowerShell code to be executed')
            })
        })
    }
}

class PowerShellExecutor {
    name: string
    description: string
    schema: z.ZodObject<any>

    constructor(options: { name: string; description: string; schema: z.ZodObject<any> }) {
        this.name = options.name
        this.description = options.description
        this.schema = options.schema
    }

    async call(arg: z.infer<typeof this.schema>): Promise<{ tool: string; toolInput: string; toolOutput: string }> {
        let parsed
        try {
            parsed = await this.schema.parseAsync(arg)
        } catch (error) {
            parsed = { input: arg }
        }

        // Create a temporary PowerShell script
        const tempScriptPath = path.join(__dirname, `temp_${Date.now()}.ps1`)
        fs.writeFileSync(tempScriptPath, parsed.input)

        try {
            // Execute the PowerShell script using pwsh.exe
            const { stdout, stderr } = await execPromise(`pwsh -File "${tempScriptPath}"`)

            if (stderr) {
                throw new Error(`PowerShell Error: ${stderr}`)
            }

            // Return the output in the expected structure
            return {
                tool: this.name,
                toolInput: parsed.input,
                toolOutput: stdout.trim()
            }
        } catch (error) {
            throw new Error(`Failed to execute PowerShell script: ${error.message}`)
        } finally {
            // Clean up the temporary script
            if (fs.existsSync(tempScriptPath)) {
                fs.unlinkSync(tempScriptPath)
            }
        }
    }
}

module.exports = { nodeClass: PowerShellTool }
