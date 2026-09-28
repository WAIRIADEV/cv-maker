// js/interview.js
// Generates likely interview questions based on the JD + ATS gaps.

import { resume } from './state.js';
import { showToast } from './toast.js';
import { sanitizeAIOutput } from './utils.js';
import { callAI } from './ai-call.js';

export async function generateInterviewPrep(btn) {
  const jd = document.getElementById('jobDescription')?.value || '';
  if (!jd.trim()) return showToast('Paste a job description first.', 'warn');

  const output = document.getElementById('interviewOutput');
  if (!output) return;

  output.textContent = '';
  output.classList.remove('hidden');

  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Preparing…';

  try {
    const prompt = buildPrompt(jd);

    const raw = await callAI({
      prompt,
      maxTokens: 600,
      onToken: (_, full) => { output.textContent = full; }
    });

    output.textContent = sanitizeAIOutput(raw);
  } catch (e) {
    showToast('Interview prep error: ' + e.message, 'error', 5000);
    output.classList.add('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

export function sendInterviewToChat() {
  const output = document.getElementById('interviewOutput');
  if (!output || !output.textContent.trim()) return;
  const input = document.getElementById('chatInput');
  if (!input) return;

  input.value = 'Here are my likely interview questions. Help me draft strong answers to the first three:\n\n' + output.textContent.slice(0, 800);
  input.focus();
  document.getElementById('chatPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildPrompt(jd) {
  const compact = {
    name: resume.name,
    title: resume.title,
    summary: resume.summary,
    skills: resume.skills,
    experience: (resume.experience || []).map(e => ({
      role: e.role,
      company: e.company,
      bullets: (e.bullets || []).filter(Boolean)
    }))
  };

  return `You are an interview coach. The candidate's resume and target job are below.

Generate a focused interview prep document with this exact structure:

LIKELY TECHNICAL QUESTIONS (3):
- One question per line, directly from the job description's requirements.
- After each question, add a short parenthetical note about what to focus on.

LIKELY BEHAVIORAL QUESTIONS (3):
- One question per line, based on the resume's experience.
- Each one sentence, using "Tell me about a time..." or "Describe a situation..." format.

QUESTIONS ABOUT GAPS (2):
- Two questions an interviewer might ask given areas where the resume is thin relative to the job.
- Each one sentence.

ELEVATOR PITCH (2 sentences):
- A short, confident answer to "Tell me about yourself" tailored to this specific role.

Rules:
- Plain text only. No markdown, no asterisks, no backticks.
- Keep the total under 300 words.
- Be specific to this resume and this job - no generic advice.

Resume:
${JSON.stringify(compact)}

Job Description:
${jd}`;
}