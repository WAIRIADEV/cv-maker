# AI CV Maker

A local-first resume builder with AI assistance powered by [Ollama](https://ollama.com).
No accounts, no subscriptions, no cloud. Everything runs on your machine and your data
stays in your browser.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Features

- **Guided wizard** — 7 focused steps: Personal → Summary → Experience → Education → Projects → Skills → Export
- **Live preview** — side-by-side print-ready resume, updates as you type
- **Responsive layout** — split view on desktop, slide-in preview on mobile
- **AI assistance** (local, via Ollama):
  - Generate a professional summary from your experience
  - Improve experience bullet points (stronger verbs, quantified impact)
  - Tailor your resume against a pasted job description
- **Editable AI drafts** — review and edit AI output in a modal before applying
- **ATS-friendly export** — clean, plain-text PDF via the browser's print dialog
- **Local persistence** — resume data and Ollama settings saved in `localStorage`
- **No build step** — plain HTML, CSS, and ES modules

---

## Requirements

- [Ollama](https://ollama.com) installed and running
- At least one model pulled, e.g. `ollama pull llama3.2`
- A modern browser (Chrome, Firefox, Edge, Safari)
- Python (for a local static server) **or** the VS Code **Live Server** extension

---

## Setup

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd "cv maker"