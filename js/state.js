export const defaultResume = {
  template: 'modern',
  name: "", title: "", email: "", phone: "", location: "", website: "", linkedin: "", github: "",
  summary: "", skills: "",
  experience: [],
  education: [],
  projects: []
};

export let resume = JSON.parse(JSON.stringify(defaultResume));

export function setResume(newResume) {
  resume = { ...JSON.parse(JSON.stringify(defaultResume)), ...newResume };
}

export function resetResume() {
  resume = JSON.parse(JSON.stringify(defaultResume));
}