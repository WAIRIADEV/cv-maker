# AI CV Maker

A local-first, single-page resume builder with AI assistance powered by [Ollama](https://ollama.com).
No accounts, no subscriptions, no cloud. All data stays in your browser.

## Features

- Live editor + print-ready preview side by side
- Dynamic sections: Personal Info, Summary, Experience, Education, Projects, Skills
- AI assistance via local Ollama:
  - Generate professional summary
  - Improve experience bullet points
  - Tailor resume against a job description
- Editable AI drafts (review before applying)
- Export to PDF via the browser's print dialog
- Local persistence via `localStorage`

## Requirements

- [Ollama](https://ollama.com) installed and running
- At least one model pulled, e.g. `ollama pull llama3.2`
- A modern browser (Chrome, Firefox, Edge, Safari)
- Python (for a local static server) **or** the VS Code Live Server extension

## Setup

1. Clone the repo:
   ```bash
   git clone <your-repo-url>
   cd "cv maker"