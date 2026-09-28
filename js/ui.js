// js/ui.js
import { resume, SAMPLE_RESUME } from './state.js';
import { escapeHtml } from './utils.js';
import { scoreTier } from './ats.js';
import { showToast } from './toast.js';

/* ============================================================
   VIEW SWITCHING & TEMPLATES
   ============================================================ */
export const TEMPLATES = ['classic', 'modern', 'coral', 'emerald', 'minimal', 'twocolumn', 'timeline', 'academic'];

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
  },
  twocolumn: {
    name: 'Two-Column',
    desc: 'Sidebar with contact, skills, and education; main area with experience. Dense, information-rich, ideal for senior roles.'
  },
  timeline: {
    name: 'Timeline',
    desc: 'Vertical timeline with nodes for each role. Great for showing career progression and continuous history.'
  },
  academic: {
    name: 'Academic',
    desc: 'Formal serif layout with generous spacing. Designed for research, teaching, and academic CV conventions.'
  }
};

const DEFAULT_SECTION_ORDER = ['summary', 'experience', 'education', 'projects', 'skills'];
const SECTION_LABELS = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  skills: 'Skills'
};

function normalizeSectionOrder(order) {
  if (!Array.isArray(order) || !order.length) return [...DEFAULT_SECTION_ORDER];
  const known = new Set(DEFAULT_SECTION_ORDER);
  const filtered = order.filter(k => known.has(k));
  const missing = DEFAULT_SECTION_ORDER.filter(k => !filtered.includes(k));
  return [...filtered, ...missing];
}

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
   RESUME RENDERER — flat layout
   ============================================================ */
function renderSectionHTML(key, data) {
  switch (key) {
    case 'summary': {
      if (!data.summary) return '';
      return `<section class="resume-section"><h2>Summary</h2><p>${escapeHtml(data.summary).replace(/\n/g, '<br>')}</p></section>`;
    }
    case 'experience': {
      if (!data.experience?.some(e => e.company || e.role)) return '';
      let h = '<section class="resume-section"><h2>Experience</h2>';
      data.experience.forEach(exp => {
        if (!exp.company && !exp.role) return;
        h += `<div class="resume-item">
          <h3>${escapeHtml(exp.role)}${exp.company ? ' — ' + escapeHtml(exp.company) : ''}</h3>
          <p class="resume-meta">
            ${escapeHtml(exp.start)}${exp.end ? ' – ' + escapeHtml(exp.end) : ''}${exp.location ? ' · ' + escapeHtml(exp.location) : ''}
          </p>
          <ul>${(exp.bullets || []).filter(b => b.trim()).map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
        </div>`;
      });
      return h + '</section>';
    }
    case 'education': {
      if (!data.education?.some(e => e.school || e.degree)) return '';
      let h = '<section class="resume-section"><h2>Education</h2>';
      data.education.forEach(edu => {
        if (!edu.school && !edu.degree) return;
        h += `<div class="resume-item">
          <h3>${escapeHtml(edu.degree)}${edu.school ? ' — ' + escapeHtml(edu.school) : ''}</h3>
          <p class="resume-meta">
            ${escapeHtml(edu.start)}${edu.end ? ' – ' + escapeHtml(edu.end) : ''}${edu.location ? ' · ' + escapeHtml(edu.location) : ''}
          </p>
          ${edu.details ? `<p>${escapeHtml(edu.details)}</p>` : ''}
        </div>`;
      });
      return h + '</section>';
    }
    case 'projects': {
      if (!data.projects?.some(p => p.name)) return '';
      let h = '<section class="resume-section"><h2>Projects</h2>';
      data.projects.forEach(proj => {
        if (!proj.name) return;
        h += `<div class="resume-item">
          <h3>${escapeHtml(proj.name)}${proj.link ? ` — <a href="${escapeHtml(proj.link)}">${escapeHtml(proj.link)}</a>` : ''}</h3>
          <ul>${(proj.bullets || []).filter(b => b.trim()).map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
        </div>`;
      });
      return h + '</section>';
    }
    case 'skills': {
      if (!data.skills) return '';
      return `<section class="resume-section"><h2>Skills</h2><p>${escapeHtml(data.skills).replace(/\n/g, '<br>')}</p></section>`;
    }
    default: return '';
  }
}

function renderFlatHTML(data) {
  const contact = [data.email, data.phone, data.location, data.website, data.linkedin, data.github]
    .filter(Boolean).map(escapeHtml).join(' &nbsp;•&nbsp; ');

  let html = `
    <header class="resume-header">
      <h1>${escapeHtml(data.name) || 'Your Name'}</h1>
      <p class="resume-title">${escapeHtml(data.title) || 'Job Title'}</p>
      <p class="resume-contact">${contact}</p>
    </header>
  `;

  const order = normalizeSectionOrder(data.sectionOrder);
  order.forEach(key => { html += renderSectionHTML(key, data); });
  return html;
}

/* ============================================================
   RESUME RENDERER — two-column layout
   ============================================================ */
function splitSkills(skills) {
  return String(skills || '')
    .split(/[,·•\n|;]/)
    .map(s => s.trim())
    .filter(Boolean);
}

function renderTwoColumnHTML(data) {
  const contact = [data.email, data.phone, data.location, data.website, data.linkedin, data.github]
    .filter(Boolean).map(escapeHtml);

  const sidebar = `
    <aside class="resume-sidebar">
      ${contact.length ? `
        <div class="resume-sidebar-block">
          <h2>Contact</h2>
          <ul class="resume-contact-list">
            ${contact.map(c => `<li>${c}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      ${data.skills ? `
        <div class="resume-sidebar-block">
          <h2>Skills</h2>
          <ul class="resume-skill-list">
            ${splitSkills(data.skills).map(s => `<li>${escapeHtml(s)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      ${data.education?.length ? `
        <div class="resume-sidebar-block">
          <h2>Education</h2>
          ${data.education.map(edu => `
            <div class="resume-sidebar-item">
              <h3>${escapeHtml(edu.degree) || 'Degree'}</h3>
              <p>${escapeHtml(edu.school) || ''}</p>
              <p class="resume-meta">${escapeHtml(edu.start)}${edu.end ? ' – ' + escapeHtml(edu.end) : ''}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </aside>
  `;

  let main = `
    <div class="resume-main">
      <header class="resume-header">
        <h1>${escapeHtml(data.name) || 'Your Name'}</h1>
        <p class="resume-title">${escapeHtml(data.title) || 'Job Title'}</p>
      </header>
  `;

  if (data.summary) {
    main += `<section class="resume-section"><h2>Summary</h2><p>${escapeHtml(data.summary).replace(/\n/g, '<br>')}</p></section>`;
  }

  if (data.experience?.some(e => e.company || e.role)) {
    main += `<section class="resume-section"><h2>Experience</h2>`;
    data.experience.forEach(exp => {
      if (!exp.company && !exp.role) return;
      main += `<div class="resume-item">
        <h3>${escapeHtml(exp.role)}</h3>
        <p class="resume-meta">${escapeHtml(exp.company)}${exp.location ? ' · ' + escapeHtml(exp.location) : ''} · ${escapeHtml(exp.start)}${exp.end ? ' – ' + escapeHtml(exp.end) : ''}</p>
        <ul>${(exp.bullets || []).filter(b => b.trim()).map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
      </div>`;
    });
    main += `</section>`;
  }

  if (data.projects?.some(p => p.name)) {
    main += `<section class="resume-section"><h2>Projects</h2>`;
    data.projects.forEach(proj => {
      if (!proj.name) return;
      main += `<div class="resume-item">
        <h3>${escapeHtml(proj.name)}${proj.link ? ` — <a href="${escapeHtml(proj.link)}">${escapeHtml(proj.link)}</a>` : ''}</h3>
        <ul>${(proj.bullets || []).filter(b => b.trim()).map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
      </div>`;
    });
    main += `</section>`;
  }

  main += `</div>`;

  return sidebar + main;
}

/* ============================================================
   PUBLIC RENDER ENTRY POINT
   ============================================================ */
export function renderResumeHTML(data = resume) {
  const tmpl = data.template || 'modern';
  if (tmpl === 'twocolumn') return renderTwoColumnHTML(data);
  return renderFlatHTML(data);
}

/* ============================================================
   TEMPLATE GALLERY
   ============================================================ */
const BASE_WIDTH = 816;
const BASE_HEIGHT = 1056;

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

  grid.querySelectorAll('.thumb-inner').forEach(inner => {
    const tmpl = inner.classList.contains('template-twocolumn') ? { ...SAMPLE_RESUME, template: 'twocolumn' } : SAMPLE_RESUME;
    inner.innerHTML = renderResumeHTML(tmpl);
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
  const sample = name === 'twocolumn' ? { ...SAMPLE_RESUME, template: 'twocolumn' } : SAMPLE_RESUME;
  preview.innerHTML = renderResumeHTML(sample);
  nameEl.textContent = meta.name;
  descEl.textContent = meta.desc;

  modal.classList.remove('hidden');
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
const TOTAL_STEPS = 8;
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

  window.scrollTo({ top: 0, behavior: 'smooth' });
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
   ENTRY CARD TEMPLATE HELPERS
   ============================================================ */
function entryCardHeader(label, index, section) {
  return `
    <div class="entry-card-header">
      <div class="entry-drag" title="Drag to reorder" aria-label="Drag to reorder">⋮⋮</div>
      <span class="entry-card-title">${escapeHtml(label)}</span>
      <button type="button" class="entry-action" data-action="duplicate" data-section="${section}" data-index="${index}" title="Duplicate this entry">Duplicate</button>
      <button type="button" class="entry-remove" data-action="remove" data-section="${section}" data-index="${index}">Remove</button>
    </div>
  `;
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
      ${entryCardHeader(`Experience ${i + 1}`, i, 'experience')}
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
export function duplicateExperience(i) {
  const clone = JSON.parse(JSON.stringify(resume.experience[i]));
  resume.experience.splice(i + 1, 0, clone);
  renderExperience(); updatePreview();
  showToast('Experience duplicated', 'success');
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
      ${entryCardHeader(`Education ${i + 1}`, i, 'education')}
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
export function duplicateEducation(i) {
  const clone = JSON.parse(JSON.stringify(resume.education[i]));
  resume.education.splice(i + 1, 0, clone);
  renderEducation(); updatePreview();
  showToast('Education duplicated', 'success');
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
      ${entryCardHeader(`Project ${i + 1}`, i, 'projects')}
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
export function duplicateProject(i) {
  const clone = JSON.parse(JSON.stringify(resume.projects[i]));
  resume.projects.splice(i + 1, 0, clone);
  renderProjects(); updatePreview();
  showToast('Project duplicated', 'success');
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
   SECTION ORDER (step 7)
   ============================================================ */
export function renderSectionOrder() {
  const list = document.getElementById('sectionOrderList');
  if (!list) return;

  resume.sectionOrder = normalizeSectionOrder(resume.sectionOrder);

  list.innerHTML = resume.sectionOrder.map((key, i) => `
    <div class="section-order-item" data-section-key="${key}" data-index="${i}" draggable="true">
      <div class="section-order-handle">⋮⋮</div>
      <span>${escapeHtml(SECTION_LABELS[key] || key)}</span>
    </div>
  `).join('');
}

function initSectionOrderDrag() {
  const list = document.getElementById('sectionOrderList');
  if (!list) return;

  let draggingKey = null;

  list.addEventListener('dragstart', e => {
    const item = e.target.closest('.section-order-item');
    if (!item) return;
    draggingKey = item.dataset.sectionKey;
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggingKey);
  });

  list.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const over = e.target.closest('.section-order-item');
    if (!over) return;
    list.querySelectorAll('.section-order-item').forEach(i => {
      i.classList.toggle('drop-target', i === over && i.dataset.sectionKey !== draggingKey);
    });
  });

  list.addEventListener('dragleave', e => {
    if (!list.contains(e.relatedTarget)) {
      list.querySelectorAll('.section-order-item').forEach(i => i.classList.remove('drop-target'));
    }
  });

  list.addEventListener('drop', e => {
    e.preventDefault();
    const target = e.target.closest('.section-order-item');
    if (!target || !draggingKey) return;
    const targetKey = target.dataset.sectionKey;
    if (targetKey === draggingKey) return;

    const order = [...resume.sectionOrder];
    const fromIdx = order.indexOf(draggingKey);
    const toIdx = order.indexOf(targetKey);
    if (fromIdx < 0 || toIdx < 0) return;

    order.splice(fromIdx, 1);
    order.splice(toIdx, 0, draggingKey);
    resume.sectionOrder = order;

    draggingKey = null;
    renderSectionOrder();
    updatePreview();
  });

  list.addEventListener('dragend', () => {
    draggingKey = null;
    list.querySelectorAll('.section-order-item').forEach(i => {
      i.classList.remove('dragging', 'drop-target');
    });
  });
}

/* ============================================================
   EVENT DELEGATION
   ============================================================ */
export function initUI() {
  const SECTION_MAP = {
    experienceList: { key: 'experience', collection: () => resume.experience, rerender: renderExperience },
    educationList:  { key: 'education',  collection: () => resume.education,  rerender: renderEducation },
    projectList:    { key: 'projects',   collection: () => resume.projects,   rerender: renderProjects }
  };

  Object.keys(SECTION_MAP).forEach(id => {
    const container = document.getElementById(id);
    if (!container) return;
    const { collection, rerender } = SECTION_MAP[id];

    container.addEventListener('input', e => {
      const wrapper = e.target.closest('[data-index]');
      if (!wrapper) return;
      const index = Number(wrapper.dataset.index);
      const field = e.target.dataset.field;
      if (!field) return;
      const entry = collection()[index];
      if (!entry) return;
      if (field === 'bullets') entry.bullets = e.target.value.split('\n');
      else entry[field] = e.target.value;
      updatePreview();
    });

    container.addEventListener('click', e => {
      const dupBtn = e.target.closest('[data-action="duplicate"]');
      if (dupBtn) {
        const index = Number(dupBtn.dataset.index);
        const section = dupBtn.dataset.section;
        if (section === 'experience') duplicateExperience(index);
        if (section === 'education')  duplicateEducation(index);
        if (section === 'projects')   duplicateProject(index);
        return;
      }

      const btn = e.target.closest('[data-action="remove"]');
      if (!btn) return;
      const index = Number(btn.dataset.index);
      const section = btn.dataset.section;
      if (section === 'experience') removeExperience(index);
      if (section === 'education')  removeEducation(index);
      if (section === 'projects')   removeProject(index);
    });

    let draggingIndex = null;
    container.addEventListener('dragstart', e => {
      const card = e.target.closest('.entry-card');
      const handle = e.target.closest('.entry-drag');
      if (!card || !handle) return;
      draggingIndex = Number(card.dataset.index);
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(draggingIndex));
    });

    container.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const over = e.target.closest('.entry-card');
      if (!over) return;
      const overIdx = Number(over.dataset.index);
      container.querySelectorAll('.entry-card').forEach(c => {
        c.classList.toggle('drop-target', c === over && overIdx !== draggingIndex);
      });
    });

    container.addEventListener('dragleave', e => {
      if (!container.contains(e.relatedTarget)) {
        container.querySelectorAll('.entry-card').forEach(c => c.classList.remove('drop-target'));
      }
    });

    container.addEventListener('drop', e => {
      e.preventDefault();
      const over = e.target.closest('.entry-card');
      if (!over || draggingIndex === null) return;
      const targetIndex = Number(over.dataset.index);
      if (targetIndex === draggingIndex) return;

      const arr = collection();
      const [moved] = arr.splice(draggingIndex, 1);
      arr.splice(targetIndex, 0, moved);

      draggingIndex = null;
      rerender();
      updatePreview();
    });

    container.addEventListener('dragend', () => {
      draggingIndex = null;
      container.querySelectorAll('.entry-card').forEach(c => {
        c.classList.remove('dragging', 'drop-target');
      });
    });
  });

  initSectionOrderDrag();
}

/* ============================================================
   ATS RESULTS RENDERING
   ============================================================ */
const SCORE_MESSAGES = {
  high: {
    title: 'Strong match',
    body: 'Your resume covers most of the keywords recruiters and ATS filters look for. Keep the phrasing specific and quantified.'
  },
  mid: {
    title: 'Decent match — room to improve',
    body: 'Your resume hits about half of what this role asks for. Weave the high-priority missing keywords below into your summary, skills, or experience bullets — naturally.'
  },
  low: {
    title: 'Weak match',
    body: 'Many of the keywords this job emphasizes are missing. Address the high-priority ones first, then re-scan. Don\'t keyword-stuff — rephrase your real experience to include their vocabulary.'
  }
};

function chipHTML(kw, type) {
  const cls = type === 'matched'
    ? 'ats-chip matched'
    : kw.weight >= 1.5 ? 'ats-chip missing high' : 'ats-chip missing';
  return `<span class="${cls}">${escapeHtml(kw.term)}</span>`;
}

export function renderATSResults(result) {
  const panel = document.getElementById('atsResults');
  if (!panel) return;

  const tier = scoreTier(result.score);
  const msg = SCORE_MESSAGES[tier];
  const circumference = 2 * Math.PI * 52;
  const offset = circumference * (1 - result.score / 100);
  const matchedCount = result.matched.length;
  const totalCount = result.total;

  const matchedHTML = matchedCount
    ? result.matched.map(k => chipHTML(k, 'matched')).join('')
    : `<p class="ats-empty">No keywords from the job description matched your resume yet.</p>`;

  const highMissing = result.highPriorityMissing;
  const lowMissing = result.missing.filter(m => m.weight < 1.5);

  let missingHTML = '';
  if (highMissing.length) {
    missingHTML += `
      <div class="ats-section">
        <h5>High priority missing <span class="ats-count">(${highMissing.length})</span></h5>
        <div class="ats-chips">${highMissing.map(k => chipHTML(k, 'missing')).join('')}</div>
      </div>`;
  }
  if (lowMissing.length) {
    missingHTML += `
      <div class="ats-section">
        <h5>Also missing <span class="ats-count">(${lowMissing.length})</span></h5>
        <div class="ats-chips">${lowMissing.map(k => chipHTML(k, 'missing')).join('')}</div>
      </div>`;
  }
  if (!highMissing.length && !lowMissing.length) {
    missingHTML = `<p class="ats-empty">Nothing missing. Your resume covers every keyword we found.</p>`;
  }

  panel.className = `ats-results tier-${tier}`;
  panel.innerHTML = `
    <div class="ats-score-row">
      <div class="ats-score-ring">
        <svg viewBox="0 0 120 120">
          <circle class="ats-score-bg" cx="60" cy="60" r="52"></circle>
          <circle class="ats-score-fill" cx="60" cy="60" r="52"
                  stroke-dasharray="${circumference.toFixed(1)}"
                  stroke-dashoffset="${circumference.toFixed(1)}"
                  data-target-offset="${offset.toFixed(1)}"></circle>
        </svg>
        <div class="ats-score-value">${result.score}<small>%</small></div>
      </div>
      <div class="ats-score-caption">
        <h4>${msg.title}</h4>
        <p>${msg.body}</p>
        <p style="margin-top:8px; font-size:12px; color:var(--text-soft);">
          ${matchedCount} of ${totalCount} keywords matched
        </p>
      </div>
    </div>

    <div class="ats-section">
      <h5>Matched <span class="ats-count">(${matchedCount})</span></h5>
      <div class="ats-chips">${matchedHTML}</div>
    </div>

    ${missingHTML}
  `;

  panel.classList.remove('hidden');

  requestAnimationFrame(() => {
    const fill = panel.querySelector('.ats-score-fill');
    if (fill) fill.setAttribute('stroke-dashoffset', fill.dataset.targetOffset);
  });
}

export function clearATSResults() {
  const panel = document.getElementById('atsResults');
  if (panel) {
    panel.classList.add('hidden');
    panel.innerHTML = '';
  }
  const ai = document.getElementById('aiOutput');
  if (ai) {
    ai.classList.add('hidden');
    ai.textContent = '';
  }
}

/* ============================================================
   AI DRAFT MODAL
   ============================================================ */
let onAIApply = null;

export function openAIDraftModal(text, target) {
  const modal = document.getElementById('aiModal');
  const draft = document.getElementById('aiDraft');
  const applyBtn = document.getElementById('aiModalApply');
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

  return { modal, draft, applyBtn };
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