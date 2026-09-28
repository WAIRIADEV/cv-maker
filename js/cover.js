// js/cover.js
// Cover letter generator. Shares resume + JD context, streams from the
// active provider. Works with Ollama, Groq, and DeepSeek.

import { resume } from './state.js';
import { showToast } from './toast.js';
import { sanitizeAIOutput } from './utils.js';
import { callAI } from './ai-call.js';

const COVER_KEY = 'cv-maker-cover';

let coverText = '';

export function loadCover() {
  coverText = localStorage.getItem(COVER_KEY) || '';
  const el = document.getElementById('coverOutput');
  if (el) el.value = coverText;
}

export function saveCover(text) {
  coverText = text;
  localStorage.setItem(COVER_KEY, text);
}

export function clearCover() {
  coverText = '';
  localStorage.removeItem(COVER_KEY);
  const el = document.getElementById('coverOutput');
  if (el) el.value = '';
}

export function getCover() {
  return coverText;
}

export async function generateCoverLetter(btn) {
  const jd = document.getElementById('jobDescription')?.value || '';
  if (!jd.trim()) return showToast('Paste a job description on step 7 first.', 'warn');

  const company = document.getElementById('coverCompany')?.value?.trim() || '';
  const tone = document.getElementById('coverTone')?.value || 'professional';
  const output = document.getElementById('coverOutput');
  if (!output) return;

  output.value = '';
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Writing…';

  try {
    const prompt = buildPrompt(jd, company, tone);

    const raw = await callAI({
      prompt,
      maxTokens: 700,
      stream: true,
      onToken: (_, full) => { output.value = full; }
    });

    const cleaned = sanitizeAIOutput(raw);
    output.value = cleaned;
    saveCover(cleaned);
  } catch (e) {
    showToast('Cover letter error: ' + e.message, 'error', 5000);
    output.value = '';
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

function buildPrompt(jd, company, tone) {
  const compact = {
    name: resume.name,
    title: resume.title,
    summary: resume.summary,
    skills: resume.skills,
    experience: (resume.experience || []).map(e => ({
      role: e.role,
      company: e.company,
      bullets: (e.bullets || []).filter(Boolean).slice(0, 3)
    })),
    projects: (resume.projects || []).map(p => ({
      name: p.name,
      bullets: (p.bullets || []).filter(Boolean).slice(0, 2)
    }))
  };

  const toneGuidance = {
    professional: 'Clear, confident, and professional. Standard business tone.',
    warm: "Warm and personable. Show genuine interest in the company's mission.",
    bold: 'Confident and direct. Lead with impact and results.',
    formal: 'Formal and traditional. Suitable for conservative industries.'
  }[tone] || 'Professional.';

  return `You are a professional cover letter writer.

Write a compelling one-page cover letter for the job below.
Tone: ${toneGuidance}

Structure (follow exactly):
- Opening line: address "Dear Hiring Manager," on its own line
- Paragraph 1 (2-3 sentences): Hook - why this role, why this company. Reference specifics from the job description.
- Paragraph 2 (3-4 sentences): Evidence - pull the 2 strongest achievements from the resume that match the job's requirements. Include quantifiable results.
- Paragraph 3 (2-3 sentences): Fit - connect the candidate's broader strengths to the role's growth and future.
- Closing line: thank them, express interest in an interview
- Sign-off: "Sincerely," then the candidate's name on a new line

Rules:
- Plain text only. No markdown, no asterisks, no headers, no bullet points.
- No "[Your Name]" placeholders - use the real name from the resume.
- No preamble or meta-commentary. Just the letter.
- Between 250 and 350 words.
- Do NOT copy resume bullets verbatim - rephrase them for narrative flow.

Resume:
${JSON.stringify(compact)}

${company ? `Company: ${company}` : ''}

Job Description:
${jd}`;
}

export function initCover() {
  loadCover();
  const output = document.getElementById('coverOutput');
  output?.addEventListener('input', () => saveCover(output.value));
}