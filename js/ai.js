import { resume } from './state.js';
import { renderExperience, updatePreview, openAIDraftModal } from './ui.js';
import { sanitizeAIOutput } from './utils.js';
import { showToast } from './toast.js';

/* ============================================================
   OLLAMA CALL WITH STREAMING
   ============================================================
   Speed wins over a plain call:
   - stream: true         → tokens render as generated
   - keep_alive: '30m'    → model stays in RAM between calls
   - num_predict          → caps runaway output
   - temperature: 0.6     → slightly tighter responses
   - compactPrompt()      → ~60% shorter prompts
   ============================================================ */

async function callOllama(prompt, { onToken, numPredict = 300 } = {}) {
  const url   = document.getElementById('ollamaUrl').value.replace(/\/$/, '');
  const model = document.getElementById('ollamaModel').value;

  const response = await fetch(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: true,
      keep_alive: '30m',
      options: {
        num_predict: numPredict,
        temperature: 0.6,
        top_p: 0.9
      }
    })
  });

  if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
  if (!response.body) throw new Error('No response body from Ollama.');

  const reader = response.body.getReader();
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
        if (obj.response) {
          full += obj.response;
          onToken?.(obj.response, full);
        }
      } catch { /* ignore partial lines */ }
    }
  }
  return full;
}

/* ============================================================
   COMPACT PROMPT PAYLOAD
   Only send what the AI actually needs.
   ============================================================ */
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

const STRICT_FORMAT = `
Output rules (follow exactly):
- Plain text only. NO markdown: no asterisks, no underscores, no backticks, no headers, no bullet symbols.
- Do NOT include a preamble like "Here is..." or a closing like "Let me know...".
- Do NOT explain what you are doing. Just return the content itself.
- Use short paragraphs separated by a blank line.
`.trim();

/* ============================================================
   SUMMARY — streams live into the review modal
   ============================================================ */
export async function aiGenerateSummary(btn) {
  const original = btn.textContent;
  btn.disabled = true; btn.textContent = 'Generating...';

  // Open modal immediately with empty textarea + disabled Apply
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

    let streamed = '';
    const raw = await callOllama(prompt, {
      numPredict: 220,
      onToken: (_, full) => {
        streamed = full;
        if (draft) draft.value = full;
      }
    });

    // Final sanitize
    if (draft) draft.value = sanitizeAIOutput(raw);
  } catch (e) {
    showToast('AI error: ' + e.message, 'error', 5000);
  } finally {
    btn.disabled = false; btn.textContent = original;
    if (applyBtn) {
      applyBtn.disabled = false;
      applyBtn.textContent = 'Apply';
    }
  }
}

/* ============================================================
   BULLETS — waits for full output, then sanitizes
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

    const raw = await callOllama(prompt, { numPredict: 250 });
    const cleaned = sanitizeAIOutput(raw)
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

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
   DEEP ANALYSIS — streams live into #aiOutput
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
    const compact = compactResume(resume);
    const prompt = `You are an expert career coach and ATS specialist.
The candidate's resume and the target job description are below.

Give specific, actionable advice in this exact structure (plain text, no markdown, no asterisks):

1. Top 3 keyword gaps — words or phrases in the job description that are missing or underrepresented in the resume.
2. Three specific bullet rewrites — pick existing resume bullets and rewrite them to include the job's vocabulary while keeping them truthful.
3. One strategic note — a single sentence about positioning, seniority, or narrative.

Keep it under 220 words total. Do not use markdown formatting.

Resume (JSON):
${JSON.stringify(compact)}

Job Description:
${jd}`;

    const raw = await callOllama(prompt, {
      numPredict: 380,
      onToken: (_, full) => {
        if (output) output.textContent = full;
      }
    });

    // Final sanitize pass
    if (output) output.textContent = sanitizeAIOutput(raw);
  } catch (e) {
    showToast('AI error: ' + e.message, 'error', 5000);
    if (output) output.classList.add('hidden');
  } finally {
    btn.disabled = false; btn.textContent = original;
  }
}