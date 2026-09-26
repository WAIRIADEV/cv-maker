import { resume } from './state.js';
import { loadResumeFromStorage, saveResume, clearResumeStorage } from './storage.js';
import {
  renderAll, updatePreview, populateInputs, bindTopLevelInputs, initUI,
  addExperience, addEducation, addProject,
  initAIModal, initStepper, togglePreview, closePreview,
  switchView, applyTemplate
} from './ui.js';
import { aiGenerateSummary, aiImproveBullets, aiTailor } from './ai.js';

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
  // Data
  loadResumeFromStorage();
  populateInputs();
  bindTopLevelInputs();
  renderAll();
  updatePreview();
  initUI();
  initAIModal();
  initStepper();

  // Apply saved template FIRST, then show gallery
  applyTemplate(resume.template || 'modern');
  switchView('gallery');

  // ---- Gallery interactions ----
  document.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      const name = card.dataset.template;
      applyTemplate(name);
      updatePreview();
      switchView('editor');
      saveResume(); // persist template choice
    });
  });

  document.getElementById('continueBtn')?.addEventListener('click', () => {
    applyTemplate(resume.template || 'modern');
    updatePreview();
    switchView('editor');
  });

  document.getElementById('brandHome')?.addEventListener('click', () => {
    switchView('gallery');
  });

  // ---- Settings ----
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

  // ---- Preview toggle (mobile) ----
  document.getElementById('previewToggle')?.addEventListener('click', togglePreview);
  document.getElementById('previewClose')?.addEventListener('click', closePreview);

  // ---- Header actions ----
  document.getElementById('exportBtn')?.addEventListener('click', () => window.print());
  document.getElementById('exportBtn2')?.addEventListener('click', () => window.print());
  document.getElementById('saveBtn')?.addEventListener('click', saveResume);
  document.getElementById('clearBtn')?.addEventListener('click', () => {
    if (confirm('Clear all data?')) {
      clearResumeStorage();
      populateInputs();
      renderAll();
      updatePreview();
    }
  });

  // ---- Add buttons ----
  document.getElementById('addExperienceBtn')?.addEventListener('click', addExperience);
  document.getElementById('addEducationBtn')?.addEventListener('click', addEducation);
  document.getElementById('addProjectBtn')?.addEventListener('click', addProject);

  // ---- AI buttons ----
  document.getElementById('aiSummaryBtn')?.addEventListener('click', e => aiGenerateSummary(e.currentTarget));
  document.getElementById('aiTailorBtn')?.addEventListener('click', e => aiTailor(e.currentTarget));

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action="ai-improve"]');
    if (btn) aiImproveBullets(Number(btn.dataset.index), btn);
  });
});