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
import {
  aiGenerateSummary, aiImproveBullets, aiDeepAnalysis,
  chatSend, chatClear, initChat,
  generateCoverLetter, generateInterviewPrep, sendInterviewToChat,
  matchInternshipRequirements, sendInternshipToChat
} from './ai.js';
import { initCover, clearCover, getCover } from './cover.js';
import { analyzeResume } from './ats.js';
import { semanticScan, clearEmbeddingCache } from './semantic.js';
import { initTheme, toggleTheme } from './theme.js';
import { showToast, confirmDialog } from './toast.js';
import { initResizer } from './resizer.js';
import { PROVIDERS, getProvider } from './providers.js';

window.__PROVIDERS__ = PROVIDERS;

const SETTINGS_KEY = 'cv-maker-settings';
let currentAtsMode = 'fast';

function readSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

function loadSettings() {
  const s = readSettings();
  const provider = getProvider(s.provider || 'ollama');

  document.getElementById('providerSelect').value = provider.id;
  if (s.url)        document.getElementById('ollamaUrl').value  = s.url;
  if (s.embedModel) document.getElementById('embedModel').value = s.embedModel;
  if (s.atsMode)    currentAtsMode = s.atsMode;

  applyProviderUI(provider);
}

function applyProviderUI(provider) {
  const isOllama = provider.format === 'ollama';

  document.getElementById('apiKeyField').style.display     = isOllama ? 'none' : 'block';
  document.getElementById('ollamaUrlField').style.display  = isOllama ? 'block' : 'none';
  document.getElementById('embedModelField').style.display = isOllama ? 'block' : 'none';
  document.getElementById('providerHint').textContent      = provider.hint;

  const datalist = document.getElementById('modelSuggestions');
  datalist.innerHTML = '';
  (provider.suggestedModels || []).forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    datalist.appendChild(opt);
  });

  const s = readSettings();
  const modelInput = document.getElementById('ollamaModel');
  modelInput.value = s.models?.[provider.id] || provider.defaultModel;

  const keyInput = document.getElementById('apiKey');
  if (keyInput) keyInput.value = s.apiKeys?.[provider.id] || '';

  const semanticBtn = document.querySelector('.ats-mode-btn[data-mode="semantic"]');
  if (semanticBtn) {
    semanticBtn.disabled = !provider.hasEmbeddings;
    semanticBtn.title = provider.hasEmbeddings ? '' : 'Semantic mode requires Ollama embeddings.';
    if (!provider.hasEmbeddings && currentAtsMode === 'semantic') setAtsMode('fast');
  }

  const refreshBtn = document.getElementById('refreshModelsBtn');
  if (refreshBtn) refreshBtn.style.display = provider.modelsPath ? 'inline-flex' : 'none';
}

function saveSettings() {
  const existing = readSettings();
  const providerId = document.getElementById('providerSelect').value;

  const s = {
    ...existing,
    provider:   providerId,
    url:        document.getElementById('ollamaUrl').value,
    embedModel: document.getElementById('embedModel').value,
    atsMode:    currentAtsMode,
    models: {
      ...(existing.models || {}),
      [providerId]: document.getElementById('ollamaModel').value
    },
    apiKeys: {
      ...(existing.apiKeys || {}),
      [providerId]: document.getElementById('apiKey').value
    }
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function getProviderKey(providerId) {
  return readSettings().apiKeys?.[providerId] || '';
}

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
      if (typeof data !== 'object' || data === null) throw new Error('Invalid file.');
      setResume(data);
      populateInputs();
      renderAll();
      renderSectionOrder();
      applyTemplate(resume.template || 'modern');
      clearATSResults();
      const jd = document.getElementById('jobDescription');
      if (jd) jd.value = resume.jobDescription || '';
      updatePreview();
      saveResume();
      showToast('Resume imported', 'success');
    } catch (err) {
      showToast('Import failed: ' + err.message, 'error', 5000);
    }
  };
  input.click();
}

async function refreshModelsFromProvider() {
  const providerId = document.getElementById('providerSelect').value;
  const provider = getProvider(providerId);
  if (!provider.modelsPath) {
    return showToast('This provider does not expose a model list.', 'warn');
  }

  const key = getProviderKey(providerId);
  if (provider.needsKey && !key) {
    return showToast('Enter your API key first.', 'warn');
  }

  const btn = document.getElementById('refreshModelsBtn');
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Fetching…';

  try {
    const headers = key ? { 'Authorization': `Bearer ${key}` } : {};
    const res = await fetch(`${provider.baseUrl}${provider.modelsPath}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const ids = (data.data || data.models || [])
      .map(m => m.id || m.name)
      .filter(Boolean);

    if (!ids.length) throw new Error('No models returned.');

    const datalist = document.getElementById('modelSuggestions');
    datalist.innerHTML = ids.map(id => `<option value="${id}"></option>`).join('');

    showToast(`Loaded ${ids.length} models from ${provider.name}.`, 'success', 4000);
  } catch (e) {
    showToast('Could not fetch models: ' + e.message, 'error', 5000);
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initResizer();

  loadResumeFromStorage();
  populateInputs();
  bindTopLevelInputs();
  renderAll();
  renderSectionOrder();
  updatePreview();
  initUI();
  initAIModal();
  initStepper();
  initChat();
  initCover();

  const jdField = document.getElementById('jobDescription');
  if (jdField) {
    jdField.value = resume.jobDescription || '';
    jdField.addEventListener('input', () => { resume.jobDescription = jdField.value; });
  }

  document.getElementById('themeToggle')?.addEventListener('click', () => {
    const next = toggleTheme();
    showToast(`${next === 'dark' ? 'Dark' : 'Light'} mode`, 'info', 1800);
  });

  document.querySelectorAll('.ats-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      setAtsMode(btn.dataset.mode);
    });
  });

  document.getElementById('atsScanBtn')?.addEventListener('click', async e => {
    const jd = jdField?.value || '';
    if (!jd.trim()) return showToast('Paste a job description first.', 'warn');

    clearATSResults();
    const btn = e.currentTarget;

    if (currentAtsMode === 'fast') {
      const result = analyzeResume(jd, resume);
      renderATSResults(result);
      showToast(`Fast scan - ${result.score}% match`, 'info', 2400);
      return;
    }

    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Scanning…';
    showProgress('Preparing embeddings…', 0);

    try {
      const url = document.getElementById('ollamaUrl').value;
      const embedModel = document.getElementById('embedModel').value || 'nomic-embed-text';
      const result = await semanticScan(jd, resume, {
        url,
        embedModel,
        onProgress: (done, total, phase) => {
          const label = phase === 'keywords'
            ? `Embedding keyword ${Math.min(done + 1, total)} of ${total}…`
            : `Embedding resume section ${Math.min(done + 1, total)} of ${total}…`;
          showProgress(label, total ? Math.round((done / total) * 100) : 0);
        }
      });
      renderATSResults(result);
      showToast(`Semantic scan - ${result.score}% match`, 'success', 2600);
    } catch (err) {
      showToast(err.code === 'MODEL_NOT_FOUND' ? err.message : 'Semantic scan failed: ' + err.message, 'error', 5000);
    } finally {
      hideProgress();
      btn.disabled = false;
      btn.innerHTML = original;
    }
  });

  document.getElementById('atsAiBtn')?.addEventListener('click', e => aiDeepAnalysis(e.currentTarget));

  // Chat
  document.getElementById('chatForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const text = input.value;
    if (!text.trim()) return;
    input.value = '';
    await chatSend(text);
  });
  document.getElementById('chatInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.getElementById('chatForm')?.requestSubmit();
    }
  });
  document.getElementById('chatClearBtn')?.addEventListener('click', () => {
    chatClear();
    showToast('Chat cleared', 'info');
  });
  document.getElementById('chatMessages')?.addEventListener('click', e => {
    const sug = e.target.closest('.chat-suggestion');
    if (!sug) return;
    document.getElementById('chatInput').value = sug.dataset.suggest || '';
    document.getElementById('chatInput').focus();
  });

  // Interview prep
  document.getElementById('interviewBtn')?.addEventListener('click', async e => {
    await generateInterviewPrep(e.currentTarget);
    document.getElementById('interviewActions')?.classList.remove('hidden');
  });
  document.getElementById('interviewToChatBtn')?.addEventListener('click', sendInterviewToChat);

  // Internship matcher
  document.getElementById('internshipBtn')?.addEventListener('click', async e => {
    await matchInternshipRequirements(e.currentTarget);
    document.getElementById('internshipToChatBtn')?.classList.remove('hidden');
  });
  document.getElementById('internshipToChatBtn')?.addEventListener('click', sendInternshipToChat);

  // Cover letter
  document.getElementById('coverGenerateBtn')?.addEventListener('click', e => generateCoverLetter(e.currentTarget));
  document.getElementById('coverClearBtn')?.addEventListener('click', () => {
    clearCover();
    showToast('Cover letter cleared', 'info');
  });
  document.getElementById('coverCopyBtn')?.addEventListener('click', async () => {
    const text = getCover();
    if (!text.trim()) return showToast('Nothing to copy.', 'warn');
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard', 'success');
    } catch {
      showToast('Copy failed — select and copy manually.', 'error');
    }
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
      if (frame && inner) inner.style.transform = `scale(${frame.clientWidth / 816})`;
    }
  });

  document.getElementById('continueBtn')?.addEventListener('click', () => {
    applyTemplate(resume.template || 'modern');
    switchView('editor');
  });
  document.getElementById('brandHome')?.addEventListener('click', () => switchView('gallery'));

  // Settings
  loadSettings();
  setAtsMode(currentAtsMode);

  document.getElementById('providerSelect')?.addEventListener('change', e => {
    const provider = getProvider(e.target.value);
    applyProviderUI(provider);
    saveSettings();
    showToast(`Provider: ${provider.name}`, 'info', 1800);
  });

  document.getElementById('ollamaUrl')?.addEventListener('input', saveSettings);
  document.getElementById('ollamaModel')?.addEventListener('input', saveSettings);
  document.getElementById('embedModel')?.addEventListener('input', () => {
    saveSettings();
    clearEmbeddingCache();
  });
  document.getElementById('apiKey')?.addEventListener('input', saveSettings);
  document.getElementById('refreshModelsBtn')?.addEventListener('click', refreshModelsFromProvider);

  document.getElementById('exportJsonBtn')?.addEventListener('click', exportJSON);
  document.getElementById('importJsonBtn')?.addEventListener('click', importJSON);

  const settingsPanel = document.getElementById('settingsPanel');
  document.getElementById('settingsBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    settingsPanel?.classList.toggle('hidden');
  });
  document.getElementById('settingsClose')?.addEventListener('click', () => settingsPanel?.classList.add('hidden'));
  document.addEventListener('click', e => {
    if (!settingsPanel || settingsPanel.classList.contains('hidden')) return;
    if (!settingsPanel.contains(e.target) && !e.target.closest('#settingsBtn')) {
      settingsPanel.classList.add('hidden');
    }
  });

  document.getElementById('previewToggle')?.addEventListener('click', togglePreview);
  document.getElementById('previewClose')?.addEventListener('click', closePreview);

  document.getElementById('exportBtn')?.addEventListener('click', () => window.print());
  document.getElementById('exportBtn2')?.addEventListener('click', () => window.print());
  document.getElementById('saveBtn')?.addEventListener('click', () => {
    saveResume();
    showToast('Resume saved', 'success', 2000);
  });
  document.getElementById('clearBtn')?.addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Clear all data?',
      message: 'This will permanently delete your resume, template choice, job description, cover letter, and chat history. This cannot be undone.',
      confirmLabel: 'Clear everything',
      danger: true
    });
    if (!ok) return;
    clearResumeStorage();
    clearEmbeddingCache();
    chatClear();
    clearCover();
    populateInputs();
    renderAll();
    renderSectionOrder();
    clearATSResults();
    hideProgress();
    if (jdField) jdField.value = '';
    updatePreview();
    showToast('All data cleared', 'info');
  });

  document.getElementById('addExperienceBtn')?.addEventListener('click', addExperience);
  document.getElementById('addEducationBtn')?.addEventListener('click', addEducation);
  document.getElementById('addProjectBtn')?.addEventListener('click', addProject);

  document.getElementById('aiSummaryBtn')?.addEventListener('click', e => aiGenerateSummary(e.currentTarget));

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action="ai-improve"]');
    if (btn) aiImproveBullets(Number(btn.dataset.index), btn);
  });
});