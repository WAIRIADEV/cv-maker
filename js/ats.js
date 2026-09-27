// js/ats.js
// Local keyword extraction + ATS match scoring. No AI required.
import { scoreTier } from './ats.js';

const STOPWORDS = new Set([
  'a','an','and','or','but','the','of','to','in','on','at','by','for','with','from',
  'as','is','are','was','were','be','been','being','am','do','does','did','have',
  'has','had','this','that','these','those','i','you','he','she','it','we','they',
  'me','him','her','us','them','my','your','his','its','our','their','ours','yours',
  'will','would','should','could','may','might','must','can','shall','about','into',
  'over','under','between','through','during','before','after','above','below','up',
  'down','out','off','then','than','so','if','else','when','where','why','how','who',
  'what','which','whose','there','here','not','no','nor','only','just','also','very',
  'too','more','most','less','least','much','many','few','some','any','all','each',
  'every','both','either','neither','one','two','three','four','five','six','seven',
  'eight','nine','ten','first','second','third','etc','eg','ie','vs','via','per',
  'use','using','used','uses','make','makes','made','get','gets','got','go','goes',
  'went','come','comes','came','see','sees','saw','say','says','said','know','knows',
  'knew','think','thinks','thought','want','wants','wanted','need','needs','needed',
  'work','works','worked','working','well','good','best','better','great','like',
  'likes','liked','role','job','position','candidate','apply','application','team',
  'teams','company','companies','year','years','experience','experiences','skills',
  'skill','ability','abilities','strong','excellent','including','include','includes',
  'included','plus','preferred','required','require','requires','requirement',
  'requirements','qualification','qualifications','responsibility','responsibilities',
  'duties','duty','day','days','week','weeks','month','months','full','part','time',
  'new','within','across','ensure','ensuring','provide','providing','support',
  'supporting','help','helping','develop','developing','developed','develops','build',
  'building','built','builds','create','creating','created','creates','manage',
  'managing','managed','manages','lead','leading','led','leads','looking','seeking',
  'ideal','successful','proven','track','record','highly','motivated','passionate',
  'opportunity','opportunities','join','joining','our','you\'ll','we\'re','we\'ll',
  'about','us','their','they','have','who\'s','company\'s','looking'
]);

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s\-+#./]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract weighted keywords from a job description.
 * Returns array of { term, weight, count, isPhrase }
 */
export function extractKeywords(text) {
  const clean = normalize(text);
  if (!clean) return [];

  const words = clean
    .split(' ')
    .filter(w => w.length >= 2 && !STOPWORDS.has(w));

  const freq = new Map();
  words.forEach(w => freq.set(w, (freq.get(w) || 0) + 1));
  for (let i = 0; i < words.length - 1; i++) {
    const bg = words[i] + ' ' + words[i + 1];
    freq.set(bg, (freq.get(bg) || 0) + 1);
  }

  const keywords = [];
  for (const [term, count] of freq) {
    const isPhrase = term.includes(' ');
    if (isPhrase && count < 2) continue;
    if (!isPhrase && count < 2 && term.length < 5) continue;

    let weight = count;
    if (isPhrase) weight *= 1.6;
    if (!isPhrase && count === 1) weight = 0.5;

    keywords.push({ term, weight, count, isPhrase });
  }

  // Dedupe + sort by weight
  return keywords
    .sort((a, b) => b.weight - a.weight)
    .filter((k, i, arr) => arr.findIndex(x => x.term === k.term) === i)
    .slice(0, 40);
}

function getResumeText(r) {
  if (!r) return '';
  const parts = [
    r.name, r.title, r.email, r.location, r.website, r.linkedin, r.github,
    r.summary, r.skills,
    ...(r.experience || []).flatMap(e => [e.role, e.company, e.location, ...(e.bullets || [])]),
    ...(r.education || []).flatMap(e => [e.degree, e.school, e.location, e.details]),
    ...(r.projects || []).flatMap(p => [p.name, p.link, ...(p.bullets || [])])
  ];
  return normalize(parts.filter(Boolean).join(' '));
}

/**
 * Compute ATS match score between a JD and a resume.
 * Returns { score, matched, missing, total, highPriorityMissing }
 */
export function analyzeResume(jdText, resumeData) {
  const keywords = extractKeywords(jdText);
  if (!keywords.length) {
    return { score: 0, matched: [], missing: [], total: 0, highPriorityMissing: [] };
  }

  const resumeText = getResumeText(resumeData);
  let matchedWeight = 0;
  let totalWeight = 0;
  const matched = [];
  const missing = [];

  for (const kw of keywords) {
    totalWeight += kw.weight;
    const present = resumeText.includes(kw.term);
    if (present) {
      matchedWeight += kw.weight;
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  }

  const score = totalWeight ? Math.round((matchedWeight / totalWeight) * 100) : 0;
  const highPriorityMissing = missing.filter(m => m.weight >= 1.5);

  return { score, matched, missing, total: keywords.length, highPriorityMissing };
}

export function scoreTier(score) {
  if (score >= 75) return 'high';
  if (score >= 50) return 'mid';
  return 'low';
}