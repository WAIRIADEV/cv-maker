// js/ui.js
import { resume } from './state.js';
import { escapeHtml } from './utils.js';

/* ============================================================
   STEP NAVIGATION
   ============================================================ */
const TOTAL_STEPS = 7;
let currentStep = 1;

export function goToStep(n) {
  currentStep = Math.max(1, Math.min(TOTAL_STEPS, n));

  document.querySelectorAll('.page').forEach(p => {
    p.classList.toggle('active', Number(p.dataset.page) === currentStep);
  });

  document.querySelectorAll('.stepper li').forEach(li => {
    const step = Number(li.dataset.step);
    li.classList.toggle('active', step === currentStep);
    li.classList.toggle('done', step < currentStep);
  });

  document.querySelectorAll('.step-counter').forEach(el => {
    el.textContent = `Step ${currentStep} of ${TOTAL_STEPS}`;
  });
  const mobileProgress = document.querySelector('.mobile-progress');
  if (mobileProgress) {
    const label = document.querySelector(`.stepper li[data-step="${currentStep}"] .step-label`)?.textContent || '';
    mobileProgress.textContent = `Step ${currentStep} of ${TOTAL_STEPS} · ${label}`;
  }

  const prev = document.getElementById('prevBtn');
  const next = document.getElementById('nextBtn');
  if (prev) prev.disabled = currentStep === 1;
  if (next) {
    next.disabled = currentStep === TOTAL_STEPS;
    next.classList.toggle('hidden', currentStep === TOTAL_STEPS);
  }

  document.querySelector('.editor')?.scrollTo({ top: 0, behavior: 'smooth' });
}

export function initStepper() {
  document.querySelectorAll('.stepper li').forEach(li => {
    li.addEventListener('click', () => goToStep(Number(li.dataset.step)));
  });
  document.getElementById('prevBtn')?.addEventListener('click', () => goToStep(currentStep - 1));
  document.getElementById('nextBtn')?.addEventListener('click', () => goToStep(currentStep + 1));
  goToStep(1);
}

export function togglePreview() {
  document.getElementById('previewPanel')?.classList.toggle('open');
}
export function closePreview() {
  document.getElementById('previewPanel')?.classList.remove('open');
}

/* ============================================================
   EXPERIENCE
   ============================================================ */
export function renderExperience() {
  const container = document.getElementById('experienceList');
  if (!container) return;

  if (!resume.experience.length) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        <p>No experience added yet. Click below to add your first role.</p>
      </div>`;
    return;
  }

  container.innerHTML = resume.experience.map((exp, i) => `
    <div class="entry-card" data-index="${i}">
      <div class="entry-card-header">
        <span class="entry-card-title">Experience ${i + 1}</span>
        <button type="button" class="entry-remove" data-action="remove" data-section="experience" data-index="${i}">Remove</button>
      </div>
      <div class="entry-row">
        <input data-field="role" value="${escapeHtml(exp.role)}" placeholder="Role (e.g. Senior Designer)" />
        <input data-field="company" value="${escapeHtml(exp.company)}" placeholder="Company" />
      </div>
      <div class="entry-row">
        <input data-field="start" value="${escapeHtml(exp.start)}" placeholder="Start (e.g. Jan 2022)" />
        <input data-field="end" value="${escapeHtml(exp.end)}" placeholder="End (e.g. Present)" />
      </div>
      <div class="entry-row">
        <input data-field="location" value="${escapeHtml(exp.location)}" placeholder="Location" class="entry-full" />
      </div>
      <textarea data-field="bullets" rows="4" placeholder="Bullet points — one per line"
                class="textarea" style="font-size:13px">${escapeHtml((exp.bullets || []).join('\n'))}</textarea>
      <div class="entry-actions">
        <button type="button" class="btn btn-ai btn-sm" data-action="ai-improve" data-index="${i}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          AI Improve
        </button>
      </div>
    </div>
  `).join('');
}

export function addExperience() {
  resume.experience.push({ company: '', role: '', start: '', end: '', location: '', bullets: [] });
  renderExperience();
  updatePreview();
}
export function removeExperience(i) {
  resume.experience.splice(i, 1);
  renderExperience();
  updatePreview();
}

/* ============================================================
   EDUCATION
   ============================================================ */
export function renderEducation() {
  const container = document.getElementById('educationList');
  if (!container) return;

  if (!resume.education.length) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>
        <p>No education added yet. Click below to add a degree or certification.</p>
      </div>`;
    return;
  }

  container.innerHTML = resume.education.map((edu, i) => `
    <div class="entry-card" data-index="${i}">
      <div class="entry-card-header">
        <span class="entry-card-title">Education ${i + 1}</span>
        <button type="button" class="entry-remove" data-action="remove" data-section="education" data-index="${i}">Remove</button>
      </div>
      <div class="entry-row">
        <input data-field="degree" value="${escapeHtml(edu.degree)}" placeholder="Degree (e.g. BSc Computer Science)" />
        <input data-field="school" value="${escapeHtml(edu.school)}" placeholder="School / University" />
      </div>
      <div class="entry-row">
        <input data-field="start" value="${escapeHtml(edu.start)}" placeholder="Start year" />
        <input data-field="end" value="${escapeHtml(edu.end)}" placeholder="End year" />
      </div>
      <div class="entry-row">
        <input data-field="location" value="${escapeHtml(edu.location)}" placeholder="Location" class="entry-full" />
      </div>
      <textarea data-field="details" rows="2" placeholder="Details (optional)"
                class="textarea" style="font-size:13px">${escapeHtml(edu.details)}</textarea>
    </div>
  `).join('');
}

export function addEducation() {
  resume.education.push({ school: '', degree: '', start: '', end: '', location: '', details: '' });
  renderEducation();
  updatePreview();
}
export function removeEducation(i) {
  resume.education.splice(i, 1);
  renderEducation();
  updatePreview();
}

/* ============================================================
   PROJECTS
   ============================================================ */
export function renderProjects() {
  const container = document.getElementById('projectList');
  if (!container) return;

  if (!resume.projects.length) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 6h20v14H2z"/><path d="M2 10h20"/></svg>
        <p>No projects added yet. Click below to showcase your work.</p>
      </div>`;
    return;
  }

  container.innerHTML = resume.projects.map((proj, i) => `
    <div class="entry-card" data-index="${i}">
      <div class="entry-card-header">
        <span class="entry-card-title">Project ${i + 1}</span>
        <button type="button" class="entry-remove" data-action="remove" data-section="projects" data-index="${i}">Remove</button>
      </div>
      <div class="entry-row">
        <input data-field="name" value="${escapeHtml(proj.name)}" placeholder="Project name" />
        <input data-field="link" value="${escapeHtml(proj.link)}" placeholder="Link (optional)" />
      </div>
      <textarea data-field="bullets" rows="3" placeholder="Description / highlights — one per line"
                class="textarea" style="font-size:13px">${escapeHtml((proj.bullets || []).join('\n'))}</textarea>
    </div>
  `).join('');
}

export function addProject() {
  resume.projects.push({ name: '', link: '', bullets: [] });
  renderProjects();
  updatePreview();
}
export function removeProject(i) {
  resume.projects.splice(i, 1);
  renderProjects();
  updatePreview();
}

/* ============================================================
   RENDER ALL
   ============================================================ */
export function renderAll() {
  renderExperience();
  renderEducation();
  renderProjects();
}

/* ============================================================
   LIVE PREVIEW
   ============================================================ */
export function updatePreview() {
  const preview = document.getElementById('preview');
  if (!preview) return;

  const contact = [resume.email, resume.phone, resume.location, resume.website, resume.linkedin, resume.github]
    .filter(Boolean).map(escapeHtml).join(' &nbsp;•&nbsp; ');

  let html = `
    <h1>${escapeHtml(resume.name) || 'Your Name'}</h1>
    <p style="font-size:12pt; color:#475569; margin-bottom:2px;">${escapeHtml(resume.title) || 'Job Title'}</p>
    <p style="font-size:9.5pt; color:#64748b; margin-bottom:14px;">${contact}</p>
    ${resume.summary ? `<h2>Summary</h2><p>${escapeHtml(resume.summary).replace(/\n/g, '<br>')}</p>` : ''}
  `;

  if (resume.experience.some(e => e.company || e.role)) {
    html += `<h2>Experience</h2>`;
    resume.experience.forEach(exp => {
      if (!exp.company && !exp.role) return;
      html += `<div style="margin-bottom:12px">
        <h3>${escapeHtml(exp.role)}${exp.company ? ' — ' + escapeHtml(exp.company) : ''}</h3>
        <p style="font-size:9.5pt; color:#64748b; margin-bottom:4px;">
          ${escapeHtml(exp.start)}${exp.end ? ' – ' + escapeHtml(exp.end) : ''}${exp.location ? ' · ' + escapeHtml(exp.location) : ''}
        </p>
        <ul>${(exp.bullets || []).filter(b => b.trim()).map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
      </div>`;
    });
  }

  if (resume.education.some(e => e.school || e.degree)) {
    html += `<h2>Education</h2>`;
    resume.education.forEach(edu => {
      if (!edu.school && !edu.degree) return;
      html += `<div style="margin-bottom:8px">
        <h3>${escapeHtml(edu.degree)}${edu.school ? ' — ' + escapeHtml(edu.school) : ''}</h3>
        <p style="font-size:9.5pt; color:#64748b;">
          ${escapeHtml(edu.start)}${edu.end ? ' – ' + escapeHtml(edu.end) : ''}${edu.location ? ' · ' + escapeHtml(edu.location) : ''}
        </p>
        ${edu.details ? `<p>${escapeHtml(edu.details)}</p>` : ''}
      </div>`;
    });
  }

  if (resume.projects.some(p => p.name)) {
    html += `<h2>Projects</h2>`;
    resume.projects.forEach(proj => {
      if (!proj.name) return;
      html += `<div style="margin-bottom:8px">
        <h3>${escapeHtml(proj.name)}${proj.link ? ` — <a href="${escapeHtml(proj.link)}">${escapeHtml(proj.link)}</a>` : ''}</h3>
        <ul>${(proj.bullets || []).filter(b => b.trim()).map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
      </div>`;
    });
  }

  if (resume.skills) {
    html += `<h2>Skills</h2><p>${escapeHtml(resume.skills).replace(/\n/g, '<br>')}</p>`;
  }

  preview.innerHTML = html;
}

/* ============================================================
   TOP-LEVEL INPUTS
   ============================================================ */
const TOP_LEVEL_FIELDS = [
  'name', 'title', 'email', 'phone', 'location',
  'website', 'linkedin', 'github', 'summary', 'skills'
];

export function populateInputs() {
  TOP_LEVEL_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = resume[id] || '';
  });
}

export function bindTopLevelInputs() {
  TOP_LEVEL_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      resume[id] = el.value;
      updatePreview();
    });
  });
}

/* ============================================================
   EVENT DELEGATION
   ============================================================ */
export function initUI() {
  ['experienceList', 'educationList', 'projectList'].forEach(id => {
    const container = document.getElementById(id);
    if (!container) return;

    container.addEventListener('input', e => {
      const wrapper = e.target.closest('[data-index]');
      if (!wrapper) return;
      const index = Number(wrapper.dataset.index);
      const field = e.target.dataset.field;
      if (!field) return;

      const collection =
        id === 'experienceList' ? resume.experience :
        id === 'educationList'  ? resume.education :
                                  resume.projects;

      const entry = collection[index];
      if (!entry) return;

      if (field === 'bullets') entry.bullets = e.target.value.split('\n');
      else entry[field] = e.target.value;
      updatePreview();
    });

    container.addEventListener('click', e => {
      const btn = e.target.closest('[data-action="remove"]');
      if (!btn) return;
      const index = Number(btn.dataset.index);
      const section = btn.dataset.section;
      if (section === 'experience') removeExperience(index);
      if (section === 'education')  removeEducation(index);
      if (section === 'projects')   removeProject(index);
    });
  });
}

/* ============================================================
   AI DRAFT MODAL
   ============================================================ */
let onAIApply = null;

export function openAIDraftModal(text, target) {
  const modal = document.getElementById('aiModal');
  const draft = document.getElementById('aiDraft');
  if (!modal || !draft) return;
  draft.value = text;
  modal.classList.remove('hidden');

  onAIApply = (edited) => {
    if (target === 'summary') {
      resume.summary = edited;
      const el = document.getElementById('summary');
      if (el) el.value = edited;
      updatePreview();
    }
  };
}

export function initAIModal() {
  const modal = document.getElementById('aiModal');
  const draft = document.getElementById('aiDraft');
  if (!modal) return;
  const close = () => modal.classList.add('hidden');

  document.getElementById('aiModalClose')?.addEventListener('click', close);
  document.getElementById('aiModalCancel')?.addEventListener('click', close);
  document.getElementById('aiModalApply')?.addEventListener('click', () => {
    if (onAIApply) onAIApply(draft.value);
    close();
  });
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
}