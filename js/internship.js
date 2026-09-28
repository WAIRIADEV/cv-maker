// js/internship.js
// Context-aware internship requirement matcher.

import { resume } from './state.js';
import { showToast } from './toast.js';
import { sanitizeAIOutput } from './utils.js';
import { callAI } from './ai-call.js';

export async function matchInternshipRequirements(btn) {
  const input = document.getElementById('internshipInput');
  const requirements = input?.value?.trim() || '';
  if (!requirements) return showToast('Paste the internship requirements first.', 'warn');

  const output = document.getElementById('internshipOutput');
  if (!output) return;

  output.textContent = '';
  output.classList.remove('hidden');

  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Matching…';

  try {
    const prompt = buildPrompt(requirements);

    const raw = await callAI({
      prompt,
      maxTokens: 600,
      onToken: (_, full) => { output.textContent = full; }
    });

    output.textContent = sanitizeAIOutput(raw);
  } catch (e) {
    showToast('Internship match error: ' + e.message, 'error', 5000);
    output.classList.add('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

export function sendInternshipToChat() {
  const input = document.getElementById('internshipInput');
  const output = document.getElementById('internshipOutput');
  if (!input || !output) return;

  const chat = document.getElementById('chatInput');
  if (!chat) return;

  chat.value = `Help me strengthen my resume for these internship requirements:\n\n${input.value}\n\nYour match analysis said:\n\n${output.textContent.slice(0, 600)}\n\nWhat should I add or rewrite first?`;
  chat.focus();
  document.getElementById('chatPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildPrompt(requirements) {
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
      school: e.school,
      details: e.details
    })),
    projects: (resume.projects || []).map(p => ({
      name: p.name,
      bullets: (p.bullets || []).filter(Boolean)
    }))
  };

  return `You are an internship application coach.

The candidate wants to apply for an internship. Their resume is below.
The internship requirements are listed as plain text.

Analyze how well the resume matches each requirement. Use this structure:

STRONG MATCHES:
- Requirements fully covered by the resume. One per line, with a short reason.

PARTIAL MATCHES:
- Requirements partially covered. Note what's there and what's thin.

GAPS:
- Requirements with no clear evidence in the resume.

QUICK WINS (3-4 items):
- Concrete, specific things the candidate could add or rewrite to close the biggest gaps. One actionable sentence each.

Rules:
- Plain text only. No markdown, no asterisks, no headers with # or ##.
- Under 300 words.
- Be specific to this resume - no generic internship advice.
- Assume the candidate is applying now, so keep advice achievable in a few hours.

Resume:
${JSON.stringify(compact)}

Internship Requirements:
${requirements}`;
}