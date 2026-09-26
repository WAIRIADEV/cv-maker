import { resume, setResume, defaultResume } from './state.js';

export function saveResume() {
  localStorage.setItem('resume', JSON.stringify(resume));
  alert('Resume saved locally!');
}

export function loadResumeFromStorage() {
  const saved = localStorage.getItem('resume');
  if (saved) {
    try {
      setResume(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load resume', e);
    }
  }
}

export function clearResumeStorage() {
  localStorage.removeItem('resume');
  setResume(JSON.parse(JSON.stringify(defaultResume)));
}