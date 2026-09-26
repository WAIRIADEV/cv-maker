// js/ui.js
import { resume } from './state.js';
import { escapeHtml } from './utils.js';

/* ============================================================
   EXPERIENCE
   ============================================================ */

export function renderExperience() {
  const container = document.getElementById('experienceList');
  container.innerHTML = resume.experience.map((exp, i) => `
    <div class="border rounded p-3 mb-2 bg-gray-50" data-index="${i}">
      <div class="flex justify-between mb-1">
        <span class="text-sm font-medium">Experience ${i + 1}</span>
        <button type="button" data-action="remove" data-section="experience" data-index="${i}"
                class="text-red-500 text-sm hover:underline">Remove</button>
      </div>
      <input data-field="company" value="${escapeHtml(exp.company)}" placeholder="Company"
             class="w-full border rounded p-1 mb-1 text-sm" />
      <input data-field="role" value="${escapeHtml(exp.role)}" placeholder="Role"
             class="w-full border rounded p-1 mb-1 text-sm" />
      <div class="grid grid-cols-2 gap-1 mb-1">
        <input data-field="start" value="${escapeHtml(exp.start)}" placeholder="Start"
               class="border rounded p-1 text-sm" />
        <input data-field="end" value="${escapeHtml(exp.end)}" placeholder="End"
               class="border rounded p-1 text-sm" />
      </div>
      <input data-field="location" value="${escapeHtml(exp.location)}" placeholder="Location"
             class="w-full border rounded p-1 mb-1 text-sm" />
      <textarea data-field="bullets" rows="3" placeholder="Bullet points (one per line)"
                class="w-full border rounded p-1 text-sm">${escapeHtml((exp.bullets || []).join('\n'))}</textarea>
      <button type="button" data-action="ai-improve" data-index="${i}"
              class="mt-1 text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700">
        AI Improve Bullets
      </button>
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
  container.innerHTML = resume.education.map((edu, i) => `
    <div class="border rounded p-3 mb-2 bg-gray-50" data-index="${i}">
      <div class="flex justify-between mb-1">
        <span class="text-sm font-medium">Education ${i + 1}</span>
        <button type="button" data-action="remove" data-section="education" data-index="${i}"
                class="text-red-500 text-sm hover:underline">Remove</button>
      </div>
      <input data-field="school" value="${escapeHtml(edu.school)}" placeholder="School"
             class="w-full border rounded p-1 mb-1 text-sm" />
      <input data-field="degree" value="${escapeHtml(edu.degree)}" placeholder="Degree"
             class="w-full border rounded p-1 mb-1 text-sm" />
      <div class="grid grid-cols-2 gap-1 mb-1">
        <input data-field="start" value="${escapeHtml(edu.start)}" placeholder="Start"
               class="border rounded p-1 text-sm" />
        <input data-field="end" value="${escapeHtml(edu.end)}" placeholder="End"
               class="border rounded p-1 text-sm" />
      </div>
      <input data-field="location" value="${escapeHtml(edu.location)}" placeholder="Location"
             class="w-full border rounded p-1 mb-1 text-sm" />
      <textarea data-field="details" rows="2" placeholder="Details (optional)"
                class="w-full border rounded p-1 text-sm">${escapeHtml(edu.details)}</textarea>
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
  container.innerHTML = resume.projects.map((proj, i) => `
    <div class="border rounded p-3 mb-2 bg-gray-50" data-index="${i}">
      <div class="flex justify-between mb-1">
        <span class="text-sm font-medium">Project ${i + 1}</span>
        <button type="button" data-action="remove" data-section="projects" data-index="${i}"
                class="text-red-500 text-sm hover:underline">Remove</button>
      </div>
      <input data-field="name" value="${escapeHtml(proj.name)}" placeholder="Project Name"
             class="w-full border rounded p-1 mb-1 text-sm" />
      <input data-field="link" value="${escapeHtml(proj.link)}" placeholder="Link (optional)"
             class="w-full border rounded p-1 mb-1 text-sm" />
      <textarea data-field="bullets" rows="3" placeholder="Description / bullet points (one per line)"
                class="w-full border rounded p-1 text-sm">${escapeHtml((proj.bullets || []).join('\n'))}</textarea>
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
  const contact = [resume.email, resume.phone, resume.location, resume.website, resume.linkedin, resume.github]
    .filter(Boolean)
    .map(escapeHtml)
    .join(' | ');

  let html = `
    <h1>${escapeHtml(resume.name) || 'Your Name'}</h1>
    <p class="text-lg text-gray-600">${escapeHtml(resume.title) || 'Job Title'}</p>
    <p class="text-sm text-gray-500 mb-4">${contact}</p>
    ${resume.summary ? `<h2>Summary</h2><p>${escapeHtml(resume.summary).replace(/\n/g, '<br>')}</p>` : ''}
  `;

  if (resume.experience.some(e => e.company || e.role)) {
    html += `<h2>Experience</h2>`;
    resume.experience.forEach(exp => {
      if (!exp.company && !exp.role) return;
      html += `<div class="mb-3">
        <h3>${escapeHtml(exp.role)}${exp.company ? ' at ' + escapeHtml(exp.company) : ''}</h3>
        <p class="text-sm text-gray-500">
          ${escapeHtml(exp.start)}${exp.end ? ' - ' + escapeHtml(exp.end) : ''}${exp.location ? ' | ' + escapeHtml(exp.location) : ''}
        </p>
        <ul>${(exp.bullets || []).filter(b => b.trim()).map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
      </div>`;
    });
  }

  if (resume.education.some(e => e.school || e.degree)) {
    html += `<h2>Education</h2>`;
    resume.education.forEach(edu => {
      if (!edu.school && !edu.degree) return;
      html += `<div class="mb-2">
        <h3>${escapeHtml(edu.degree)}${edu.school ? ' - ' + escapeHtml(edu.school) : ''}</h3>
        <p class="text-sm text-gray-500">
          ${escapeHtml(edu.start)}${edu.end ? ' - ' + escapeHtml(edu.end) : ''}${edu.location ? ' | ' + escapeHtml(edu.location) : ''}
        </p>
        ${edu.details ? `<p class="text-sm">${escapeHtml(edu.details)}</p>` : ''}
      </div>`;
    });
  }

  if (resume.projects.some(p => p.name)) {
    html += `<h2>Projects</h2>`;
    resume.projects.forEach(proj => {
      if (!proj.name) return;
      html += `<div class="mb-2">
        <h3>${escapeHtml(proj.name)}${proj.link ? ` <a href="${escapeHtml(proj.link)}" class="text-blue-600 text-sm">${escapeHtml(proj.link)}</a>` : ''}</h3>
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
   EVENT DELEGATION (called once from main.js)
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

      if (field === 'bullets') {
        entry.bullets = e.target.value.split('\n');
      } else {
        entry[field] = e.target.value;
      }
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
  draft.value = text;
  modal.classList.remove('hidden');
  modal.classList.add('flex');

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
  const close = () => { modal.classList.add('hidden'); modal.classList.remove('flex'); };

  document.getElementById('aiModalClose').addEventListener('click', close);
  document.getElementById('aiModalCancel').addEventListener('click', close);
  document.getElementById('aiModalApply').addEventListener('click', () => {
    if (onAIApply) onAIApply(draft.value);
    close();
  });
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
}