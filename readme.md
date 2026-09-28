# CVForge

A local-first AI resume builder with optional cloud LLM acceleration.
No accounts, no subscriptions, no cloud storage of your data. Everything runs
on your machine — with optional cloud AI providers if you want the speed.

![Status](https://img.shields.io/badge/status-v1.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Table of Contents

1. [What is CVForge?](#what-is-cvforge)
2. [Your First 5 Minutes](#your-first-5-minutes)
3. [Understanding the Interface](#understanding-the-interface)
4. [Features](#features)
5. [Architecture](#architecture)
6. [Requirements](#requirements)
7. [Setup](#setup)
8. [Running the App](#running-the-app)
9. [Usage Guide](#usage-guide)
10. [AI Providers](#ai-providers)
11. [Templates](#templates)
12. [Project Structure](#project-structure)
13. [Troubleshooting & Problems Solved](#troubleshooting--problems-solved)
14. [Roadmap](#roadmap)
15. [License](#license)

---

## What is CVForge?

CVForge is a **resume builder that runs entirely in your browser**. You write
your resume across a guided 8-step wizard, and a live preview on the right
shows the finished document in real time. When you're ready, you export it
as a print-ready PDF.

Optionally, you can connect an AI provider (local Ollama, or free cloud
services like Groq) to:

- **Generate a professional summary** from your experience
- **Rewrite your bullet points** to be more impactful
- **Scan your resume against a job description** for keyword gaps
- **Chat with an AI** about how to improve specific sections
- **Write a cover letter** from your resume + the job description
- **Prepare for interviews** with likely questions
- **Match internship requirements** against your skills

None of your data leaves your machine unless you explicitly use a cloud AI
provider. All resume data stays in your browser's `localStorage`.

---

## Your First 5 Minutes

This section walks you through the app the very first time you open it. Follow
along in order — it will save you from confusion later.

### 1. Opening the app

You'll land on the **Gallery** — a grid of 8 resume templates. Each card
shows a small preview of what your resume will look like in that style.

**Pick any template** by clicking it. A modal appears with a full-size
preview. Click **Use this template**.

The Gallery disappears, and you now see the **Editor**.

### 2. Understanding what you're looking at

The Editor has **five distinct regions**. Take 30 seconds to spot each:
┌─────────────────────────────────────────────────────────────┐
│ HEADER (logo, theme toggle, settings, save, clear, export)│
├─────────────────────────────────────────────────────────────┤
│ STEPPER (1 · 2 · 3 · 4 · 5 · 6 · 7 · 8) │
├───────────────────────────┬─────────────────────────────────┤
│ │ │
│ EDITOR PANEL │ PREVIEW PANEL │
│ (current step's form) │ (live resume preview) │
│ │ │
│ │ ← Resize handle between them │
│ │ │
│ FOOTER NAV (Back / Next) │ │
│ │ │
└───────────────────────────┴─────────────────────────────────┘

- **Header** — always visible. Holds the CVForge logo (click it to return to
  the gallery), theme toggle, AI settings gear, Save, Clear, and Export PDF.
- **Stepper** — shows all 8 steps. Click any number to jump to that step.
  Filled circles are completed steps; the blue ring is where you are now.
- **Editor Panel** — the current step's form fields.
- **Preview Panel** — your resume updates as you type. This is what will be
  printed to PDF.
- **Resize Handle** — the thin bar between the two panels. Drag left or right
  to make the preview bigger or smaller. Double-click it to reset.

### 3. The 8 steps

Work through these in order (or jump around with the stepper):

| Step | What you do |
|---|---|
| **1. Personal** | Name, title, email, phone, location, links |
| **2. Summary** | 2–4 sentence pitch. Optional: generate with AI. |
| **3. Experience** | Your roles. One bullet point per line. |
| **4. Education** | Degrees, schools, years |
| **5. Projects** | Side projects or portfolio pieces |
| **6. Skills** | Comma-separated or one per line |
| **7. Tailor** | Job description tools: ATS scan, AI analysis, interview prep, internship matcher, AI chat |
| **8. Cover** | Generate a cover letter from your resume + the JD on step 7 |

### 4. Filling in your first section

Go to **Step 1**. Type your name, job title, and email. Watch the preview
panel update live on the right — no save button needed.

Move to **Step 2**. Either write your own summary or click **AI Generate**.
If you haven't set up AI yet, skip this for now and come back.

Continue through steps 3–6. Each experience card has:

- **⋮⋮** handle (left) — drag to reorder entries
- **Duplicate** — clone an entry
- **Remove** — delete it
- **AI Improve** — rewrite the bullets

### 5. Step 7 — the power-user step

This is where the app goes from "an editor" to "a career tool."

**Paste a job description** you're applying to into the big text box.

Then choose what to do with it:

- **Scan Keywords** — see how well your resume matches the JD (0–100% score)
- **AI Deep Analysis** — get specific advice on what to fix
- **Generate Questions** (Interview Prep) — likely questions you'll be asked
- **Match Requirements** (Internship Matcher) — paste short requirements, see what matches
- **AI Chat** — refine your resume conversationally

### 6. Step 8 — the cover letter

If you pasted a JD on step 7, step 8 will generate a personalized cover letter
from it. Pick a tone (professional, warm, bold, formal) and click
**Generate Cover Letter**. Edit the result freely.

### 7. Exporting

When you're done, click **Export PDF** in the header. In the print dialog:

- **Uncheck "Headers and footers"** (this removes the URL from the top/bottom)
- Choose **Save as PDF**

That's your final resume, ready to send.

### 8. What now?

You've just built a resume. From here:

- **Save** (header button) — persists everything to your browser
- **Switch templates** — click the CVForge logo → pick a different template.
  Your content stays intact.
- **Back up** — gear icon → **Export JSON** downloads a file with everything
- **Restore** — gear icon → **Import JSON**

---

## Understanding the Interface

### Header (top of screen)

| Element | What it does |
|---|---|
| **CVForge logo** | Click to return to the template gallery |
| 🌙 / ☀️ | Toggle dark mode (persists across sessions) |
| ⚙️ | Open AI settings (provider, API keys, models) |
| 👁 | Toggle the preview panel (mobile only) |
| **Save** | Manually save to localStorage (auto-saves anyway) |
| **Clear** | Wipe all data — resume, chat, cover letter, settings |
| **Export PDF** | Open the print dialog with a clean resume layout |

### Stepper (below header)

Eight numbered circles. Click any to jump. Completed steps show a ✓.

### Editor panel (left)

Shows the current step's form. Scroll within it, or use the **Back / Next**
buttons at the bottom.

### Preview panel (right)

Live preview of your finished resume. The content here is what prints to PDF.
Different templates render this panel differently (some add a sidebar, some
add a timeline).

### Resize handle (between editor and preview)

- **Drag** left or right to change preview width
- **Double-click** to reset to default
- **Arrow keys** (when focused) to nudge by 10px

### Step 7 panels (in order)

1. **Job Description** text box
2. **ATS scan mode toggle** — Fast vs Semantic
3. **Scan Keywords / AI Deep Analysis** buttons
4. **Progress bar** (appears during semantic scans)
5. **ATS Results** (score ring + matched/missing chips)
6. **AI Output** (deep analysis text)
7. **Interview Prep** panel
8. **Internship Matcher** panel
9. **AI Chat** panel
10. **Section Order** panel (drag to reorder resume sections)

### Modals

- **Template preview** — full-size template preview with a Use button
- **AI Draft** — appears when you generate a summary, so you can edit before applying
- **Confirm** — styled yes/no dialog for destructive actions

---

## Features

### Editor
- **8-step guided wizard** — Personal → Summary → Experience → Education → Projects → Skills → Tailor → Cover Letter
- **Live preview** — print-ready resume updates as you type
- **Drag-to-resize** — pull the divider to make either panel bigger
- **Drag-to-reorder** — rearrange entries and sections
- **Duplicate entries** — clone a role and edit the copy
- **Whole-page scroll** with sticky header, stepper, and preview

### Templates
8 print-ready designs, switchable anytime without losing data:

| Template | Best for |
|---|---|
| Classic Serif | Law, academia, finance |
| Modern Writer | General professional (default) |
| Coral | Design, marketing, creative |
| Emerald | Healthcare, sustainability, product |
| Minimal | ATS-heavy applications |
| Two-Column | Senior roles, dense info |
| Timeline | Career progression |
| Academic | Research, teaching, CVs |

### AI assistance
Streaming responses from any configured provider. All prompts enforce plain-text
output (no markdown) and pass through a sanitizer.

- **Summary generator** — streams into an editable review modal
- **Bullet improvement** — stronger verbs, quantified impact
- **Deep job analysis** — keyword gaps, bullet rewrites, strategic notes
- **AI Chat** — back-and-forth refinement with a persistent context window
  (last 20 messages)

### Cover Letter Generator (Step 8)
- Generated from your resume + the pasted job description
- 4 tone options: professional, warm, bold, formal
- Streams live from the active provider
- Editable, saved to localStorage, one-click copy

### Interview Prep (Step 7)
- Generates 3 technical + 3 behavioral + 2 gap-based questions
- Includes a tailored elevator pitch
- "Practice in chat" button hands questions to the AI Chat panel

### Internship Matcher (Step 7)
- Paste short-form requirements (one per line)
- Context-aware analysis: strong matches, partial matches, gaps, quick wins
- "Ask in chat" button to iterate on improvements

### ATS keyword scanner
- **Fast mode** — offline, instant, keyword-frequency analysis
- **Semantic mode** — uses `nomic-embed-text` embeddings to match meaning
  - Catches "UX" ↔ "user experience", "React" ↔ "React.js"
  - In-memory cache for near-instant repeat scans
- **Score ring** with color tiers (red / amber / green)
- Matched and missing chips, high-priority gaps highlighted

### Quality of life
- **Dark mode** — persists across sessions
- **Toast notifications** — non-blocking feedback
- **Styled confirm dialogs** — better than browser `confirm()`
- **JSON export/import** — back up or transfer your resume
- **Local persistence** — resume, settings, theme, chat, cover letter saved to `localStorage`
- **Print-optimized** — no chrome, no URL footer, tight margins
- **No build step** — plain HTML, CSS, ES modules
- **PWA-installable** — install as a desktop app in Chrome/Edge

---

## Architecture
Browser
│
├── Static HTML / CSS / JS (no backend)
│
├── localStorage
│ ├── cv-maker-settings (provider, models, API keys)
│ ├── cv-maker-chat (chat history)
│ ├── cv-maker-cover (cover letter)
│ ├── cv-maker-theme (light/dark)
│ ├── cv-maker-preview-width
│ └── cv-maker-resume (all resume data)
│
└── AI calls → Provider
├── Ollama → http://localhost:11434 (local)
├── Groq → https://api.groq.com/openai/v1 (cloud)
└── DeepSeek → https://api.deepseek.com/v1 (cloud)

**Key design decisions:**

- **No backend** — everything runs client-side. Your resume never leaves your
  browser unless you explicitly choose a cloud provider.
- **Provider abstraction** — one `callAI()` function handles Ollama's native
  API and OpenAI-compatible endpoints (Groq, DeepSeek, and any future
  provider).
- **Per-provider settings** — each provider stores its own model and API key.
  Switching providers never carries over the wrong value.
- **Streaming everywhere** — tokens render as they're generated instead of
  waiting for the full response.

---

## Requirements

### Required
- **A modern browser** — Chrome, Edge, Firefox, or Safari
- **A local static server** — either:
  - Python 3 (for `python -m http.server`), or
  - VS Code with the **Live Server** extension

### For local AI (optional)
- **[Ollama](https://ollama.com)** installed and running
- Two models pulled:

  ```bash
  ollama pull llama3.2
  ollama pull nomic-embed-text
  
2. (Optional) Start Ollama with the right CORS origin
Ollama blocks browser requests from unknown origins by default.

Windows (PowerShell) — persistent:

powershell
[Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "http://127.0.0.1:5500,http://localhost:5500,http://localhost:8000", "User")
Then quit Ollama from the system tray and relaunch from the Start Menu.

macOS / Linux:

bash
export OLLAMA_ORIGINS="http://127.0.0.1:5500,http://localhost:5500,http://localhost:8000"
ollama serve
Env vars are read only at startup. If you change OLLAMA_ORIGINS,
restart Ollama.

3. Configure AI providers in the app
Click the gear icon in the header:

For Ollama:

Provider: Ollama (local)

Ollama URL: http://localhost:11434

Chat model: exact name from ollama list (e.g. llama3.2:latest)

Embedding model: nomic-embed-text

For Groq:

Provider: Groq (free tier)

Paste your gsk_... API key

Chat model: openai/gpt-oss-120b (default), or click
Refresh models from provider to see the live list

For DeepSeek:

Provider: DeepSeek

Paste your API key

Chat model: deepseek-chat or deepseek-reasoner

Settings are saved to localStorage and restored on refresh.

4. API key storage warning
API keys are stored in your browser's localStorage. That's fine for a
personal machine. Do not use the app on a shared computer with cloud
providers configured — anyone with access to DevTools can read the key.

Running the App
Option A — Launcher scripts (recommended)
Windows: double-click start.bat in the project folder. It starts Ollama
(if installed), spins up the Python server on port 8000, and opens the app.

macOS / Linux: run ./start.sh (make executable once: chmod +x start.sh).

Option B — Install as a PWA (best experience)
Once the app is running:

In Chrome or Edge, look for the install icon in the address bar (or
⋮ menu → Install page as app).

Name it CVForge → Install.

Right-click the taskbar icon → Pin to taskbar.

Now it opens in standalone mode — no browser tabs, no URL bar. Feels like a
native app.

Note: the PWA still needs the server running. If you close the server
window, the PWA shows a blank page.

Option C — Silent background launch
Create start-silent.vbs in the project folder:

vbscript
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.Run "cmd /c python -m http.server 8000", 0, False
WshShell.Run "chrome --app=http://localhost:8000/index.html", 0, False
Double-click → no console window appears. To stop the server, open Task
Manager → find python.exe → End task.

To auto-start on Windows login: press Win+R, type shell:startup, drop a
shortcut to start-silent.vbs in that folder.

Option D — VS Code Live Server
If you're editing code:

Right-click index.html → Open with Live Server

App opens at http://127.0.0.1:5500

Requires VS Code to stay open

Usage Guide
Walk the wizard
Personal — name, title, contact info

Summary — 2–4 sentences. Click AI Generate for an AI draft.

Experience — roles newest first. Bullets go one per line. Click
AI Improve on any card.

Education — degrees, certifications, coursework

Projects — side projects, open source, portfolio pieces

Skills — comma-separated or one per line

Tailor — paste a job description, scan for ATS gaps, generate
interview prep, match internship requirements, chat with AI

Cover — generate a cover letter from your resume + the JD

AI workflow
Summary:

Step 2 → click AI Generate

Modal opens, text streams in

Edit in the modal, then Apply

Bullets:

Step 3 → click AI Improve on any experience card

Wait for the full response (bullets don't stream by design — partial
rewrites look messy)

Deep analysis:

Step 7 → paste JD → AI Deep Analysis

Streams in: keyword gaps, bullet rewrites, strategic note

Chat:

Step 7 → scroll to AI Chat

Ask anything: "Make my summary shorter", "Add metrics to my Stripe
bullets", "What are my weakest points?"

Context is remembered for the last 20 messages

ATS scanning
Step 7 → paste JD

Choose mode:

Fast — instant, offline, keyword frequency

Semantic — Ollama embeddings, catches synonyms, slower first run

Click Scan Keywords

Read the score ring, matched/missing chips, high-priority gaps

Cover letter
Step 7 → paste JD (required input)

Step 8 → optionally set company name and tone

Click Generate Cover Letter → streams in

Edit freely; changes save automatically

Click Copy to clipboard and paste into the application portal

Interview prep
Step 7 → paste JD

Click Generate Questions in the Interview Prep panel

Read the questions + elevator pitch

Click Practice in chat to have the AI help draft answers

Internship matcher
Step 7 → paste requirements into the Internship Matcher box
(one per line, e.g. "Python experience", "Team collaboration")

Click Match Requirements

Read: strong matches, partial matches, gaps, quick wins

Click Ask in chat to work through the gaps

Export
Click Export PDF in the header (or on step 8)

In the print dialog: uncheck "Headers and footers" (Chrome: More
settings → uncheck)

Save as PDF

Backup & restore
Gear icon → Export JSON — downloads a full backup

Gear icon → Import JSON — restores from a backup file

AI Providers
Provider	Cost	Speed	Privacy	Embeddings
Ollama (local)	Free	5–20 tok/s	100% local	✅ Yes
Groq (free tier)	Free, 30 req/min	200–800 tok/s	Cloud	❌ No
DeepSeek	~$0.14/M input	30–60 tok/s	Cloud	❌ No
Recommendation: Use Groq for everyday refinement (fast, free), switch
to Ollama when you need semantic ATS scanning (only Ollama supports
embeddings).

Model notes
Groq: models change frequently. If you get 404 errors, click Refresh
models from provider to load the current list, then pick a valid one.

Reasoning models (openai/gpt-oss-120b, deepseek-reasoner) emit hidden
chain-of-thought before producing visible output. The app handles this
automatically (raises the token cap, sets the correct temperature, ignores
reasoning frames).

Templates
All 8 templates render from the same underlying data. Switching never loses
content.

Where to switch: click the CVForge logo in the header → gallery →
pick a template.

Templates are defined in two files:

css/templates.css — the visual styles per template

js/ui.js — TEMPLATE_META object with name and description

Adding a new template:

Add the name to the TEMPLATES array in js/ui.js

Add an entry to TEMPLATE_META

Add the CSS block in css/templates.css — target
.preview-container.template-{name}

Project Structure
text
cv maker/
├── index.html              # App shell — header, stepper, 8 wizard pages, modals
├── manifest.json           # PWA manifest
├── start.bat               # Windows launcher
├── start.sh                # macOS/Linux launcher
├── README.md
├── LICENSE
├── .gitignore
├── .editorconfig
├── assets/
│   └── icon.svg            # App icon (also used in PWA manifest)
├── css/
│   ├── styles.css          # Design tokens, layout, dark mode, print
│   ├── gallery.css         # Template gallery + preview modal
│   └── templates.css       # 8 resume template styles
└── js/
    ├── main.js             # Entry point — wires everything
    ├── state.js            # Resume data model + sample
    ├── storage.js          # localStorage persistence
    ├── ui.js               # Rendering, stepper, preview, modals
    ├── ai.js               # AI orchestration + chat rendering
    ├── ai-call.js          # Unified caller (Ollama + OpenAI-compatible)
    ├── providers.js        # Provider registry
    ├── chat.js             # Chat context window (sliding window + system prompt)
    ├── cover.js            # Cover letter generator
    ├── interview.js        # Interview prep generator
    ├── internship.js       # Internship matcher
    ├── ats.js              # Fast keyword extraction + scoring
    ├── semantic.js         # Ollama embeddings-based matching
    ├── theme.js            # Dark mode
    ├── toast.js            # Toasts + confirm dialog
    ├── resizer.js          # Preview panel drag-to-resize
    └── utils.js            # escapeHtml, sanitizeAIOutput
Troubleshooting & Problems Solved
The full list of issues encountered during development, and how each was
fixed. If you hit one of these, the fix is right here.

Blank gallery on first load
Symptom: Header rendered but no template cards appeared.

Cause: A JavaScript module failed to load, which cascaded and stopped
main.js from running. Common triggers: missing file, duplicate function
declaration, or syntax error.

Fix: Open DevTools → Console. The first red error names the file. Common
cases:

semantic.js or ats.js missing → the import chain breaks

Duplicate scoreTier declaration → pasting a file twice

Duplicate declaration: Identifier 'scoreTier' has already been declared
Symptom: Console error, gallery blank.

Cause: A file was pasted into itself, resulting in the same
export function appearing twice.

Fix: Open the file, verify each export function name appears exactly
once. Delete the duplicate block.

CORS policy errors on Ollama
Symptom: Console: Access to fetch at 'http://localhost:11434/...' has been blocked by CORS policy

Cause: Ollama was started before setting OLLAMA_ORIGINS, or the origin
doesn't match exactly.

Fix:

Set OLLAMA_ORIGINS (see Setup section)

Quit Ollama from the system tray

Relaunch from Start Menu — env vars are only read at startup

Confirm with: curl http://localhost:11434 → should print "Ollama is
running"

localhost and 127.0.0.1 are different origins. Include both.

Groq 404: model does not exist
Symptom: The model 'llama-3.3-70b-versatile' does not exist or you do not have access to it.

Cause: Groq retired that model on 16 Aug 2026. Model names change
frequently.

Fix: Settings → Provider = Groq → click Refresh models from provider.
Pick a valid model from the dropdown (e.g. openai/gpt-oss-120b).

Summary modal opens but stays empty (Groq + reasoning model)
Symptom: Click AI Generate → modal appears → no text ever arrives.
Network tab shows 200 with ~66 KB response.

Cause: Reasoning models (Groq gpt-oss, DeepSeek reasoner) emit hidden
chain-of-thought tokens first. Our parser only reads delta.content, and the
token cap was too low — reasoning ate the entire budget before any visible
output.

Fix applied in js/ai-call.js:

Detect reasoning models: gpt-oss|o1|o3|o4|deepseek-reasoner|qwq

Triple max_completion_tokens for these models

Force temperature: 1 (Groq requires this for gpt-oss)

Set reasoning_effort: 'low' on gpt-oss models

Parser reads .content only, ignoring .reasoning frames

DeepSeek error shows "Groq" in the message
Symptom: Switching to DeepSeek still produced a Groq-flavored error.

Cause: Model name and API key were stored in flat localStorage fields
shared across providers. Switching to DeepSeek left the Groq model and key in
place.

Fix applied in js/main.js and js/ai-call.js:

Settings stored per-provider: settings.models[providerId] and
settings.apiKeys[providerId]

Switching providers resets the model field and API key field to that
provider's values

callAI reads the correct per-provider values

Browser adds URL footer to exported PDF
Symptom: Exported PDF shows 127.0.0.1:5500/index.html at top and bottom.

Cause: Chrome/Firefox add their own headers and footers during print by
default.

Fix: In the print dialog:

Chrome/Edge: More settings → uncheck Headers and footers

Firefox: Options → uncheck Print headers and footers

The app also sets @page { margin: 0 } for tighter print layout, but the
browser checkbox is the authoritative fix.

Preview panel disappeared after adding resizer
Symptom: Editor content jumped to full width, preview vanished.

Cause: The resizer needs a 3-column CSS grid: editor | resizer | preview. If the CSS variable --preview-width isn't set, the preview column
collapses to 0.

Fix: Confirm css/styles.css has:

css
:root {
  --preview-width: 460px;
  --resizer-w: 6px;
}
.app-main {
  grid-template-columns: minmax(0, 1fr) var(--resizer-w) minmax(0, var(--preview-width));
}
File encoding issue: â€” in CSS comments
Symptom: CSS comments contained garbled characters.

Cause: Copy-pasting between encodings — the file was saved as Windows-1252
instead of UTF-8.

Fix: In VS Code: click the encoding indicator in the bottom-right status
bar → Save with Encoding → UTF-8 (without BOM). Avoid special characters
(em-dashes, curly quotes) in CSS comments.

styles.css size dropped from 35 KB to 4 KB
Symptom: All styling vanished — buttons unstyled, modals in page flow.

Cause: When told to "append" additions to an existing file, the entire
file was replaced instead.

Fix: Restore from git (git checkout HEAD -- css/styles.css) or from the
last known-good version, then append the new block at the end. In VS Code:
Ctrl+End first, then paste.

Git merge conflict on readme.md
Symptom: git pull triggered a merge; readme.md had conflict markers.

Fix:

bash
# Keep your local version:
git checkout --ours readme.md
git add readme.md
git commit -m "Merge: resolve readme conflict"
git push
Or edit the file manually, remove the <<<<<<<, =======, >>>>>>> markers,
keep what you want, then git add + git commit.

Roadmap
Completed:

☑ Phase 1 — Core editor with live preview and Ollama integration
☑ Phase 2 — Multipage wizard, responsive layout
☑ Phase 3 — Template gallery
☑ Phase 3.1 — Realistic thumbnails + preview modal
☑ Phase 4 — Drag-to-reorder entries and sections
☑ Phase 5 — ATS keyword scanner
☑ Phase 5.1 — Semantic ATS matching via embeddings
☑ Polish — Dark mode, toasts, confirm modal, JSON export/import,
duplicate entries
☑ Layout — Whole-page scroll with sticky header/stepper/preview
☑ Print — Remove browser header/footer, tight margins
☑ Phase 6/7 — Two-column, timeline, academic templates + streaming AI
☑ Phase 8 — Multi-provider AI (Ollama / Groq / DeepSeek) + active chat
context
☑ Feature set — Cover letter, interview prep, internship matcher
☑ Quality — LICENSE, README, editorconfig, PWA manifest, launchers
Candidate next:

□ Multi-resume support (save variants for different job types)
□ Export to .docx (real Word file)
□ Portfolio link preview (auto-fetch favicon/title from project URLs)
□ Interview practice mode (AI scores your answers)
□ LinkedIn PDF import
License
MIT — see LICENSE.

text

---

## Save and commit

Save this as `README.md` in your project root. Then:

```powershell
git add README.md
git commit -m "Docs: comprehensive README with first-time walkthrough and interface guide"
git push
What's new in this version
Section	What it adds
What is CVForge?	Plain-English explanation before diving into features
Your First 5 Minutes	Step-by-step walkthrough for someone opening it for the first time
Understanding the Interface	Every UI element explained — header, stepper, panels, modals
Table of Contents	Numbered links so people can jump around
All other sections	Reorganized, cleaned up, kept complete

