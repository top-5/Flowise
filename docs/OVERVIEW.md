# Flowise Architecture & Node Ecosystem Overview

**Version:** 3.0.8  
**Last Updated:** 2025  
**Focus:** AI Agents, LangChain/LangGraph Integration, OpenAI, Anthropic, Memory, Embeddings, MCP Tools

---

## Table of Contents

1. [Introduction](#introduction)
2. [Minimal Core Stack](#minimal-core-stack)
3. [Architecture Overview](#architecture-overview)
4. [Flow Format Specification](#flow-format-specification)
5. [Python Portability Analysis](#python-portability-analysis)
6. [Node Ecosystem](#node-ecosystem)
7. [MCP Tools Coverage](#mcp-tools-coverage)

---

## Introduction

**Flowise** is an open-source, low-code platform for building customized LLM orchestration flows and AI agents. It provides a visual drag-and-drop interface to create AI workflows powered by **LangChain** and **LangGraph**.

### Key Characteristics

- **Built on LangChain/LangGraph**: All nodes are LangChain-compatible components
- **Visual Flow Builder**: React Flow-based UI for creating AI workflows
- **Type System**: TypeScript with strict mode compliance
- **Monorepo Architecture**: pnpm workspaces with Turbo orchestration
- **Agent-First Design**: Supports multi-agent systems, tool calling, and stateful workflows
- **Flow Types**: 
  - `CHATFLOW` - Simple conversational chains
  - `AGENTFLOW` - Legacy agent implementations
  - `AGENTFLOW_V2` - LangGraph-based stateful agent workflows
  - `MULTIAGENT` - Multi-agent orchestration
  - `ASSISTANT` - OpenAI/Azure assistant integration

---

## Minimal Core Stack

For running AI agents with **LangChain/LangGraph**, **OpenAI**, and **Anthropic**, the minimal required nodes are:

### Essential Components (Core Stack)

| Category | Node | Purpose | Priority |
|----------|------|---------|----------|
| **Chat Models** | ChatOpenAI | OpenAI GPT models (GPT-4, GPT-3.5) | **CORE** |
| **Chat Models** | ChatAnthropic | Anthropic Claude models | **CORE** |
| **Agents** | OpenAI Function Agent | Function calling with OpenAI models | **CORE** |
| **Agents** | ReAct Agent | Reasoning + Acting agent pattern | **CORE** |
| **Agent Flows** | Start Node | Entry point for AgentflowV2 | **CORE** |
| **Agent Flows** | Agent Node | LangGraph agent execution | **CORE** |
| **Agent Flows** | LLM Node | LangGraph LLM calling | **CORE** |
| **Agent Flows** | Tool Node | LangGraph tool execution | **CORE** |
| **Memory** | Buffer Memory | Simple conversation history | **CORE** |
| **Memory** | Conversation Summary Memory | Summarized conversation history | **CORE** |
| **Embeddings** | OpenAI Embeddings | OpenAI text embeddings | **CORE** |
| **Vector Stores** | In-Memory Vector Store | Simple in-memory storage | **CORE** |
| **Vector Stores** | Pinecone | Production vector database | **CORE** |
| **Tools** | Calculator | Basic math operations | **CORE** |
| **Tools** | Custom Tool | User-defined tools | **CORE** |
| **Tools (MCP)** | Custom MCP | MCP server integration | **CORE** |
| **Prompts** | Chat Prompt Template | Prompt management | **CORE** |
| **Chains** | Conversation Chain | Basic conversational flow | **CORE** |

### Optional Components (Extended Stack)

| Category | Nodes | When Needed |
|----------|-------|-------------|
| **LLMs** | OpenAI, Anthropic, Azure OpenAI | Legacy completion APIs |
| **Memory** | Redis Memory, Upstash Redis | Production persistence |
| **Vector Stores** | Chroma, Astra, PostgreSQL | Alternative vector DBs |
| **Document Loaders** | PDF, Text, JSON, CSV | Document processing |
| **Text Splitters** | Character, Recursive, Token | Chunking documents |
| **Retrievers** | Vector Store Retriever, Multi Query | RAG applications |
| **Tools** | Web Browser, Search APIs, Gmail | Extended functionality |
| **Multi Agents** | Supervisor, Worker | Multi-agent orchestration |
| **Sequential Agents** | Sequential Supervisor | Sequential workflows |

### Third-Party Integrations (Optional)

These are **NOT** core to basic AI agent functionality:

- **Vector Stores**: Couchbase ❌ (disabled), Qdrant, Weaviate, Milvus
- **Memory**: Zep Cloud ❌ (disabled), Momento, Motorhead
- **Tools**: Tavily Search ❌ (disabled), Composio, Jira, Teams, Outlook
- **Analytics**: LangSmith, LangWatch, Lunary
- **Document Loaders**: Airtable, Confluence, Notion, GitHub

---

## Architecture Overview

### Monorepo Structure

```
Flowise/
├── packages/
│   ├── components/        # Node implementations (25 categories, 267 nodes)
│   ├── server/            # Backend API (Express.js, TypeScript)
│   ├── ui/                # Frontend (React, Vite, Material-UI)
│   └── api-documentation/ # OpenAPI docs
├── docker/                # Docker configurations
├── docs/                  # Documentation
└── package.json           # Root workspace config
```

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Runtime** | Node.js | 18+ (testing v24.9.0) | JavaScript runtime |
| **Package Manager** | pnpm | 9.x | Workspace management |
| **Build** | Turbo | 2.6.0 | Monorepo orchestration |
| **Language** | TypeScript | 5.9.3 | Type-safe development |
| **Frontend** | React | 18+ | UI framework |
| **Frontend Build** | Vite | Latest | Fast dev server & bundler |
| **Backend** | Express.js | Latest | API server |
| **AI Framework** | LangChain | Latest | AI orchestration core |
| **AI Framework** | LangGraph | Latest | Stateful agent workflows |
| **Testing** | Vitest | 4.0.6 | Unit & integration tests |
| **Vector DBs** | Pinecone, Chroma, etc. | Various | Embedding storage |
| **LLM Providers** | OpenAI, Anthropic, etc. | Various | Language models |

### LangChain/LangGraph Integration

Flowise is fundamentally **built on LangChain and LangGraph**:

- **All nodes** are LangChain components (models, chains, agents, tools, retrievers, etc.)
- **AgentflowV2** uses LangGraph's `StateGraph` for stateful workflows
- **Message-based communication**: `HumanMessage`, `AIMessage`, `ToolMessage`, `SystemMessage`
- **Runnable interface**: All components implement LangChain's `Runnable` for LCEL chaining
- **State management**: TypedDict schemas with reducer functions for state updates
- **Tool calling**: Follows LangChain's tool decorator pattern and JSON schema definitions

---

## Flow Format Specification

Flowise flows are stored as JSON documents following the **React Flow** paradigm with LangChain-specific extensions.

### Core Interfaces

```typescript
// Node structure
interface IReactFlowNode {
    id: string                    // Unique node identifier
    position: { x: number, y: number }  // Canvas position
    type: string                  // Node type (e.g., "customNode")
    data: INodeData               // Node-specific configuration
    positionAbsolute: { x: number, y: number }
    z: number                     // Z-index for layering
    handleBounds: {               // Connection handles
        source: any
        target: any
    }
    width: number
    height: number
    selected: boolean
    dragging: boolean
    parentNode?: string           // For nested nodes
    extent?: string               // Constraint boundaries
}

// Edge/connection structure
interface IReactFlowEdge {
    source: string                // Source node ID
    sourceHandle: string          // Output anchor ID
    target: string                // Target node ID
    targetHandle: string          // Input anchor ID
    type: string                  // Edge type
    id: string                    // Unique edge identifier
    data: {
        label: string             // Visual label
    }
}

// Complete flow
interface IReactFlowObject {
    nodes: IReactFlowNode[]       // All nodes in flow
    edges: IReactFlowEdge[]       // All connections
    viewport: {                   // Canvas viewport state
        x: number
        y: number
        zoom: number
    }
}

// Node data structure
interface INodeData {
    label: string                 // Display name
    name: string                  // Internal identifier
    version: number               // Node version
    type: string                  // Node type
    category: string              // Category classification
    description: string           // Node description
    baseClasses: string[]         // LangChain base classes
    inputs: INodeParams[]         // Input parameters
    outputs: INodeParams[]        // Output parameters
    inputAnchors: INodeParams[]   // Visual input connections
    outputAnchors: INodeParams[]  // Visual output connections
    inputParams: INodeParams[]    // Configuration parameters
}
```

### Flow Types

1. **CHATFLOW**: Simple conversational chains
   - Linear or branching node execution
   - No complex state management
   - Best for basic Q&A, RAG

2. **AGENTFLOW** (Legacy): Traditional agent implementations
   - Single-agent workflows
   - Tool calling and reasoning
   - Being superseded by AgentflowV2

3. **AGENTFLOW_V2**: LangGraph-based stateful workflows
   - Uses LangGraph `StateGraph`
   - State persistence with checkpointers
   - Supports conditional edges, loops, human-in-the-loop
   - Multi-step reasoning and planning
   - **Recommended for new agent workflows**

4. **MULTIAGENT**: Multi-agent orchestration
   - Supervisor-worker patterns
   - Agent handoff and routing
   - Hierarchical team structures

### Example Flow JSON

```json
{
    "nodes": [
        {
            "id": "chatOpenAI_0",
            "type": "customNode",
            "position": { "x": 400, "y": 200 },
            "data": {
                "label": "ChatOpenAI",
                "name": "chatOpenAI",
                "version": 6.0,
                "category": "Chat Models",
                "description": "Wrapper around OpenAI large language models",
                "baseClasses": ["BaseChatModel", "BaseLanguageModel"],
                "inputs": {
                    "model": "gpt-4",
                    "temperature": 0.7,
                    "streaming": true
                },
                "inputAnchors": [],
                "outputAnchors": [
                    {
                        "id": "chatOpenAI_0-output-chatOpenAI-ChatOpenAI|BaseChatModel",
                        "name": "chatOpenAI",
                        "label": "ChatOpenAI",
                        "type": "ChatOpenAI | BaseChatModel"
                    }
                ]
            }
        },
        {
            "id": "bufferMemory_0",
            "type": "customNode",
            "position": { "x": 400, "y": 400 },
            "data": {
                "label": "Buffer Memory",
                "name": "bufferMemory",
                "category": "Memory",
                "inputs": {
                    "memoryKey": "chat_history",
                    "sessionId": "user-123"
                }
            }
        }
    ],
    "edges": [
        {
            "source": "bufferMemory_0",
            "sourceHandle": "bufferMemory_0-output",
            "target": "chatOpenAI_0",
            "targetHandle": "chatOpenAI_0-input-memory",
            "id": "bufferMemory_0-chatOpenAI_0"
        }
    ],
    "viewport": {
        "x": 0,
        "y": 0,
        "zoom": 1
    }
}
```

### Key Format Details

- **Nodes**: Self-contained components with inputs/outputs
- **Edges**: Define data flow between nodes
- **Type System**: LangChain base classes ensure compatibility
- **Serialization**: Full flow state can be saved/loaded as JSON
- **Execution**: Server parses JSON, instantiates LangChain objects, builds execution graph

---

## Python Portability Analysis

### Can Flowise Flows Run with Python LangChain/LangGraph?

**Short Answer**: Partially possible with significant conversion effort.

### Technical Considerations

#### ✅ **What Works**

1. **Conceptual Compatibility**:
   - Flowise nodes map directly to Python LangChain components
   - LangGraph StateGraph exists in both TypeScript and Python
   - Message types (`HumanMessage`, `AIMessage`, etc.) are identical
   - Tool calling patterns are similar

2. **Shared Primitives**:
   - LLM providers (OpenAI, Anthropic) have Python SDKs
   - Vector stores (Pinecone, Chroma) support Python
   - Document loaders and text splitters exist in Python
   - Embedding models available in Python

3. **State Management**:
   - Python LangGraph uses `TypedDict` for state (same pattern)
   - Reducer functions work identically
   - Checkpointers and stores have Python equivalents

#### ⚠️ **Challenges**

1. **No Direct JSON Import**:
   - Flowise JSON format is TypeScript-specific
   - Python LangChain doesn't natively parse Flowise JSON
   - Would need custom converter tool

2. **Node-Specific Logic**:
   - Each Flowise node has TypeScript implementation logic
   - Would need to manually recreate in Python
   - Some nodes may not have Python equivalents

3. **Configuration Mapping**:
   - Input parameters differ between TS and Python APIs
   - Credentials and environment variables handled differently
   - Would need parameter translation layer

4. **Execution Model**:
   - Flowise has custom node execution engine
   - Python would use native LangGraph execution
   - Behavioral differences possible

### Conversion Workflow

To run a Flowise flow in Python LangChain/LangGraph:

#### Step 1: Export Flow JSON
```typescript
// Get flow from Flowise API
const flow = await fetch('/api/v1/chatflows/{id}')
const flowData = JSON.parse(flow.flowData)
```

#### Step 2: Parse Nodes and Edges
```python
import json

# Load Flowise flow JSON
with open('flowise_flow.json') as f:
    flow = json.load(f)

nodes = flow['nodes']
edges = flow['edges']
```

#### Step 3: Map Nodes to Python Components
```python
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langgraph.graph import StateGraph, MessagesState

# Example: Convert ChatOpenAI node
for node in nodes:
    if node['data']['name'] == 'chatOpenAI':
        model = ChatOpenAI(
            model=node['data']['inputs'].get('model', 'gpt-4'),
            temperature=node['data']['inputs'].get('temperature', 0.7)
        )
    elif node['data']['name'] == 'bufferMemory':
        memory = ConversationBufferMemory(
            memory_key=node['data']['inputs'].get('memoryKey', 'chat_history')
        )
```

#### Step 4: Build LangGraph StateGraph
```python
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Annotated
from langchain_core.messages import HumanMessage, AIMessage

# Define state schema
class AgentState(TypedDict):
    messages: Annotated[list, "Conversation messages"]
    
# Build graph based on edges
builder = StateGraph(AgentState)

# Add nodes (converted from Flowise)
def call_model(state: AgentState):
    response = model.invoke(state['messages'])
    return {"messages": [response]}

builder.add_node("model", call_model)
builder.add_edge(START, "model")
builder.add_edge("model", END)

graph = builder.compile()
```

#### Step 5: Execute
```python
# Run the graph
result = await graph.ainvoke({
    "messages": [HumanMessage(content="Hello!")]
})
```

### Conversion Tools Needed

To make this practical, you would need to build:

1. **Flowise-to-Python Converter**:
   - Parse Flowise JSON schema
   - Map node types to Python classes
   - Generate Python code automatically

2. **Parameter Translator**:
   - Convert TypeScript configs to Python kwargs
   - Handle credential mapping
   - Translate environment variables

3. **Execution Engine**:
   - Interpret edge connections as StateGraph edges
   - Handle conditional routing
   - Manage loops and cycles

### Alternative: Use Flowise Backend API

**Easier approach**: Instead of converting flows to Python, use Flowise as a service:

```python
import requests

# Call Flowise API from Python
response = requests.post(
    'http://localhost:3000/api/v1/prediction/{chatflowId}',
    json={
        "question": "What is the weather?",
        "overrideConfig": {
            "model": "gpt-4"
        }
    }
)

print(response.json())
```

### Recommendation

- **For simple flows**: Manual conversion to Python LangGraph is feasible
- **For complex flows**: Too much effort; use Flowise API instead
- **For learning**: Great exercise to understand LangChain/LangGraph concepts
- **For production**: Keep Flowise flows in Flowise; call via API

---

## Node Ecosystem

Total: **267 nodes** across **25 categories**

### 1. Agent Flows (15 nodes) - **CORE**

AgentflowV2 components for building LangGraph stateful workflows.

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| Start | LangGraph | Entry point for agent workflow | **CORE** |
| Agent | LangGraph, LangChain | Execute agent with tools and memory | **CORE** |
| LLM | LangGraph, LangChain | Call language model in workflow | **CORE** |
| Tool | LangGraph, LangChain Tools | Execute tool function | **CORE** |
| Condition | LangGraph | Conditional routing based on state | **CORE** |
| Loop | LangGraph | Iterative execution with state | **CORE** |
| End | LangGraph | Terminal node for workflow | **CORE** |
| Set Variable | LangGraph State | Update state variables | OPTIONAL |
| Sticky Note | UI Only | Visual annotation (no execution) | OPTIONAL |
| Human Input | LangGraph Interrupt | Pause for human feedback | OPTIONAL |
| Custom Function | JavaScript/Python | Execute custom code | OPTIONAL |
| Retriever | LangChain Retrievers | Document retrieval in workflow | OPTIONAL |
| Vector Store Upsert | LangChain Vector Stores | Add documents to vector DB | OPTIONAL |
| Vector Store Query | LangChain Vector Stores | Query vector database | OPTIONAL |
| Iteration | LangGraph | Iterate over collections | OPTIONAL |

**Key Insight**: These nodes map directly to LangGraph concepts:
- `StateGraph` with `START` and `END` nodes
- State-based routing with `Condition`
- Human-in-the-loop with `interrupt()`
- Tool calling and agent execution

---

### 2. Agents (11 nodes) - **CORE**

Traditional agent implementations (some legacy).

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| OpenAI Function Agent | LangChain, OpenAI Function Calling | Agent using OpenAI function calling | **CORE** |
| ReAct Agent | LangChain ReAct | Reasoning and Acting agent | **CORE** |
| Conversational Agent | LangChain, Memory | Agent with conversation history | **CORE** |
| OpenAI Assistant | OpenAI Assistants API | OpenAI native assistant | OPTIONAL |
| Tool Agent | LangChain | Generic tool-using agent | **CORE** |
| OpenAI Tools Agent | LangChain, OpenAI | Enhanced function calling | **CORE** |
| CSV Agent | LangChain, Pandas | Query CSV files with natural language | OPTIONAL |
| Agentic RAG | LangChain, Retrievers | Agent with retrieval capabilities | OPTIONAL |
| SQL Agent | LangChain, SQL Databases | Query SQL databases | OPTIONAL |
| XML Agent | LangChain | Agent using XML for reasoning | OPTIONAL |
| Agent as Tool | LangChain | Wrap agent as reusable tool | OPTIONAL |

**Key Insight**: OpenAI Function Agent and ReAct Agent are the most commonly used patterns. AgentflowV2 is superseding these for complex workflows.

---

### 3. Chat Models (28 nodes) - **CORE**

Chat-based language models with message history support.

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| ChatOpenAI | LangChain, OpenAI API | OpenAI GPT-3.5/GPT-4 models | **CORE** |
| ChatAnthropic | LangChain, Anthropic API | Anthropic Claude models | **CORE** |
| AzureChatOpenAI | LangChain, Azure OpenAI | Azure-hosted OpenAI models | **CORE** |
| ChatGoogleGenerativeAI | LangChain, Google Gemini | Google Gemini models | OPTIONAL |
| ChatMistralAI | LangChain, Mistral API | Mistral AI models | OPTIONAL |
| ChatOllama | LangChain, Ollama | Local LLM via Ollama | OPTIONAL |
| ChatGroq | LangChain, Groq API | Groq fast inference | OPTIONAL |
| ChatCohere | LangChain, Cohere API | Cohere Command models | OPTIONAL |
| ChatHuggingFace | LangChain, HuggingFace | HuggingFace Inference API | OPTIONAL |
| ChatLocalAI | LangChain, LocalAI | Local self-hosted models | OPTIONAL |
| ChatOpenRouter | LangChain, OpenRouter | Multi-provider routing | OPTIONAL |
| ChatTogetherAI | LangChain, Together API | Together AI hosted models | OPTIONAL |
| ChatFireworksAI | LangChain, Fireworks API | Fireworks AI models | OPTIONAL |
| ChatBedrock | LangChain, AWS Bedrock | AWS Bedrock models | OPTIONAL |
| ChatVertexAI | LangChain, Google Cloud | Google Cloud Vertex AI | OPTIONAL |
| AWSChatBedrock | LangChain, AWS SDK | Enhanced AWS Bedrock | OPTIONAL |
| ChatPerplexity | LangChain, Perplexity API | Perplexity online models | OPTIONAL |
| ChatUpstash | LangChain, Upstash | Upstash serverless LLM | OPTIONAL |
| ChatGrok | LangChain, xAI API | xAI Grok models | OPTIONAL |
| ChatDeepSeek | LangChain, DeepSeek API | DeepSeek models | OPTIONAL |
| ChatCerebras | LangChain, Cerebras API | Cerebras fast inference | OPTIONAL |
| ChatAI21 | LangChain, AI21 API | AI21 Jamba models | OPTIONAL |
| ChatBaidu | LangChain, Baidu API | Baidu ERNIE models | OPTIONAL |
| ChatAlibaba | LangChain, Alibaba Cloud | Alibaba Qwen models | OPTIONAL |
| ChatOCIGenAI | LangChain, Oracle Cloud | Oracle Cloud AI | OPTIONAL |
| ChatFriendli | LangChain, Friendli API | Friendli optimized models | OPTIONAL |
| ChatCustom | LangChain, Custom API | Custom OpenAI-compatible API | OPTIONAL |
| ChatLMStudio | LangChain, LM Studio | LM Studio local models | OPTIONAL |

**Key Insight**: ChatOpenAI and ChatAnthropic cover most production use cases. Others provide flexibility for cost, latency, or privacy requirements.

---

### 4. LLMs (12 nodes) - OPTIONAL

Legacy completion APIs (not chat-based).

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| OpenAI | LangChain, OpenAI API | OpenAI completion models | OPTIONAL |
| Anthropic | LangChain, Anthropic API | Anthropic completion API | OPTIONAL |
| AzureOpenAI | LangChain, Azure OpenAI | Azure OpenAI completions | OPTIONAL |
| Cohere | LangChain, Cohere API | Cohere completion models | OPTIONAL |
| HuggingFace Inference | LangChain, HuggingFace | HuggingFace completion API | OPTIONAL |
| Ollama | LangChain, Ollama | Ollama local completions | OPTIONAL |
| Replicate | LangChain, Replicate API | Replicate hosted models | OPTIONAL |
| GooglePaLM | LangChain, Google PaLM | Google PaLM models (legacy) | OPTIONAL |
| GoogleVertexAI | LangChain, Google Cloud | Google Vertex AI completions | OPTIONAL |
| Bedrock | LangChain, AWS Bedrock | AWS Bedrock completions | OPTIONAL |
| TogetherAI | LangChain, Together API | Together AI completions | OPTIONAL |
| Groq | LangChain, Groq API | Groq completions | OPTIONAL |

**Note**: Chat models are preferred over completion models for modern applications.

---

### 5. Embeddings (15 nodes) - **CORE**

Text embedding models for vector similarity search.

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| OpenAI Embeddings | LangChain, OpenAI API | OpenAI text-embedding-3/ada-002 | **CORE** |
| Azure OpenAI Embeddings | LangChain, Azure OpenAI | Azure-hosted OpenAI embeddings | **CORE** |
| Cohere Embeddings | LangChain, Cohere API | Cohere multilingual embeddings | OPTIONAL |
| HuggingFace Embeddings | LangChain, HuggingFace | HuggingFace embedding models | OPTIONAL |
| Ollama Embeddings | LangChain, Ollama | Local embedding models | OPTIONAL |
| Google Generative AI Embeddings | LangChain, Google API | Google Gemini embeddings | OPTIONAL |
| Google Vertex AI Embeddings | LangChain, Google Cloud | Google Cloud embeddings | OPTIONAL |
| Bedrock Embeddings | LangChain, AWS Bedrock | AWS Bedrock embeddings | OPTIONAL |
| Mistral AI Embeddings | LangChain, Mistral API | Mistral embeddings | OPTIONAL |
| Voyage AI Embeddings | LangChain, Voyage API | Voyage specialized embeddings | OPTIONAL |
| Jina Embeddings | LangChain, Jina API | Jina multilingual embeddings | OPTIONAL |
| Alibaba Embeddings | LangChain, Alibaba Cloud | Alibaba Cloud embeddings | OPTIONAL |
| Baidu Embeddings | LangChain, Baidu API | Baidu ERNIE embeddings | OPTIONAL |
| TogetherAI Embeddings | LangChain, Together API | Together AI embeddings | OPTIONAL |
| LocalAI Embeddings | LangChain, LocalAI | Self-hosted embeddings | OPTIONAL |

**Key Insight**: OpenAI Embeddings are the most widely used. For cost-sensitive applications, consider Ollama (local) or Jina (cloud).

---

### 6. Memory (14 nodes) - **CORE**

Conversation history and context management.

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| Buffer Memory | LangChain Memory | Store full conversation history | **CORE** |
| Conversation Summary Memory | LangChain Memory, LLM | Summarize conversation history | **CORE** |
| Buffer Window Memory | LangChain Memory | Last N messages window | **CORE** |
| Conversation Summary Buffer Memory | LangChain Memory, LLM | Hybrid summary + buffer | **CORE** |
| DynamoDB Chat Memory | LangChain, AWS DynamoDB | AWS DynamoDB persistence | OPTIONAL |
| MongoDB Chat Memory | LangChain, MongoDB | MongoDB persistence | OPTIONAL |
| Redis Chat Memory | LangChain, Redis | Redis-backed memory | OPTIONAL |
| Upstash Redis Memory | LangChain, Upstash | Serverless Redis memory | OPTIONAL |
| Momento Memory | LangChain, Momento | Momento cache-based memory | OPTIONAL |
| Postgres Memory | LangChain, PostgreSQL | PostgreSQL persistence | OPTIONAL |
| Zep Memory | LangChain, Zep | Zep long-term memory | OPTIONAL |
| Zep Cloud Memory | ❌ DISABLED | Cloud-hosted Zep (removed) | ❌ DISABLED |
| Motorhead Memory | LangChain, Motorhead | Motorhead memory server | OPTIONAL |
| Astra Memory | LangChain, DataStax Astra | DataStax Astra DB memory | OPTIONAL |

**Key Insight**: Buffer Memory is sufficient for development. Use Redis/Postgres for production with high traffic.

---

### 7. Vector Stores (23 nodes) - OPTIONAL

Vector databases for semantic search and RAG.

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| In-Memory Vector Store | LangChain | Simple in-memory storage | **CORE** (dev) |
| Pinecone | LangChain, Pinecone SDK | Production vector database | **CORE** (prod) |
| Chroma | LangChain, Chroma | Open-source vector DB | OPTIONAL |
| Astra DB | LangChain, DataStax Astra | DataStax vector DB | OPTIONAL |
| Qdrant | LangChain, Qdrant SDK | Qdrant vector search | OPTIONAL |
| Weaviate | LangChain, Weaviate SDK | Weaviate knowledge graph | OPTIONAL |
| Milvus | LangChain, Milvus SDK | Milvus distributed vector DB | OPTIONAL |
| Supabase | LangChain, Supabase | Supabase pgvector | OPTIONAL |
| PostgreSQL | LangChain, pgvector | PostgreSQL with pgvector | OPTIONAL |
| Elasticsearch | LangChain, Elasticsearch | Elasticsearch vector search | OPTIONAL |
| OpenSearch | LangChain, OpenSearch | OpenSearch vector engine | OPTIONAL |
| Faiss | LangChain, Faiss | Facebook AI Similarity Search | OPTIONAL |
| Redis | LangChain, Redis Search | Redis vector search | OPTIONAL |
| Upstash Redis | LangChain, Upstash | Serverless Redis vectors | OPTIONAL |
| Vectara | LangChain, Vectara SDK | Vectara neural search | OPTIONAL |
| SingleStore | LangChain, SingleStore | SingleStore vectors | OPTIONAL |
| Rockset | LangChain, Rockset SDK | Rockset real-time search | OPTIONAL |
| MongoDB Atlas | LangChain, MongoDB | MongoDB vector search | OPTIONAL |
| AnalyticDB | LangChain, Alibaba Cloud | Alibaba AnalyticDB | OPTIONAL |
| Teradata | LangChain, Teradata SDK | Teradata vector storage | OPTIONAL |
| Tigris | LangChain, Tigris SDK | Tigris vector DB | OPTIONAL |
| Couchbase | ❌ DISABLED | Couchbase vector search (removed) | ❌ DISABLED |
| Zilliz | LangChain, Zilliz Cloud | Zilliz managed Milvus | OPTIONAL |

**Key Insight**: Pinecone for production, In-Memory for development, Chroma/Supabase for cost-effective options.

---

### 8. Tools (40 nodes) - OPTIONAL

Function-calling tools for agents.

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| Calculator | LangChain Tools | Basic math operations | **CORE** |
| Custom Tool | LangChain Tools | User-defined tool | **CORE** |
| Chain Tool | LangChain | Wrap chain as tool | OPTIONAL |
| Chatflow Tool | Flowise | Call another chatflow as tool | OPTIONAL |
| Agent as Tool | LangChain | Wrap agent as tool | OPTIONAL |
| Web Browser | LangChain Tools, Puppeteer | Browse and scrape web pages | OPTIONAL |
| Web Scraper | LangChain Tools, Cheerio | Extract text from URLs | OPTIONAL |
| SerpAPI | LangChain Tools, SerpAPI | Google search results | OPTIONAL |
| Google Search API | LangChain Tools, Google Custom Search | Google custom search | OPTIONAL |
| Brave Search | LangChain Tools, Brave API | Privacy-focused search | OPTIONAL |
| Searxng | LangChain Tools, Searxng | Meta search engine | OPTIONAL |
| SearchApi | LangChain Tools, SearchApi | Search aggregator | OPTIONAL |
| Serper | LangChain Tools, Serper API | Google search via Serper | OPTIONAL |
| ExaSearch | LangChain Tools, Exa API | AI-powered search | OPTIONAL |
| Tavily Search | ❌ DISABLED | Tavily AI search (removed) | ❌ DISABLED |
| Composio | LangChain Tools, Composio | 100+ SaaS integrations | OPTIONAL |
| Gmail | LangChain Tools, Gmail API | Send/read Gmail | OPTIONAL |
| Google Calendar | LangChain Tools, Google Calendar API | Manage calendar events | OPTIONAL |
| Google Docs | LangChain Tools, Google Docs API | Create/edit documents | OPTIONAL |
| Google Drive | LangChain Tools, Google Drive API | File management | OPTIONAL |
| Google Sheets | LangChain Tools, Google Sheets API | Spreadsheet operations | OPTIONAL |
| Microsoft Outlook | LangChain Tools, Outlook API | Email management | OPTIONAL |
| Microsoft Teams | LangChain Tools, Teams API | Teams messaging | OPTIONAL |
| Jira | LangChain Tools, Jira API | Issue tracking | OPTIONAL |
| Stripe | LangChain Tools, Stripe API | Payment operations | OPTIONAL |
| Arxiv | LangChain Tools, Arxiv API | Research paper search | OPTIONAL |
| Wolfram Alpha | LangChain Tools, Wolfram API | Computational knowledge | OPTIONAL |
| Current Date/Time | JavaScript | Get current timestamp | OPTIONAL |
| Code Interpreter | LangChain Tools, E2B | Execute Python code safely | OPTIONAL |
| Read File | LangChain Tools, fs | Read local files | OPTIONAL |
| Write File | LangChain Tools, fs | Write local files | OPTIONAL |
| JSON Path Extractor | LangChain Tools, JSONPath | Extract from JSON | OPTIONAL |
| OpenAPI Toolkit | LangChain Tools, OpenAPI | Call REST APIs from spec | OPTIONAL |
| PowerShell Tool | LangChain Tools, PowerShell | Execute PowerShell scripts | OPTIONAL |
| Requests GET/POST/PUT/DELETE | LangChain Tools, Axios | HTTP requests | OPTIONAL |
| Retriever Tool | LangChain Retrievers | Wrap retriever as tool | OPTIONAL |
| Query Engine Tool | LangChain | LlamaIndex query engine | OPTIONAL |
| AWS SNS | LangChain Tools, AWS SDK | AWS notifications | OPTIONAL |
| AWS DynamoDB KV Storage | LangChain Tools, AWS SDK | Key-value storage | OPTIONAL |

**Key Insight**: Start with Calculator and Custom Tool. Add integrations as needed for specific use cases.

---

### 9. Tools (MCP) (8 nodes) - **CORE FOR MCP**

Model Context Protocol server integrations. Enables connecting to MCP tool servers.

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| Custom MCP | @modelcontextprotocol/sdk, stdio/SSE/HTTP | Connect to any MCP server | **CORE MCP** |
| GitHub MCP | MCP SDK, GitHub API | GitHub operations via MCP | OPTIONAL |
| PostgreSQL MCP | MCP SDK, PostgreSQL | Database queries via MCP | OPTIONAL |
| Slack MCP | MCP SDK, Slack API | Slack integration via MCP | OPTIONAL |
| BraveSearch MCP | MCP SDK, Brave API | Search via MCP | OPTIONAL |
| Supergateway MCP | MCP SDK, Supergateway | Multi-service gateway | OPTIONAL |
| Teradata MCP | MCP SDK, Teradata | Teradata database via MCP | OPTIONAL |
| Sequential Thinking MCP | MCP SDK | Chain-of-thought reasoning | OPTIONAL |

**MCP Protocol Support**:
- **Transport Types**: stdio (subprocess), SSE (server-sent events), Streamable HTTP
- **LangChain Integration**: Uses `langchain-mcp-adapters` pattern
- **Stateful/Stateless**: Supports both session-based and stateless tool calling
- **Custom Headers**: Supports authentication headers for SSE/HTTP transports
- **Multi-Server**: Can connect to multiple MCP servers simultaneously

**Key Insight**: MCP is a standardized protocol by Anthropic for tool servers. Flowise supports 8 pre-built MCP integrations + custom MCP server connections. This enables hundreds of existing MCP tool servers to work with Flowise agents.

**Coverage**: Excellent for LangChain/LangGraph compatibility. Python `langchain-mcp-adapters` library provides equivalent functionality.

---

### 10. Document Loaders (42 nodes) - OPTIONAL

Load documents for RAG applications.

| Category | Examples | Count | Core/Optional |
|----------|----------|-------|---------------|
| **Files** | PDF, Text, JSON, CSV, Docx, Excel, Markdown | 10 | OPTIONAL |
| **Web** | Cheerio Web Scraper, Playwright Web Scraper, Puppeteer Web Scraper | 4 | OPTIONAL |
| **APIs** | Airtable, Confluence, Notion, GitHub, GitBook | 8 | OPTIONAL |
| **Databases** | MongoDB, Postgres, MySQL, Firestore | 4 | OPTIONAL |
| **Cloud Storage** | S3, Google Drive, OneDrive, Dropbox | 5 | OPTIONAL |
| **Specialized** | Figma, Unstructured.io, AssemblyAI Audio | 6 | OPTIONAL |
| **Other** | Folder, Sitemap, SearchAPI, Spider | 5 | OPTIONAL |

**Total**: 42 document loaders

**Key Insight**: Only needed for RAG applications. PDF, Text, and JSON loaders cover most use cases.

---

### 11. Text Splitters (6 nodes) - OPTIONAL

Chunk documents for embedding.

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| Character Text Splitter | LangChain | Split by character count | OPTIONAL |
| Recursive Character Text Splitter | LangChain | Recursive splitting with overlap | OPTIONAL |
| Token Text Splitter | LangChain, tiktoken | Split by token count | OPTIONAL |
| Markdown Text Splitter | LangChain | Markdown-aware splitting | OPTIONAL |
| HTML to Markdown Text Splitter | LangChain | Convert HTML then split | OPTIONAL |
| Code Text Splitter | LangChain | Language-specific code splitting | OPTIONAL |

**Key Insight**: Recursive Character Text Splitter is the most commonly used.

---

### 12. Retrievers (14 nodes) - OPTIONAL

Advanced document retrieval strategies for RAG.

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| Vector Store Retriever | LangChain Retrievers | Basic vector similarity | OPTIONAL |
| Multi Query Retriever | LangChain, LLM | Generate multiple queries | OPTIONAL |
| Contextual Compression Retriever | LangChain, LLM | Compress retrieved docs | OPTIONAL |
| Ensemble Retriever | LangChain | Combine multiple retrievers | OPTIONAL |
| Time-Weighted Retriever | LangChain | Recency-weighted retrieval | OPTIONAL |
| Self Query Retriever | LangChain | Metadata-aware queries | OPTIONAL |
| Parent Document Retriever | LangChain | Retrieve parent chunks | OPTIONAL |
| Multi-Vector Retriever | LangChain | Multiple vectors per doc | OPTIONAL |
| Hybrid Search Retriever | LangChain, BM25 | Combine sparse + dense search | OPTIONAL |
| Voyage AI Rerank Retriever | LangChain, Voyage API | Rerank with Voyage | OPTIONAL |
| Cohere Rerank Retriever | LangChain, Cohere API | Rerank with Cohere | OPTIONAL |
| Similarity Score Threshold Retriever | LangChain | Filter by similarity score | OPTIONAL |
| Tavily Search Retriever | LangChain, Tavily API | Search with Tavily | OPTIONAL |
| Wikipedia Retriever | LangChain, Wikipedia API | Query Wikipedia | OPTIONAL |

**Key Insight**: Vector Store Retriever covers basic RAG. Advanced retrievers improve quality for complex use cases.

---

### 13. Chains (13 nodes) - OPTIONAL

Pre-built LangChain workflows.

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| Conversation Chain | LangChain | Simple conversational flow | **CORE** |
| LLM Chain | LangChain | Basic LLM → output chain | OPTIONAL |
| Retrieval QA Chain | LangChain, Retrievers | Question answering over docs | OPTIONAL |
| Conversational Retrieval QA Chain | LangChain, Memory, Retrievers | Conversational RAG | OPTIONAL |
| API Chain | LangChain | Call REST APIs | OPTIONAL |
| Multi-Prompt Chain | LangChain | Route to multiple prompts | OPTIONAL |
| Multi-Retrieval QA Chain | LangChain | Route to multiple retrievers | OPTIONAL |
| SQL Database Chain | LangChain, SQL | Query SQL databases | OPTIONAL |
| VectorDB QA Chain | LangChain | Vector store QA | OPTIONAL |
| Graph QA Chain | LangChain | Query knowledge graphs | OPTIONAL |
| Constitutional Chain | LangChain | Apply constitutional principles | OPTIONAL |
| Summarization Chain | LangChain | Document summarization | OPTIONAL |
| Refine Documents Chain | LangChain | Iterative refinement | OPTIONAL |

**Note**: Chains are being superseded by AgentflowV2 for complex workflows.

---

### 14. Prompts (4 nodes) - **CORE**

Prompt template management.

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| Chat Prompt Template | LangChain Prompts | Multi-message prompts | **CORE** |
| Prompt Template | LangChain Prompts | Simple string templates | **CORE** |
| Few Shot Prompt Template | LangChain Prompts | In-context learning examples | OPTIONAL |
| System Message Prompt | LangChain Prompts | System instruction template | OPTIONAL |

---

### 15. Cache (7 nodes) - OPTIONAL

LLM response caching for performance.

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| In-Memory Cache | LangChain Cache | Simple in-memory cache | OPTIONAL |
| Redis Cache | LangChain, Redis | Redis-backed cache | OPTIONAL |
| Upstash Redis Cache | LangChain, Upstash | Serverless Redis cache | OPTIONAL |
| Momento Cache | LangChain, Momento | Momento cache | OPTIONAL |
| Astra Cache | LangChain, DataStax Astra | Astra DB cache | OPTIONAL |
| OpenSearch Cache | LangChain, OpenSearch | OpenSearch-backed cache | OPTIONAL |
| AWS DynamoDB Cache | LangChain, AWS DynamoDB | DynamoDB cache | OPTIONAL |

---

### 16. Utilities (5 nodes) - OPTIONAL

Helper utilities for workflows.

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| Output Parser | LangChain Parsers | Parse LLM outputs | OPTIONAL |
| Structured Output Parser | LangChain, Zod | Type-safe output parsing | OPTIONAL |
| Runnable Sequence | LangChain LCEL | Chain runnables | OPTIONAL |
| If Else | LangChain | Conditional logic | OPTIONAL |
| Try Catch | LangChain | Error handling | OPTIONAL |

---

### 17. Multi Agents (2 nodes) - OPTIONAL

Multi-agent orchestration patterns.

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| Supervisor | LangGraph, LangChain | Supervisor agent pattern | OPTIONAL |
| Worker | LangGraph, LangChain | Worker agent in multi-agent system | OPTIONAL |

---

### 18. Sequential Agents (11 nodes) - OPTIONAL

Sequential workflow agents.

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| Sequential Supervisor | LangGraph | Sequential agent orchestration | OPTIONAL |
| Sequential Worker | LangGraph | Sequential task execution | OPTIONAL |
| + 9 specialized sequential agent nodes | LangGraph | Domain-specific sequential agents | OPTIONAL |

---

### 19. Analytic (7 nodes) - OPTIONAL

Analytics and observability integrations.

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| LangSmith | LangChain, LangSmith | LangChain observability | OPTIONAL |
| LangWatch | LangChain, LangWatch | Conversation analytics | OPTIONAL |
| Lunary | LangChain, Lunary API | LLM monitoring | OPTIONAL |
| LangFuse | LangChain, LangFuse | Open-source observability | OPTIONAL |
| Helicone | LangChain, Helicone | LLM cost tracking | OPTIONAL |
| Portkey | LangChain, Portkey | LLM gateway analytics | OPTIONAL |
| Arize Phoenix | LangChain, Arize | ML observability | OPTIONAL |

---

### 20. Moderation (2 nodes) - OPTIONAL

Content moderation and safety.

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| OpenAI Moderation | OpenAI Moderation API | Content safety checks | OPTIONAL |
| Simple Prompt Moderation | Regex/Rules | Basic prompt filtering | OPTIONAL |

---

### 21. Record Manager (3 nodes) - OPTIONAL

Manage document indexing state.

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| Postgres Record Manager | LangChain, PostgreSQL | Track indexed documents | OPTIONAL |
| Upstash Record Manager | LangChain, Upstash | Serverless record tracking | OPTIONAL |
| Astra Record Manager | LangChain, DataStax Astra | Astra-based record manager | OPTIONAL |

---

### 22. SpeechToText (1 node) - OPTIONAL

Audio transcription.

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| AssemblyAI | AssemblyAI API | Audio transcription | OPTIONAL |

---

### 23. Engine (4 nodes) - OPTIONAL

LlamaIndex integration.

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| Query Engine | LlamaIndex | LlamaIndex query engine | OPTIONAL |
| Chat Engine | LlamaIndex | LlamaIndex chat interface | OPTIONAL |
| Response Synthesizer | LlamaIndex | Synthesize responses | OPTIONAL |
| Index | LlamaIndex | LlamaIndex indexing | OPTIONAL |

---

### 24. Graph (1 node) - OPTIONAL

Knowledge graph support.

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| Neo4j Graph | LangChain, Neo4j | Knowledge graph queries | OPTIONAL |

---

### 25. Output Parsers (5 nodes) - OPTIONAL

Parse structured outputs from LLMs.

| Node | Tech Stack | Description | Core/Optional |
|------|------------|-------------|---------------|
| Structured Output Parser | LangChain, Zod | Type-safe parsing | OPTIONAL |
| JSON Output Parser | LangChain | Parse JSON responses | OPTIONAL |
| CSV Output Parser | LangChain | Parse CSV-formatted outputs | OPTIONAL |
| Custom List Output Parser | LangChain | Parse custom list formats | OPTIONAL |
| Fix Parser | LangChain | Self-healing output parser | OPTIONAL |

---

## MCP Tools Coverage

### What is Model Context Protocol (MCP)?

MCP is an **open protocol standardized by Anthropic** for connecting AI applications to tool servers. It enables:

1. **Standardized Tool Interface**: Uniform way to define and call tools
2. **Server-Client Architecture**: Tools run on MCP servers, agents connect as clients
3. **Multiple Transport Types**: stdio (subprocess), SSE (server-sent events), HTTP
4. **Stateful Sessions**: Persistent connections for multi-turn interactions
5. **Growing Ecosystem**: Hundreds of MCP servers already published

### Flowise MCP Integration

Flowise provides **excellent MCP support** through 8 dedicated MCP nodes:

#### Built-in MCP Nodes

1. **Custom MCP** (CORE):
   - Connect to any MCP server (stdio, SSE, HTTP transports)
   - Supports custom authentication headers
   - Multi-server connections
   - Session management (stateful/stateless)

2. **GitHub MCP** (OPTIONAL):
   - Repository operations
   - Issue/PR management
   - Code search

3. **PostgreSQL MCP** (OPTIONAL):
   - Database queries via MCP
   - Schema introspection

4. **Slack MCP** (OPTIONAL):
   - Send messages
   - Read channels
   - Workspace management

5. **BraveSearch MCP** (OPTIONAL):
   - Privacy-focused web search
   - MCP-standardized search results

6. **Supergateway MCP** (OPTIONAL):
   - Multi-service gateway
   - Aggregate multiple APIs

7. **Teradata MCP** (OPTIONAL):
   - Enterprise data warehouse queries

8. **Sequential Thinking MCP** (OPTIONAL):
   - Chain-of-thought reasoning tool
   - Step-by-step problem solving

### LangChain MCP Adapters

Flowise uses the **same pattern as Python LangChain**:

- **Library**: `@modelcontextprotocol/sdk` (TypeScript) = `langchain-mcp-adapters` (Python)
- **Client**: `MCPToolkit` class wraps MCP tools as LangChain tools
- **Multi-Server**: `MultiServerMCPClient` pattern (same in Python)
- **Transports**: stdio, SSE, Streamable HTTP (same in both)

### Python Compatibility

**MCP tools work identically in Python LangGraph**:

```python
# Python equivalent to Flowise MCP node
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent

client = MultiServerMCPClient({
    "github": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "transport": "stdio"
    },
    "postgres": {
        "url": "http://localhost:8000/mcp",
        "transport": "streamable_http"
    }
})

tools = await client.get_tools()
agent = create_react_agent("anthropic:claude-3-5-sonnet-latest", tools)
```

### MCP Ecosystem Access

Flowise's Custom MCP node enables access to **hundreds of existing MCP servers**:

- **Pre-built Servers**: GitHub, Slack, PostgreSQL, Brave Search, Google Drive, etc.
- **Community Servers**: 100+ published on npm and GitHub
- **Custom Servers**: Build your own with `@modelcontextprotocol/sdk`

**Example**: Connect to any MCP server from npm:

```json
{
    "transport": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {
        "GITHUB_TOKEN": "ghp_xxxxx"
    }
}
```

### Coverage Assessment

| Aspect | Flowise Support | Notes |
|--------|----------------|-------|
| **Transport Types** | ✅ All (stdio, SSE, HTTP) | Full compatibility |
| **Stateful Sessions** | ✅ Supported | Session-based tool calling |
| **Multi-Server** | ✅ Yes | Connect to multiple MCP servers |
| **Authentication** | ✅ Custom headers | SSE/HTTP auth support |
| **LangChain Integration** | ✅ Native | Uses LangChain tool interface |
| **Python Portability** | ✅ Excellent | Same `langchain-mcp-adapters` pattern |
| **Pre-built Servers** | ✅ 8 nodes | GitHub, Postgres, Slack, etc. |
| **Custom Servers** | ✅ Custom MCP node | Connect to any MCP server |
| **Ecosystem Access** | ✅ Full | Access 100+ existing MCP servers |

**Verdict**: Flowise has **excellent MCP coverage**. The Custom MCP node provides unlimited extensibility to connect to any MCP server, and the pre-built nodes cover common use cases.

---

## Summary & Recommendations

### Minimal AI Agent Stack

For building AI agents with **LangChain/LangGraph**, **OpenAI**, and **Anthropic**:

**Required (17 core nodes)**:
- 2 Chat Models (ChatOpenAI, ChatAnthropic)
- 5 Agent Flow nodes (Start, Agent, LLM, Tool, End)
- 2 Agents (OpenAI Function Agent, ReAct Agent)
- 2 Memory nodes (Buffer Memory, Conversation Summary Memory)
- 2 Embedding nodes (OpenAI Embeddings, Azure OpenAI Embeddings)
- 2 Vector Stores (In-Memory, Pinecone)
- 2 Tools (Calculator, Custom Tool)

**Optional but recommended (10 nodes)**:
- 1 MCP node (Custom MCP)
- 2 Prompts (Chat Prompt Template, Prompt Template)
- 1 Chain (Conversation Chain)
- 3 Retrievers (Vector Store Retriever, Multi Query Retriever, Contextual Compression)
- 2 Document Loaders (PDF, Text)
- 1 Text Splitter (Recursive Character Text Splitter)

**Total minimal stack**: 27 nodes (10% of available 267 nodes)

### Disabled Nodes (Non-Essential)

- ❌ Couchbase (removed from LangChain community exports)
- ❌ Zep Cloud (3rd party SaaS, not core)
- ❌ Tavily Search (alternative search providers available)

### Architecture Strengths

1. **LangChain Native**: All nodes are LangChain components
2. **LangGraph Integration**: AgentflowV2 uses LangGraph StateGraph
3. **Type Safety**: TypeScript with strict mode
4. **Extensibility**: Easy to add custom nodes
5. **MCP Support**: Excellent coverage for Model Context Protocol
6. **Python Portability**: Flows can be converted to Python with effort

### Python Portability

- ✅ **Conceptually compatible**: Nodes map to Python LangChain components
- ⚠️ **No direct import**: Requires custom converter tool
- ✅ **MCP works identically**: Same `langchain-mcp-adapters` pattern
- 💡 **Recommendation**: Use Flowise API from Python instead of converting flows

### LangChain/LangGraph Coverage

- ✅ **Chat Models**: 28 providers (OpenAI, Anthropic, etc.)
- ✅ **Agents**: ReAct, OpenAI Function Agent, Tool Agent
- ✅ **LangGraph**: Full StateGraph support in AgentflowV2
- ✅ **Tools**: 40+ built-in tools + 8 MCP integrations
- ✅ **Memory**: 14 memory types (in-memory to production DBs)
- ✅ **Vector Stores**: 23 options (Pinecone, Chroma, etc.)
- ✅ **RAG**: Full retrieval pipeline (loaders, splitters, retrievers)
- ✅ **Multi-Agent**: Supervisor-worker patterns
- ✅ **State Management**: LangGraph state with reducers

### Next Steps

1. **Focus on Core Nodes**: Use the 27-node minimal stack for most applications
2. **Explore AgentflowV2**: Modern approach for stateful agent workflows
3. **Leverage MCP**: Access 100+ tool servers via Custom MCP node
4. **Production Deployment**: Add Redis Memory, Pinecone, and monitoring
5. **Python Integration**: Use Flowise API rather than converting flows

---

## Appendix: Build & Test Status

- **Build**: ✅ Successful (all 4 packages, ~35s)
- **Tests**: ✅ 74/74 passing (components: 73, server: 1)
- **Disabled Nodes**: Couchbase, ZepCloud, ZepMemoryCloud, Tavily
- **Node.js**: v24.9.0 (testing), v18+ required
- **pnpm**: v10.20.0 (workspace protocol)
- **Turbo**: v2.6.0 (monorepo builds)

**Last Verified**: 2025

---

**End of Document**
