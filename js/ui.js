// js/ui.js
import { resume, SAMPLE_RESUME } from './state.js';
import { escapeHtml } from './utils.js';

/* ============================================================
   VIEW SWITCHING & TEMPLATES
   ============================================================ */
export const TEMPLATES = ['classic', 'modern', 'coral', 'emerald', 'minimal'];

export const TEMPLATE_META = {
  classic: {
    name: 'Classic Serif',
    desc: 'A traditional, formal layout with serif typography. Best for law, academia, finance, and any conservative industry.'
  },
  modern: {
    name: 'Modern Writer',
    desc: 'Clean sans-serif with a blue accent. A safe, professional default that works across industries.'
  },
  coral: {
    name: 'Coral',
    desc: 'Warm orange accent with custom bullet styling. Good for design, marketing, and creative roles.'
  },
  emerald: {
    name: 'Emerald',
    desc: 'Fresh green accent. Works well for healthcare, sustainability, and product roles.'
  },
  minimal: {
    name: 'Minimal',
    desc: 'Ultra-clean, mostly black and white. Maximum content, minimum decoration. Great for ATS-heavy applications.'
  }
};

export function switchView(view) {
  document.body.dataset.view = view;
  if (view === 'editor') {
    goToStep(1);
  } else {
    document.querySelectorAll('.template-card').forEach(card => {
      card.classList.toggle('active', card.dataset.template === resume.template);
    });
    const hasContent = !!(resume.name || resume.summary || resume.experience.length);
    document.getElementById('continueCta')?.classList.toggle('hidden', !hasContent);
  }
}

export function applyTemplate(name) {
  if (!TEMPLATES.includes(name)) name = 'modern';
  resume.template = name;
  updatePreview();
}

/* ============================================================
   RESUME RENDERER (shared)
   ============================================================ */
export function renderResumeHTML(data = resume) {
  const contact = [data.email, data.phone, data.location, data.website, data.linkedin, data.github]
    .filter(Boolean).map(escapeHtml).join(' &nbsp;•&nbsp; ');

  let html = `
    <h1>${escapeHtml(data.name) || 'Your Name'}</h1>
    <p style="font-size:12pt; color:#475569; margin-bottom:2px;">${escapeHtml(data.title) || 'Job Title'}</p>
    <p style="font-size:9.5pt; color:#64748b; margin-bottom:14px;">${contact}</p>
    ${data.summary ? `<h2>Summary</h2><p>${escapeHtml(data.summary).replace(/\n/g, '<br>')}</p>` : ''}
  `;

  if (data.experience?.some(e => e.company || e.role)) {
    html += `<h2>Experience</h2>`;
    data.experience.forEach(exp => {
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

  if (data.education?.some(e => e.school || e.degree)) {
    html += `<h2>Education</h2>`;
    data.education.forEach(edu => {
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

  if (data.projects?.some(p => p.name)) {
    html += `<h2>Projects</h2>`;
    data.projects.forEach(proj => {
      if (!proj.name) return;
      html += `<div style="margin-bottom:8px">
        <h3>${escapeHtml(proj.name)}${proj.link ? ` — <a href="${escapeHtml(proj.link)}">${escapeHtml(proj.link)}</a>` : ''}</h3>
        <ul>${(proj.bullets || []).filter(b => b.trim()).map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
      </div>`;
    });
  }

  if (data.skills) {
    html += `<h2>Skills</h2><p>${escapeHtml(data.skills).replace(/\n/g, '<br>')}</p>`;
  }

  return html;
}

/* ============================================================
   TEMPLATE GALLERY
   ============================================================ */
const BASE_WIDTH = 816; // 8.5in at 96dpi
const BASE_HEIGHT = 1056; // 11in at 96dpi

export function renderTemplateGallery() {
  const grid = document.getElementById('templateGrid');
  if (!grid) return;

  grid.innerHTML = TEMPLATES.map(name => {
    const meta = TEMPLATE_META[name];
    return `
      <button class="template-card" data-template="${name}" type="button">
        <div class="thumb">
          <div class="thumb-inner preview-container template-${name}"></div>
        </div>
        <div class="card-name">${escapeHtml(meta.name)}</div>
        <div class="card-sub">${escapeHtml(meta.desc.split('.')[0])}</div>
      </button>
    `;
  }).join('');

  // Fill thumbnails with sample content
  grid.querySelectorAll('.thumb-inner').forEach(inner => {
    inner.innerHTML = renderResumeHTML(SAMPLE_RESUME);
  });

  scaleThumbnails();
  syncActiveCard();
}

export function scaleThumbnails() {
  document.querySelectorAll('.thumb').forEach(thumb => {
    const inner = thumb.querySelector('.thumb-inner');
    if (!inner) return;
    const scale = thumb.clientWidth / BASE_WIDTH;
    inner.style.transform = `scale(${scale})`;
  });
}

function syncActiveCard() {
  document.querySelectorAll('.template-card').forEach(card => {
    card.classList.toggle('active', card.dataset.template === resume.template);
  });
}

/* ============================================================
   TEMPLATE PREVIEW MODAL
   ============================================================ */
let previewingTemplate = null;

export function openTemplatePreview(name) {
  if (!TEMPLATES.includes(name)) return;
  previewingTemplate = name;

  const modal = document.getElementById('templateModal');
  const preview = document.getElementById('templateModalPreview');
  const nameEl = document.getElementById('templateModalName');
  const descEl = document.getElementById('templateModalDesc');
  if (!modal || !preview) return;

  const meta = TEMPLATE_META[name];
  preview.className = `template-preview-inner preview-container template-${name}`;
  preview.innerHTML = renderResumeHTML(SAMPLE_RESUME);
  nameEl.textContent = meta.name;
  descEl.textContent = meta.desc;

  modal.classList.remove('hidden');
  // Scale after the modal is visible so clientWidth is correct
  requestAnimationFrame(scaleModalPreview);
}

export function closeTemplatePreview() {
  const modal = document.getElementById('templateModal');
  modal?.classList.add('hidden');
  previewingTemplate = null;
}

export function confirmTemplatePreview() {
  if (!previewingTemplate) return;
  applyTemplate(previewingTemplate);
  closeTemplatePreview();
  switchView('editor');
}

function scaleModalPreview() {
  const frame = document.querySelector('.template-preview-frame');
  const inner = document.getElementById('templateModalPreview');
  if (!frame || !inner) return;
  const scale = frame.clientWidth / BASE_WIDTH;
  inner.style.transform = `scale(${scale})`;
}

export function initTemplateModal() {
  document.getElementById('templateModalClose')?.addEventListener('click', closeTemplatePreview);
  document.getElementById('templateCancelBtn')?.addEventListener('click', closeTemplatePreview);
  document.getElementById('templateUseBtn')?.addEventListener('click', confirmTemplatePreview);

  const modal = document.getElementById('templateModal');
  modal?.addEventListener('click', e => {
    if (e.target === modal) closeTemplatePreview();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeTemplatePreview();
    }
  });
}

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
  renderExperience(); updatePreview();
}
export function removeExperience(i) {
  resume.experience.splice(i, 1);
  renderExperience(); updatePreview();
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
  renderEducation(); updatePreview();
}
export function removeEducation(i) {
  resume.education.splice(i, 1);
  renderEducation(); updatePreview();
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
  renderProjects(); updatePreview();
}
export function removeProject(i) {
  resume.projects.splice(i, 1);
  renderProjects(); updatePreview();
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

  preview.classList.remove(...TEMPLATES.map(t => `template-${t}`));
  preview.classList.add(`template-${resume.template || 'modern'}`);
  preview.innerHTML = renderResumeHTML(resume);
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