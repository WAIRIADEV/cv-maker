import { loadResumeFromStorage, saveResume, clearResumeStorage } from './storage.js';
import {
  renderAll, updatePreview, populateInputs, bindTopLevelInputs, initUI,
  addExperience, addEducation, addProject,
  initAIModal
} from './ui.js';
import { aiGenerateSummary, aiImproveBullets, aiTailor } from './ai.js';

document.addEventListener('DOMContentLoaded', () => {
  // Load saved data
  loadResumeFromStorage();
  populateInputs();
  bindTopLevelInputs();
  renderAll();
  updatePreview();
  initUI();
  initAIModal();

  // Top buttons
  document.getElementById('exportBtn').addEventListener('click', () => window.print());
  document.getElementById('saveBtn').addEventListener('click', saveResume);
  document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('Clear all data?')) {
      clearResumeStorage();
      populateInputs();
      renderAll();
      updatePreview();
    }
  });

  // Add buttons
  document.getElementById('addExperienceBtn').addEventListener('click', addExperience);
  document.getElementById('addEducationBtn').addEventListener('click', addEducation);
  document.getElementById('addProjectBtn').addEventListener('click', addProject);

  // AI buttons
  document.getElementById('aiSummaryBtn').addEventListener('click', e => aiGenerateSummary(e.target));
  document.getElementById('aiTailorBtn').addEventListener('click', e => aiTailor(e.target));

  // AI Improve Bullets (delegated, since buttons are dynamic)
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action="ai-improve"]');
    if (btn) aiImproveBullets(Number(btn.dataset.index), btn);
  });
});