import { resume } from './state.js';
import { renderExperience, updatePreview, openAIDraftModal } from './ui.js';
import { sanitizeAIOutput } from './utils.js';
import { showToast } from './toast.js';
import { callAI } from './ai-call.js';
import {
  loadChat, saveChat, clearChat, getMessages,
  addUserMessage, addAssistantMessage, updateLastAssistant,
  buildRequestMessages
} from './chat.js';

const STRICT_FORMAT = `
Output rules (follow exactly):
- Plain text only. NO markdown: no asterisks, no underscores, no backticks, no headers, no bullet symbols.
- Do NOT include a preamble like "Here is..." or a closing like "Let me know...".
- Do NOT explain what you are doing. Just return the content itself.
- Use short paragraphs separated by a blank line.
`.trim();

function compactResume(r) {
  return {
    name: r.name,
    title: r.title,
    summary: r.summary,
    skills: r.skills,
    experience: (r.experience || []).map(e => ({
      role: e.role,
      company: e.company,
      bullets: (e.bullets || []).filter(Boolean)
    })),
    education: (r.education || []).map(e => ({
      degree: e.degree,
      school: e.school
    })),
    projects: (r.projects || []).map(p => ({
      name: p.name,
      bullets: (p.bullets || []).filter(Boolean)
    }))
  };
}

/* ============================================================
   SUMMARY - streams into review modal
   ============================================================ */
export async function aiGenerateSummary(btn) {
  const original = btn.textContent;
  btn.disabled = true; btn.textContent = 'Generating...';

  const { draft, applyBtn } = openAIDraftModal('', 'summary') || {};
  if (applyBtn) {
    applyBtn.disabled = true;
    applyBtn.textContent = 'Writing…';
  }

  try {
    const expText = resume.experience
      .map(e => `${e.role} at ${e.company}: ${(e.bullets || []).join(' ')}`)
      .join('\n');

    const prompt = `You are a professional resume writer.
Write a concise professional summary for a resume (3 to 5 sentences).
Write in implied first person (no "I", no "he/she").

${STRICT_FORMAT}

Candidate name: ${resume.name || 'the candidate'}
Target title: ${resume.title || 'professional'}
Experience:
${expText}`;

    const raw = await callAI({
      prompt,
      maxTokens: 220,
      onToken: (_, full) => { if (draft) draft.value = full; }
    });

    if (draft) draft.value = sanitizeAIOutput(raw);
  } catch (e) {
    showToast('AI error: ' + e.message, 'error', 5000);
    document.getElementById('aiModal')?.classList.add('hidden');
  } finally {
    btn.disabled = false; btn.textContent = original;
    if (applyBtn) {
      applyBtn.disabled = false;
      applyBtn.textContent = 'Apply';
    }
  }
}

/* ============================================================
   BULLETS
   ============================================================ */
export async function aiImproveBullets(index, btn) {
  const exp = resume.experience[index];
  const current = (exp.bullets || []).join('\n');
  if (!current.trim()) return showToast('No bullet points to improve yet.', 'warn');

  const original = btn.textContent;
  btn.disabled = true; btn.textContent = 'Improving...';
  try {
    const prompt = `Rewrite the following resume bullet points to be more impactful.
Use strong action verbs and add quantifiable results where possible.
One bullet per line. Do not number them. Keep each bullet to one line.

${STRICT_FORMAT}

Bullets:
${current}`;

    const raw = await callAI({ prompt, maxTokens: 250, stream: true });
    const cleaned = sanitizeAIOutput(raw).split('\n').map(l => l.trim()).filter(Boolean);

    exp.bullets = cleaned;
    renderExperience();
    updatePreview();
  } catch (e) {
    showToast('AI error: ' + e.message, 'error', 5000);
  } finally {
    btn.disabled = false; btn.textContent = original;
  }
}

/* ============================================================
   DEEP ANALYSIS
   ============================================================ */
export async function aiDeepAnalysis(btn) {
  const jd = document.getElementById('jobDescription')?.value || '';
  if (!jd.trim()) return showToast('Paste a job description first.', 'warn');

  const output = document.getElementById('aiOutput');
  if (output) {
    output.textContent = '';
    output.classList.remove('hidden');
  }

  const original = btn.textContent;
  btn.disabled = true; btn.textContent = 'Analyzing...';
  try {
    const prompt = `You are an expert career coach and ATS specialist.
The candidate's resume and the target job description are below.

Give specific, actionable advice in this exact structure (plain text, no markdown, no asterisks):

1. Top 3 keyword gaps - words or phrases in the job description that are missing or underrepresented in the resume.
2. Three specific bullet rewrites - pick existing resume bullets and rewrite them to include the job's vocabulary while keeping them truthful.
3. One strategic note - a single sentence about positioning, seniority, or narrative.

Keep it under 220 words total. Do not use markdown formatting.

Resume (JSON):
${JSON.stringify(compactResume(resume))}

Job Description:
${jd}`;

    const raw = await callAI({
      prompt,
      maxTokens: 380,
      onToken: (_, full) => { if (output) output.textContent = full; }
    });

    if (output) output.textContent = sanitizeAIOutput(raw);
  } catch (e) {
    showToast('AI error: ' + e.message, 'error', 5000);
    if (output) output.classList.add('hidden');
  } finally {
    btn.disabled = false; btn.textContent = original;
  }
}

/* ============================================================
   CHAT - active context window
   ============================================================ */
let chatSending = false;

export async function chatSend(text) {
  if (chatSending) return;
  const trimmed = (text || '').trim();
  if (!trimmed) return;

  chatSending = true;
  addUserMessage(trimmed);
  renderChatMessages();

  addAssistantMessage('');
  const assistantIndex = getMessages().length - 1;

  try {
    const requestMessages = buildRequestMessages();

    await callAI({
      messages: requestMessages,
      maxTokens: 500,
      stream: true,
      onToken: (_, full) => {
        updateLastAssistant(full);
        renderChatMessages();
      }
    });

    const final = sanitizeAIOutput(getMessages()[assistantIndex].content);
    updateLastAssistant(final);
    renderChatMessages();
  } catch (e) {
    updateLastAssistant(`[Error: ${e.message}]`);
    renderChatMessages();
    showToast('Chat error: ' + e.message, 'error', 5000);
  } finally {
    chatSending = false;
  }
}

export function chatClear() {
  clearChat();
  renderChatMessages();
}

export function initChat() {
  loadChat();
  renderChatMessages();
}

/* ============================================================
   CHAT RENDERING
   ============================================================ */
export function renderChatMessages() {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const msgs = getMessages();
  if (!msgs.length) {
    container.innerHTML = `
      <div class="chat-empty">
        <p>Ask anything about your resume.</p>
        <div class="chat-suggestions">
          <button type="button" class="chat-suggestion" data-suggest="Make my summary shorter and punchier.">Shorten my summary</button>
          <button type="button" class="chat-suggestion" data-suggest="Add more quantifiable metrics to my experience bullets.">Add metrics</button>
          <button type="button" class="chat-suggestion" data-suggest="Rewrite my summary in a more formal tone.">More formal tone</button>
          <button type="button" class="chat-suggestion" data-suggest="What are my weakest bullet points and why?">Find weak spots</button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = msgs.map((m, i) => `
    <div class="chat-msg chat-msg-${m.role}" data-index="${i}">
      <div class="chat-msg-role">${m.role === 'user' ? 'You' : 'AI'}</div>
      <div class="chat-msg-body">${escapeHtml(m.content) || '<span class="chat-typing">…</span>'}</div>
    </div>
  `).join('');

  container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

/* Re-exports for main.js convenience */
export { generateCoverLetter } from './cover.js';
export { generateInterviewPrep, sendInterviewToChat } from './interview.js';
export { matchInternshipRequirements, sendInternshipToChat } from './internship.js';