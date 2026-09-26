export function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

export function sanitizeAIOutput(text) {
  if (!text) return '';
  let out = text;

  // Strip markdown headers
  out = out.replace(/^#{1,6}\s+/gm, '');
  // Bold / italic
  out = out.replace(/\*\*(.+?)\*\*/g, '$1');
  out = out.replace(/__(.+?)__/g, '$1');
  out = out.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1');
  out = out.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '$1');
  // Inline code / backticks
  out = out.replace(/`([^`]+)`/g, '$1');
  // Bullet markers at line start (keep the text)
  out = out.replace(/^\s*[-*•]\s+/gm, '');
  // Numbered list markers
  out = out.replace(/^\s*\d+\.\s+/gm, '');

  // Drop common AI preamble/postamble lines
  out = out.split('\n').filter(line => {
    const t = line.trim().toLowerCase();
    if (!t) return true;
    if (/^(here'?s|here is)\b/.test(t)) return false;
    if (/^let me know\b/.test(t)) return false;
    if (/^i hope (this|that)\b/.test(t)) return false;
    if (/^feel free to\b/.test(t)) return false;
    if (/^if you (want|need|'d like)\b/.test(t)) return false;
    if (/^note:/.test(t)) return false;
    return true;
  }).join('\n');

  // Collapse 3+ blank lines to 2
  out = out.replace(/\n{3,}/g, '\n\n');
  return out.trim();
}