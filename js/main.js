import { resume, setResume } from './state.js';
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
import { semanticScan, clearEmbeddingCache } from './semantic.js';
import { initTheme, toggleTheme } from './theme.js';
import { showToast, confirmDialog } from './toast.js';

const SETTINGS_KEY = 'cv-maker-settings';
let currentAtsMode = 'fast';

/* ============================================================
   SETTINGS
   ============================================================ */
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    if (s.url)        document.getElementById('ollamaUrl').value  = s.url;
    if (s.model)      document.getElementById('ollamaModel').value = s.model;
    if (s.embedModel) document.getElementById('embedModel').value  = s.embedModel;
    if (s.atsMode)    currentAtsMode = s.atsMode;
  } catch { /* ignore */ }
}

function saveSettings() {
  const s = {
    url:        document.getElementById('ollamaUrl').value,
    model:      document.getElementById('ollamaModel').value,
    embedModel: document.getElementById('embedModel').value,
    atsMode:    currentAtsMode
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

/* ============================================================
   JSON EXPORT / IMPORT
   ============================================================ */
function exportJSON() {
  const data = JSON.stringify(resume, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `resume-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Resume exported as JSON', 'success');
}

function importJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (typeof data !== 'object' || data === null) {
        throw new Error('File does not contain a valid resume object.');
      }
      setResume(data);
      populateInputs();
      renderAll();
      renderSectionOrder();
      applyTemplate(resume.template || 'modern');
      clearATSResults();
      const jdField = document.getElementById('jobDescription');
      if (jdField) jdField.value = resume.jobDescription || '';
      updatePreview();
      saveResume();
      showToast('Resume imported successfully', 'success');
    } catch (err) {
      showToast('Import failed: ' + err.message, 'error', 5000);
    }
  };
  input.click();
}

/* ============================================================
   ATS MODE + PROGRESS
   ============================================================ */
function setAtsMode(mode) {
  currentAtsMode = mode;
  document.querySelectorAll('.ats-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  saveSettings();
}

function showProgress(text, pct) {
  const wrap = document.getElementById('atsProgress');
  const fill = document.getElementById('atsProgressFill');
  const txt  = document.getElementById('atsProgressText');
  if (!wrap || !fill || !txt) return;
  wrap.classList.remove('hidden');
  fill.style.width = `${pct}%`;
  txt.textContent = text;
}

function hideProgress() {
  document.getElementById('atsProgress')?.classList.add('hidden');
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  loadResumeFromStorage();
  populateInputs();
  bindTopLevelInputs();
  renderAll();
  renderSectionOrder();
  updatePreview();
  initUI();
  initAIModal();
  initStepper();

  const jdField = document.getElementById('jobDescription');
  if (jdField) {
    jdField.value = resume.jobDescription || '';
    jdField.addEventListener('input', () => {
      resume.jobDescription = jdField.value;
    });
  }

  document.getElementById('themeToggle')?.addEventListener('click', () => {
    const next = toggleTheme();
    showToast(`${next === 'dark' ? 'Dark' : 'Light'} mode`, 'info', 1800);
  });

  // ATS mode toggle
  document.querySelectorAll('.ats-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => setAtsMode(btn.dataset.mode));
  });

  // ATS scan
  document.getElementById('atsScanBtn')?.addEventListener('click', async e => {
    const jd = jdField?.value || '';
    if (!jd.trim()) return showToast('Paste a job description first.', 'warn');

    clearATSResults();
    const btn = e.currentTarget;

    if (currentAtsMode === 'fast') {
      const result = analyzeResume(jd, resume);
      renderATSResults(result);
      showToast(`Fast scan complete — ${result.score}% match`, 'info', 2400);
      return;
    }

    // Semantic mode
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Scanning…';
    showProgress('Preparing embeddings…', 0);

    try {
      const url        = document.getElementById('ollamaUrl').value;
      const embedModel = document.getElementById('embedModel').value || 'nomic-embed-text';

      const result = await semanticScan(jd, resume, {
        url,
        embedModel,
        onProgress: (done, total, phase) => {
          const label = phase === 'keywords'
            ? `Embedding keyword ${Math.min(done + 1, total)} of ${total}…`
            : `Embedding resume section ${Math.min(done + 1, total)} of ${total}…`;
          const pct = total ? Math.round((done / total) * 100) : 0;
          showProgress(label, pct);
        }
      });

      renderATSResults(result);
      showToast(`Semantic scan complete — ${result.score}% match`, 'success', 2600);
    } catch (err) {
      if (err.code === 'MODEL_NOT_FOUND') {
        showToast(err.message, 'error', 6000);
      } else {
        showToast('Semantic scan failed: ' + err.message, 'error', 5000);
      }
    } finally {
      hideProgress();
      btn.disabled = false;
      btn.innerHTML = original;
    }
  });

  // AI Deep Analysis
  document.getElementById('atsAiBtn')?.addEventListener('click', e => {
    aiDeepAnalysis(e.currentTarget);
  });

  // Gallery
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
  setAtsMode(currentAtsMode);
  document.getElementById('ollamaUrl')?.addEventListener('input', saveSettings);
  document.getElementById('ollamaModel')?.addEventListener('input', saveSettings);
  document.getElementById('embedModel')?.addEventListener('input', () => {
    saveSettings();
    clearEmbeddingCache();
  });

  document.getElementById('exportJsonBtn')?.addEventListener('click', exportJSON);
  document.getElementById('importJsonBtn')?.addEventListener('click', importJSON);

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

  // Preview toggle
  document.getElementById('previewToggle')?.addEventListener('click', togglePreview);
  document.getElementById('previewClose')?.addEventListener('click', closePreview);

  // Header actions
  document.getElementById('exportBtn')?.addEventListener('click', () => window.print());
  document.getElementById('exportBtn2')?.addEventListener('click', () => window.print());
  document.getElementById('saveBtn')?.addEventListener('click', () => {
    saveResume();
    showToast('Resume saved', 'success', 2000);
  });
  document.getElementById('clearBtn')?.addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Clear all data?',
      message: 'This will permanently delete your resume, template choice, and job description. This cannot be undone.',
      confirmLabel: 'Clear everything',
      danger: true
    });
    if (!ok) return;
    clearResumeStorage();
    clearEmbeddingCache();
    populateInputs();
    renderAll();
    renderSectionOrder();
    clearATSResults();
    hideProgress();
    if (jdField) jdField.value = '';
    updatePreview();
    showToast('All data cleared', 'info');
  });

  // Add buttons
  document.getElementById('addExperienceBtn')?.addEventListener('click', addExperience);
  document.getElementById('addEducationBtn')?.addEventListener('click', addEducation);
  document.getElementById('addProjectBtn')?.addEventListener('click', addProject);

  // AI summary
  document.getElementById('aiSummaryBtn')?.addEventListener('click', e => aiGenerateSummary(e.currentTarget));

  // AI improve bullets
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action="ai-improve"]');
    if (btn) aiImproveBullets(Number(btn.dataset.index), btn);
  });
});