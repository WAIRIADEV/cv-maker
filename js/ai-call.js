// js/ai-call.js
// Unified AI caller. Dispatches to Ollama or OpenAI-compatible providers.
// Handles streaming for both formats.
//
// Per-provider settings are stored under:
//   cv-maker-settings -> { provider, models: { [providerId]: "model" }, apiKeys: { [providerId]: "key" }, ... }

/* ============================================================
   PUBLIC ENTRY POINT
   ============================================================ */
export async function callAI({
  prompt,
  messages,
  stream = true,
  onToken,
  maxTokens = 400,
  temperature = 0.6,
  keepAlive = '30m'
}) {
  const provider = getActiveProvider();
  const apiKey   = getActiveApiKey();

  if (provider.format === 'openai') {
    return callOpenAICompatible({
      provider, apiKey, prompt, messages, stream, onToken, maxTokens, temperature
    });
  }
  return callOllama({
    provider, prompt, messages, stream, onToken, maxTokens, temperature, keepAlive
  });
}

/* ============================================================
   SETTINGS RESOLUTION
   ============================================================ */
function readSettings() {
  try {
    return JSON.parse(localStorage.getItem('cv-maker-settings') || '{}');
  } catch {
    return {};
  }
}

function getActiveProvider() {
  const settings = readSettings();
  const providerId = settings.provider || 'ollama';
  const providers = window.__PROVIDERS__ || {};
  return providers[providerId] || providers.ollama;
}

function getActiveApiKey() {
  const settings = readSettings();
  const providerId = settings.provider || 'ollama';
  return settings.apiKeys?.[providerId] || '';
}

function getActiveModel() {
  const settings = readSettings();
  const providerId = settings.provider || 'ollama';
  return settings.models?.[providerId] || '';
}

/* ============================================================
   OLLAMA - /api/chat or /api/generate (NDJSON streaming)
   ============================================================ */
async function callOllama({ provider, prompt, messages, stream, onToken, maxTokens, temperature, keepAlive }) {
  const settings = readSettings();
  const url = (settings.url || document.getElementById('ollamaUrl')?.value || provider.baseUrl).replace(/\/$/, '');
  const model = settings.models?.ollama
    || document.getElementById('ollamaModel')?.value
    || provider.defaultModel;

  let path, body;

  if (messages) {
    path = provider.chatPath;
    body = {
      model,
      messages,
      stream,
      keep_alive: keepAlive,
      options: { num_predict: maxTokens, temperature, top_p: 0.9 }
    };
  } else {
    path = provider.generatePath;
    body = {
      model,
      prompt,
      stream,
      keep_alive: keepAlive,
      options: { num_predict: maxTokens, temperature, top_p: 0.9 }
    };
  }

  const res = await fetch(`${url}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = j.error || '';
    } catch { /* ignore */ }
    if (res.status === 404) {
      throw new Error(`Ollama: model "${model}" not found. Run: ollama pull ${model}`);
    }
    throw new Error(`Ollama error ${res.status}${detail ? ': ' + detail : ''}`);
  }

  return stream
    ? parseOllamaStream(res, onToken, !!messages)
    : parseOllamaNonStream(res, !!messages);
}

async function parseOllamaStream(res, onToken, isChat) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        const token = isChat ? obj.message?.content : obj.response;
        if (token) {
          full += token;
          onToken?.(token, full);
        }
      } catch { /* ignore partial lines */ }
    }
  }
  return full;
}

async function parseOllamaNonStream(res, isChat) {
  const data = await res.json();
  return isChat ? data.message?.content : data.response;
}

/* ============================================================
   OPENAI-COMPATIBLE - /chat/completions (SSE streaming)
   Groq, DeepSeek, OpenAI, Together, Fireworks, etc.
   ============================================================ */
async function callOpenAICompatible({ provider, apiKey, prompt, messages, stream, onToken, maxTokens, temperature }) {
  if (!apiKey) {
    throw new Error(`Missing API key for ${provider.name}. Open settings to add it.`);
  }

  const model = getActiveModel() || provider.defaultModel;

  const chatMessages = messages || [
    { role: 'user', content: prompt }
  ];

  const body = {
    model,
    messages: chatMessages,
    stream,
    max_completion_tokens: maxTokens,
    temperature,
    top_p: 0.9
  };

  const res = await fetch(`${provider.baseUrl}${provider.chatPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    let serverMsg = '';
    try {
      const j = await res.json();
      serverMsg = j.error?.message || j.message || '';
    } catch { /* ignore */ }

    if (res.status === 401) throw new Error(`${provider.name}: Invalid API key.`);
    if (res.status === 429) throw new Error(`${provider.name}: Rate limit reached. Try again in a minute.`);
    if (res.status === 404) throw new Error(`${provider.name}: Model "${model}" not available on your account. Use "Refresh models" in settings to see what's available.`);
    throw new Error(`${provider.name} error (${res.status})${serverMsg ? ': ' + serverMsg : ''}`);
  }

  return stream
    ? parseOpenAIStream(res, onToken)
    : parseOpenAINonStream(res);
}

async function parseOpenAIStream(res, onToken) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') continue;
      try {
        const obj = JSON.parse(payload);
        const token = obj.choices?.[0]?.delta?.content;
        if (token) {
          full += token;
          onToken?.(token, full);
        }
      } catch { /* ignore partial lines */ }
    }
  }
  return full;
}

async function parseOpenAINonStream(res) {
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}