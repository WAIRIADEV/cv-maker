import { resume } from './state.js';
import { renderExperience, updatePreview, openAIDraftModal } from './ui.js';
import { sanitizeAIOutput } from './utils.js';

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
    alert('AI error: ' + e.message);
  } finally {
    btn.disabled = false; btn.textContent = original;
  }
}

export async function aiImproveBullets(index, btn) {
  const exp = resume.experience[index];
  const current = (exp.bullets || []).join('\n');
  if (!current.trim()) return alert('No bullets to improve.');

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
    alert('AI error: ' + e.message);
  } finally {
    btn.disabled = false; btn.textContent = original;
  }
}

export async function aiTailor(btn) {
  const jd = document.getElementById('jobDescription').value;
  if (!jd.trim()) return alert('Paste a job description first.');

  const original = btn.textContent;
  btn.disabled = true; btn.textContent = 'Analyzing...';
  try {
    const resumeText = JSON.stringify(resume, null, 2);
    const prompt = `You are a career coach. Compare this resume to the job description.
Give specific, actionable suggestions: missing keywords, skills to add, phrasing to improve.
Keep it concise. No markdown formatting.

${STRICT_FORMAT}

Resume:
${resumeText}

Job Description:
${jd}`;

    const raw = await callOllama(prompt);
    document.getElementById('aiOutput').innerText = sanitizeAIOutput(raw);
  } catch (e) {
    alert('AI error: ' + e.message);
  } finally {
    btn.disabled = false; btn.textContent = original;
  }
}