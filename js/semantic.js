// js/semantic.js
// Semantic ATS matching via Ollama embeddings.
// Requires: ollama pull nomic-embed-text

import { extractKeywords } from './ats.js';

const DEFAULT_EMBED_MODEL = 'nomic-embed-text';
const SIMILARITY_THRESHOLD = 0.70;
const CACHE = new Map(); // key: `${model}::${text}` -> embedding array

/* ============================================================
   OLLAMA EMBEDDINGS
   ============================================================ */
async function getEmbedding(text, url, model) {
  const key = `${model}::${text}`;
  if (CACHE.has(key)) return CACHE.get(key);

  const res = await fetch(`${url}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: text })
  });

  if (res.status === 404) {
    const err = new Error(
      `Model "${model}" not found in Ollama. Run: ollama pull ${model}`
    );
    err.code = 'MODEL_NOT_FOUND';
    throw err;
  }
  if (!res.ok) throw new Error(`Embedding error: ${res.statusText}`);

  const data = await res.json();
  if (!Array.isArray(data.embedding)) {
    throw new Error('Ollama returned no embedding vector.');
  }

  CACHE.set(key, data.embedding);
  return data.embedding;
}

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom ? dot / denom : 0;
}

/* ============================================================
   RESUME CHUNKING
   ============================================================ */
function chunkResume(resume) {
  const chunks = [];

  if (resume.title)   chunks.push({ text: resume.title,   source: 'Title' });
  if (resume.summary) chunks.push({ text: resume.summary, source: 'Summary' });

  if (resume.skills) {
    const skills = resume.skills
      .split(/[,·•\n|;]/)
      .map(s => s.trim())
      .filter(Boolean);
    skills.forEach(s => chunks.push({ text: s, source: `Skill: ${s}` }));
  }

  (resume.experience || []).forEach(e => {
    if (e.role || e.company) {
      const label = [e.role, e.company].filter(Boolean).join(' at ');
      chunks.push({ text: label, source: `Experience: ${e.role || e.company}` });
    }
    (e.bullets || []).forEach(b => {
      const t = (b || '').trim();
      if (t) chunks.push({ text: t, source: 'Experience bullet' });
    });
  });

  (resume.education || []).forEach(e => {
    if (e.degree || e.school) {
      const label = [e.degree, e.school].filter(Boolean).join(' — ');
      chunks.push({ text: label, source: `Education: ${e.degree || e.school}` });
    }
    if (e.details && e.details.trim()) {
      chunks.push({ text: e.details.trim(), source: 'Education details' });
    }
  });

  (resume.projects || []).forEach(p => {
    if (p.name) chunks.push({ text: p.name, source: `Project: ${p.name}` });
    (p.bullets || []).forEach(b => {
      const t = (b || '').trim();
      if (t) chunks.push({ text: t, source: 'Project bullet' });
    });
  });

  return chunks;
}

/* ============================================================
   MAIN SCAN
   ============================================================ */
/**
 * @param {string} jdText
 * @param {object} resumeData
 * @param {object} options
 * @param {string} options.url        - Ollama base URL
 * @param {string} [options.embedModel] - embedding model name
 * @param {(done:number,total:number,phase:string)=>void} [options.onProgress]
 */
export async function semanticScan(jdText, resumeData, { url, embedModel, onProgress } = {}) {
  const baseUrl = (url || 'http://localhost:11434').replace(/\/$/, '');
  const model   = embedModel || DEFAULT_EMBED_MODEL;

  const keywords = extractKeywords(jdText);
  if (!keywords.length) {
    return { score: 0, matched: [], missing: [], total: 0, highPriorityMissing: [], mode: 'semantic' };
  }

  const chunks = chunkResume(resumeData);

  // ---- Phase 1: embed keywords ----
  const keywordVecs = [];
  for (let i = 0; i < keywords.length; i++) {
    onProgress?.(i, keywords.length, 'keywords');
    keywordVecs.push(await getEmbedding(keywords[i].term, baseUrl, model));
  }
  onProgress?.(keywords.length, keywords.length, 'keywords');

  // ---- Phase 2: embed resume chunks ----
  const chunkVecs = [];
  for (let i = 0; i < chunks.length; i++) {
    onProgress?.(i, chunks.length, 'resume');
    chunkVecs.push(await getEmbedding(chunks[i].text, baseUrl, model));
  }
  onProgress?.(chunks.length, chunks.length, 'resume');

  // ---- Phase 3: compare ----
  let matchedWeight = 0;
  let totalWeight = 0;
  const matched = [];
  const missing = [];

  for (let i = 0; i < keywords.length; i++) {
    const kw = keywords[i];
    totalWeight += kw.weight;

    let bestSim = 0;
    let bestChunk = null;
    for (let j = 0; j < chunks.length; j++) {
      const sim = cosineSimilarity(keywordVecs[i], chunkVecs[j]);
      if (sim > bestSim) {
        bestSim = sim;
        bestChunk = chunks[j];
      }
    }

    if (bestSim >= SIMILARITY_THRESHOLD) {
      matchedWeight += kw.weight;
      matched.push({ ...kw, similarity: bestSim, matchedIn: bestChunk?.source || '' });
    } else {
      missing.push({ ...kw, bestSimilarity: bestSim });
    }
  }

  const score = totalWeight ? Math.round((matchedWeight / totalWeight) * 100) : 0;
  const highPriorityMissing = missing.filter(m => m.weight >= 1.5);

  return {
    score,
    matched,
    missing,
    total: keywords.length,
    highPriorityMissing,
    mode: 'semantic',
    threshold: SIMILARITY_THRESHOLD
  };
}

export function clearEmbeddingCache() {
  CACHE.clear();
}