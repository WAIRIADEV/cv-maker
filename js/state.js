export const defaultResume = {
  template: 'modern',
  name: "", title: "", email: "", phone: "", location: "", website: "", linkedin: "", github: "",
  summary: "", skills: "",
  experience: [],
  education: [],
  projects: []
};

export const SAMPLE_RESUME = {
  name: 'Alex Morgan',
  title: 'Senior Product Designer',
  email: 'alex.morgan@example.com',
  phone: '+1 555 123 4567',
  location: 'San Francisco, CA',
  website: 'alexmorgan.design',
  linkedin: 'linkedin.com/in/alexmorgan',
  github: '',
  summary: 'Product designer with 8+ years of experience leading design for B2B SaaS products. Specialized in design systems, user research, and shipping features that move metrics. Known for close cross-functional collaboration and a systems-thinking approach.',
  skills: 'Figma · Design Systems · User Research · Prototyping · HTML/CSS · React · Framer · Accessibility',
  experience: [
    {
      role: 'Senior Product Designer',
      company: 'Stripe',
      start: '2021',
      end: 'Present',
      location: 'San Francisco',
      bullets: [
        'Led redesign of the merchant dashboard used by 50k+ businesses, increasing weekly active usage by 34%.',
        'Built and maintained the company-wide design system, adopted by 12 product teams and 40+ engineers.',
        'Mentored 3 junior designers through structured weekly critiques and quarterly growth reviews.'
      ]
    },
    {
      role: 'Product Designer',
      company: 'Figma',
      start: '2018',
      end: '2021',
      location: 'San Francisco',
      bullets: [
        'Shipped multi-cursor editing to 4M+ users; led the design of real-time presence and selection states.',
        'Designed the plugin marketplace UI from concept to launch, driving 12k+ plugin installs in the first quarter.'
      ]
    }
  ],
  education: [
    {
      degree: 'BFA Interaction Design',
      school: 'California College of the Arts',
      start: '2012',
      end: '2016',
      location: 'San Francisco',
      details: 'Graduated with honors. Thesis on collaborative design tooling.'
    }
  ],
  projects: [
    {
      name: 'Designers Who Code',
      link: 'designerswhocode.dev',
      bullets: ['A community of 2,000+ designers learning to build. Weekly newsletters, workshops, and open-source starter kits.']
    }
  ]
};

export let resume = JSON.parse(JSON.stringify(defaultResume));

export function setResume(newResume) {
  resume = { ...JSON.parse(JSON.stringify(defaultResume)), ...newResume };
}

export function resetResume() {
  resume = JSON.parse(JSON.stringify(defaultResume));
}