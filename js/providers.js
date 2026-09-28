// js/providers.js
// Registry of AI providers. Adding a new OpenAI-compatible provider is a
// short addition here plus a new option in the settings <select>.

export const PROVIDERS = {
  ollama: {
    id: 'ollama',
    name: 'Ollama (local)',
    baseUrl: 'http://localhost:11434',
    chatPath: '/api/chat',
    generatePath: '/api/generate',
    embedPath: '/api/embeddings',
    modelsPath: null,       // Ollama uses `ollama list` on the CLI, no REST endpoint exposed by default
    needsKey: false,
    hasEmbeddings: true,
    format: 'ollama',
    defaultModel: 'llama3.2',
    defaultEmbedModel: 'nomic-embed-text',
    hint: 'Runs on your machine. No API key needed. Use the exact model name from `ollama list`.',
    suggestedModels: []
  },
  groq: {
    id: 'groq',
    name: 'Groq (free tier)',
    baseUrl: 'https://api.groq.com/openai/v1',
    chatPath: '/chat/completions',
    modelsPath: '/models',
    needsKey: true,
    hasEmbeddings: false,
    format: 'openai',
    defaultModel: 'openai/gpt-oss-120b',
    hint: 'Very fast, free tier. Models change often — click "Refresh models" to load the current list.',
    suggestedModels: [
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.6-27b',
      'qwen/qwen3-32b',
      'moonshotai/kimi-k2-instruct'
    ]
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    chatPath: '/chat/completions',
    modelsPath: '/models',
    needsKey: true,
    hasEmbeddings: false,
    format: 'openai',
    defaultModel: 'deepseek-chat',
    hint: 'Paid, ~$0.14/M input tokens. Strong reasoning. Use deepseek-chat or deepseek-reasoner.',
    suggestedModels: ['deepseek-chat', 'deepseek-reasoner']
  }
};

export function getProvider(id) {
  return PROVIDERS[id] || PROVIDERS.ollama;
}

export function listProviders() {
  return Object.values(PROVIDERS);
}