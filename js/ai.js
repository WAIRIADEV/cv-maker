import { resume } from './state.js';
import { renderExperience, updatePreview, openAIDraftModal } from './ui.js';
import { sanitizeAIOutput } from './utils.js';
import { showToast } from './toast.js';

async function callOllama(prompt) {
  const url   = document.getElementById('ollamaUrl').value.replace(/\/$/, '');
  const model = document.getElementById('ollamaModel').value;
  const response = await fetch(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false })
  });
  if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
  const data = await response.json();
  return data.response;
}

const STRICT_FORMAT = `
Output rules (follow exactly):
- Plain text only. NO markdown: no asterisks, no underscores, no backticks, no headers, no bullet symbols.
- Do NOT include a preamble like "Here is..." or a closing like "Let me know...".
- Do NOT explain what you are doing. Just return the content itself.
- Use short paragraphs separated by a blank line.
`.trim();

export async function aiGenerateSummary(btn) {
  const original = btn.textContent;
  btn.disabled = true; btn.textContent = 'Generating...';
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

    const raw = await callOllama(prompt);
    openAIDraftModal(sanitizeAIOutput(raw), 'summary');
  } catch (e) {
    showToast('AI error: ' + e.message, 'error', 5000);
  } finally {
    btn.disabled = false; btn.textContent = original;
  }
}

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

    const raw = await callOllama(prompt);
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

export async function aiDeepAnalysis(btn) {
  const jd = document.getElementById('jobDescription')?.value || '';
  if (!jd.trim()) return showToast('Paste a job description first.', 'warn');

  const original = btn.textContent;
  btn.disabled = true; btn.textContent = 'Analyzing...';
  try {
    const resumeText = JSON.stringify(resume, null, 2);
    const prompt = `You are an expert career coach and ATS specialist.
The candidate's resume and the target job description are below.

Give specific, actionable advice in this exact structure (plain text, no markdown, no asterisks):

1. Top 3 keyword gaps — words or phrases in the job description that are missing or underrepresented in the resume.
2. Three specific bullet rewrites — pick existing resume bullets and rewrite them to include the job's vocabulary while keeping them truthful.
3. One strategic note — a single sentence about positioning, seniority, or narrative.

Keep it under 220 words total. Do not use markdown formatting.

Resume (JSON):
${resumeText}

Job Description:
${jd}`;

    const raw = await callOllama(prompt);
    const output = document.getElementById('aiOutput');
    if (output) {
      output.textContent = sanitizeAIOutput(raw);
      output.classList.remove('hidden');
    }
  } catch (e) {
    showToast('AI error: ' + e.message, 'error', 5000);
  } finally {
    btn.disabled = false; btn.textContent = original;
  }
}