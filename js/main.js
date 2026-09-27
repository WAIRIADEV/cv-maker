import { resume } from './state.js';
import { loadResumeFromStorage, saveResume, clearResumeStorage } from './storage.js';
import {
  renderAll, updatePreview, populateInputs, bindTopLevelInputs, initUI,
  addExperience, addEducation, addProject,
  initAIModal, initStepper, togglePreview, closePreview,
  switchView, applyTemplate,
  renderTemplateGallery, scaleThumbnails,
  openTemplatePreview, initTemplateModal,
  renderSectionOrder,
  renderATSResults, clearATSResults
} from './ui.js';
import { aiGenerateSummary, aiImproveBullets, aiDeepAnalysis } from './ai.js';
import { analyzeResume } from './ats.js';

const SETTINGS_KEY = 'cv-maker-settings';

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    if (s.url)   document.getElementById('ollamaUrl').value = s.url;
    if (s.model) document.getElementById('ollamaModel').value = s.model;
  } catch { /* ignore */ }
}

function saveSettings() {
  const s = {
    url:   document.getElementById('ollamaUrl').value,
    model: document.getElementById('ollamaModel').value
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

document.addEventListener('DOMContentLoaded', () => {
  loadResumeFromStorage();
  populateInputs();
  bindTopLevelInputs();
  renderAll();
  renderSectionOrder();
  updatePreview();
  initUI();
  initAIModal();
  initStepper();

  // Job description field
  const jdField = document.getElementById('jobDescription');
  if (jdField) {
    jdField.value = resume.jobDescription || '';
    jdField.addEventListener('input', () => {
      resume.jobDescription = jdField.value;
    });
  }

  // ATS Scan (local, no AI)
  document.getElementById('atsScanBtn')?.addEventListener('click', () => {
    const jd = jdField?.value || '';
    if (!jd.trim()) return alert('Paste a job description first.');
    clearATSResults();
    const result = analyzeResume(jd, resume);
    renderATSResults(result);
  });

  // AI Deep Analysis
  document.getElementById('atsAiBtn')?.addEventListener('click', e => {
    aiDeepAnalysis(e.currentTarget);
  });

  // Gallery + template preview
  renderTemplateGallery();
  initTemplateModal();
  applyTemplate(resume.template || 'modern');
  switchView('gallery');

  document.getElementById('templateGrid')?.addEventListener('click', e => {
    const card = e.target.closest('.template-card');
    if (!card) return;
    openTemplatePreview(card.dataset.template);
  });

  window.addEventListener('resize', () => {
    scaleThumbnails();
    const modal = document.getElementById('templateModal');
    if (modal && !modal.classList.contains('hidden')) {
      const frame = document.querySelector('.template-preview-frame');
      const inner = document.getElementById('templateModalPreview');
      if (frame && inner) {
        inner.style.transform = `scale(${frame.clientWidth / 816})`;
      }
    }
  });

  document.getElementById('continueBtn')?.addEventListener('click', () => {
    applyTemplate(resume.template || 'modern');
    switchView('editor');
  });

  document.getElementById('brandHome')?.addEventListener('click', () => {
    switchView('gallery');
  });

  // Settings
  loadSettings();
  document.getElementById('ollamaUrl')?.addEventListener('input', saveSettings);
  document.getElementById('ollamaModel')?.addEventListener('input', saveSettings);

  const settingsPanel = document.getElementById('settingsPanel');
  document.getElementById('settingsBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    settingsPanel?.classList.toggle('hidden');
  });
  document.getElementById('settingsClose')?.addEventListener('click', () => {
    settingsPanel?.classList.add('hidden');
  });
  document.addEventListener('click', e => {
    if (!settingsPanel || settingsPanel.classList.contains('hidden')) return;
    if (!settingsPanel.contains(e.target) && !e.target.closest('#settingsBtn')) {
      settingsPanel.classList.add('hidden');
    }
  });

  // Preview toggle (mobile)
  document.getElementById('previewToggle')?.addEventListener('click', togglePreview);
  document.getElementById('previewClose')?.addEventListener('click', closePreview);

  // Header actions
  document.getElementById('exportBtn')?.addEventListener('click', () => window.print());
  document.getElementById('exportBtn2')?.addEventListener('click', () => window.print());
  document.getElementById('saveBtn')?.addEventListener('click', saveResume);
  document.getElementById('clearBtn')?.addEventListener('click', () => {
    if (confirm('Clear all data?')) {
      clearResumeStorage();
      populateInputs();
      renderAll();
      renderSectionOrder();
      clearATSResults();
      if (jdField) jdField.value = '';
      updatePreview();
    }
  });

  // Add buttons
  document.getElementById('addExperienceBtn')?.addEventListener('click', addExperience);
  document.getElementById('addEducationBtn')?.addEventListener('click', addEducation);
  document.getElementById('addProjectBtn')?.addEventListener('click', addProject);

  // AI summary
  document.getElementById('aiSummaryBtn')?.addEventListener('click', e => aiGenerateSummary(e.currentTarget));

  // AI improve bullets (delegated)
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action="ai-improve"]');
    if (btn) aiImproveBullets(Number(btn.dataset.index), btn);
  });
});