// js/chat.js
// Active AI chat context window.
// Maintains a message history with a sliding window + pinned system prompt.

import { resume } from './state.js';
import { showToast } from './toast.js';

const STORAGE_KEY = 'cv-maker-chat';
const MAX_MESSAGES = 20;          // sliding window size (user + assistant pairs count as 2)
const TOKEN_BUDGET = 6000;        // estimated tokens for history
const CHARS_PER_TOKEN = 4;

let messages = [];                // [{ role, content, ts }]

/* ============================================================
   PERSISTENCE
   ============================================================ */
export function loadChat() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    messages = raw ? JSON.parse(raw) : [];
  } catch {
    messages = [];
  }
  return messages;
}

export function saveChat() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch { /* ignore quota errors */ }
}

export function clearChat() {
  messages = [];
  saveChat();
}

export function getMessages() {
  return messages;
}

/* ============================================================
   SYSTEM PROMPT
   ============================================================ */
function buildSystemPrompt() {
  const compact = {
    name: resume.name,
    title: resume.title,
    summary: resume.summary,
    skills: resume.skills,
    experience: (resume.experience || []).map(e => ({
      role: e.role,
      company: e.company,
      bullets: (e.bullets || []).filter(Boolean)
    })),
    education: (resume.education || []).map(e => ({
      degree: e.degree,
      school: e.school
    })),
    projects: (resume.projects || []).map(p => ({
      name: p.name,
      bullets: (p.bullets || []).filter(Boolean)
    }))
  };

  return `You are a resume writing assistant embedded in a CV builder app.

Your job: help the user refine, rewrite, or improve parts of their resume. Be direct and specific. Suggest concrete edits, not general advice.

Rules:
- Plain text only. No markdown, no asterisks, no backticks, no headers.
- Keep responses short — usually 2–6 sentences unless asked for a rewrite.
- When rewriting content, put the rewritten text on its own line so the user can copy it.
- If the user asks about something unrelated to their resume, politely redirect.

Current resume (JSON):
${JSON.stringify(compact)}

Answer the user's next message.`;
}

/* ============================================================
   SLIDING WINDOW + TOKEN BUDGET
   ============================================================ */
function estimateTokens(text) {
  return Math.ceil((text || '').length / CHARS_PER_TOKEN);
}

function trimHistory(history) {
  // history is an array of { role, content } (no system message yet)
  // 1. Keep last MAX_MESSAGES
  let window = history.slice(-MAX_MESSAGES);

  // 2. Trim from the front until we fit the token budget
  const total = () => window.reduce((sum, m) => sum + estimateTokens(m.content), 0);
  while (window.length > 0 && total() > TOKEN_BUDGET) {
    window = window.slice(1);
  }

  return window;
}

/* ============================================================
   PUBLIC API
   ============================================================ */
export function addUserMessage(content) {
  messages.push({ role: 'user', content, ts: Date.now() });
  saveChat();
}

export function addAssistantMessage(content) {
  messages.push({ role: 'assistant', content, ts: Date.now() });
  saveChat();
}

export function updateLastAssistant(content) {
  const last = messages[messages.length - 1];
  if (last && last.role === 'assistant') {
    last.content = content;
    saveChat();
  }
}

/**
 * Build the message array to send to the AI.
 * Pinned system prompt + sliding window of recent turns.
 */
export function buildRequestMessages() {
  const history = trimHistory(messages.map(m => ({ role: m.role, content: m.content })));
  return [
    { role: 'system', content: buildSystemPrompt() },
    ...history
  ];
}

/**
 * Refresh the system prompt after the resume changes.
 * We don't store the system message, so this is implicit —
 * the next request rebuilds it.
 */
export function refreshContext() {
  // No-op — the system prompt is regenerated on every request.
  // This function exists so callers can be explicit about intent.
}