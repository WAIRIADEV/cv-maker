AI CV Maker
A local-first resume builder with AI assistance powered by Ollama. No accounts, no subscriptions, no cloud. Everything runs on your machine and your data stays in your browser.

Status License

Features
Editor
Guided wizard — 7 focused steps: Personal → Summary → Experience → Education → Projects → Skills → Export
Live preview — print-ready resume updates as you type
Drag-to-resize — pull the divider between editor and preview to make either side bigger
Drag-to-reorder — rearrange experience, education, projects, and resume sections by dragging
Duplicate entries — clone a role and edit the copy
Whole-page scroll — sticky header and stepper while the content flows naturally
Templates
8 print-ready designs:

Template	Best for
Classic Serif	Law, academia, finance
Modern Writer	General professional (default)
Coral	Design, marketing, creative
Emerald	Healthcare, sustainability, product
Minimal	ATS-heavy applications
Two-Column	Senior roles, dense info
Timeline	Career progression
Academic	Research, teaching, CVs
Switch anytime from the gallery. Your content stays intact.

AI assistance (local, via Ollama)
Generate summary — 3–5 sentence professional summary streamed live into an editable draft modal
Improve bullet points — stronger verbs and quantified impact per experience
Deep job analysis — keyword gaps, bullet rewrites, and a strategic note based on a specific JD
All prompts enforce plain-text output (no markdown) and pass through a sanitizer.

ATS keyword scanner
Fast mode — offline, instant, keyword-frequency analysis
Semantic mode — uses nomic-embed-text embeddings to match meaning, not just strings
Catches "UX" ↔ "user experience", "React" ↔ "React.js"
Results cached in memory for speed
Score ring with color-coded tier (red / amber / green)
Matched and missing chips — high-priority missing highlighted
Persists the JD with your resume
Quality of life
Dark mode — persists across sessions
Toast notifications — non-blocking feedback instead of alert()
Styled confirm dialogs — better than browser confirm()
JSON export/import — back up or transfer your resume
Local persistence — resume, settings, and theme saved to localStorage
Print-optimized — no chrome, no URL footer, tight margins
No build step — plain HTML, CSS, ES modules
Requirements
Ollama installed and running
Two models pulled:
ollama pull llama3.2
ollama pull nomic-embed-text