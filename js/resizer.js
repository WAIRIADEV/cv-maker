// js/resizer.js
// Drag-to-resize the preview panel width.

const STORAGE_KEY = 'cv-maker-preview-width';
const DEFAULT_WIDTH = 460;
const MIN_WIDTH = 320;
const MAX_WIDTH = 900;

function getRoot() {
  return document.documentElement;
}

function setPreviewWidth(px) {
  const clamped = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, px));
  getRoot().style.setProperty('--preview-width', `${clamped}px`);
  return clamped;
}

function savePreviewWidth() {
  const current = getRoot().style.getPropertyValue('--preview-width').trim();
  if (current) localStorage.setItem(STORAGE_KEY, current);
}

function restorePreviewWidth() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const px = saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  setPreviewWidth(isNaN(px) ? DEFAULT_WIDTH : px);
}

export function initResizer() {
  restorePreviewWidth();

  const handle = document.getElementById('workspaceResizer');
  if (!handle) return;

  let dragging = false;
  let startX = 0;
  let startWidth = 0;

  const onMove = e => {
    if (!dragging) return;
    const delta = startX - e.clientX; // drag left → wider
    setPreviewWidth(startWidth + delta);
  };

  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('dragging');
    document.body.classList.remove('resizing');
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    savePreviewWidth();
  };

  handle.addEventListener('mousedown', e => {
    e.preventDefault();
    dragging = true;
    startX = e.clientX;
    startWidth = parseInt(
      getComputedStyle(getRoot()).getPropertyValue('--preview-width'),
      10
    ) || DEFAULT_WIDTH;
    handle.classList.add('dragging');
    document.body.classList.add('resizing');
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  // Double-click resets to default
  handle.addEventListener('dblclick', () => {
    setPreviewWidth(DEFAULT_WIDTH);
    savePreviewWidth();
  });

  // Keyboard: arrow keys nudge the width
  handle.addEventListener('keydown', e => {
    const step = e.shiftKey ? 40 : 10;
    const current = parseInt(
      getComputedStyle(getRoot()).getPropertyValue('--preview-width'),
      10
    ) || DEFAULT_WIDTH;
    if (e.key === 'ArrowLeft') {
      setPreviewWidth(current + step);
      savePreviewWidth();
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      setPreviewWidth(current - step);
      savePreviewWidth();
      e.preventDefault();
    }
  });

  handle.setAttribute('tabindex', '0');
}

export function resetPreviewWidth() {
  setPreviewWidth(DEFAULT_WIDTH);
  savePreviewWidth();
}