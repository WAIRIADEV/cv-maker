export const defaultResume = {
  name: "", title: "", email: "", phone: "", location: "", website: "", linkedin: "", github: "",
  summary: "", skills: "",
  experience: [],
  education: [],
  projects: []
};

export let resume = JSON.parse(JSON.stringify(defaultResume));

export function setResume(newResume) {
  resume = newResume;
}

export function resetResume() {
  resume = JSON.parse(JSON.stringify(defaultResume));
}