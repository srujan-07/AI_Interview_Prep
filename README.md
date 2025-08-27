# Voice Interview Prep (React + Vite + TypeScript)

An audio-first mock interview app. It generates role-aware questions from an uploaded resume, speaks each question, listens to your voice responses, asks targeted follow-ups, and produces results at the end.

## Features
- Full voice flow: questions spoken, voice captured; minimal on-screen text
- Question generation from resume content and selected role
- Targeted follow-ups based on what you said (keywords, metrics, quoted phrases)
- Auto-continue after you stop speaking (silence timeout and final-result handling)
- Automatic end prompt: say "end interview" to finish
- Polished, minimal, audio-focused UI

## Quick Start
1. Prerequisites
   - Node.js 18+
   - Modern Chromium-based browser (Chrome recommended) with mic access
2. Install
   - `npm install`
3. Run (development)
   - `npm run dev`
   - Open the printed Local URL (e.g., http://localhost:5173)
4. Build (production)
   - `npm run build`
   - `npm run preview` to serve the production build locally

## How It Works
- Resume parsing: simple client-side extraction (see `src/services/resumeParser.ts`). Text, skills, and experience entries guide question generation.
- Question generation: template + heuristic approach (see `src/services/questionGenerator.ts`).
  - Role-specific, technical, experience, and behavioral questions
  - Follow-ups use hooks from your last answer (tech keywords, numbers/metrics, quoted phrases, concepts like performance/security) to make prompts more specific
- Speaking questions:
  - Tries Murf TTS first (`src/services/murfApi.ts`)
  - Falls back to browser `speechSynthesis` if Murf fails/unavailable
- Listening to your answer: Web Speech API (browser built-in) via `src/services/speechService.ts`
  - Streams interim and final transcripts
  - Auto-submit on final result
  - 5s silence timeout submits current transcript or skips ahead if none detected
- Interview flow management: `src/hooks/useInterview.ts`
  - Drives speaking/listening, follow-ups, error handling, retry on transient recognition errors
  - End-of-interview voice confirmation

## Project Structure
- `src/App.tsx` – App state and interview screen routing
- `src/components/InterviewInterface.tsx` – Audio-first interview UI
- `src/components/InterviewResults.tsx` – Post-interview summary
- `src/components/*` – Setup inputs, visualizer, etc.
- `src/hooks/useInterview.ts` – Core interview logic (speak/listen/progress)
- `src/services/*` – Question generation, speech service, resume parsing, TTS
- `src/types/` – TypeScript types for sessions, questions, resumes

## Key UX Behaviors
- Audio-only questions: the current question isn’t displayed; it is spoken
- Controls: Start/Stop/Pause/Resume/End
- Auto-continue: after you pause speaking, it proceeds automatically
- Follow-ups: inserted immediately after your last answer when relevant
- Completion: after the final question, it prompts you to say "end interview"

## Configuration Notes
- Murf TTS
  - The Murf service is optional; the app falls back to browser TTS
  - If integrating a real Murf API key/endpoint, configure in `src/services/murfApi.ts`
- Voice settings: Accessible via the "Voice Settings" button on the home screen

## Troubleshooting
- "Speech recognition not supported": Use Chrome or a Chromium browser; ensure mic permissions are granted and page is served over http://localhost or https
- "network" / "no-speech" errors: The app auto-retries transient errors a couple of times. Refresh the page and try again if it persists
- No follow-ups: Provide concrete details (tools, metrics, quotes) to trigger more targeted prompts
- Nothing happens after I stop speaking: Pause for ~5 seconds; the silence timeout will submit and continue

## Privacy
All processing is client-side except optional TTS requests to the Murf service if you wire real credentials. No data is stored remotely by default.

## Scripts
- `npm run dev` – Start Vite dev server
- `npm run build` – Production build
- `npm run preview` – Preview production build
- `npm run lint` – Run ESLint

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS + Framer Motion
- Web Speech API (ASR) + Speech Synthesis (TTS fallback)
- Optional Murf TTS integration

## Roadmap Ideas
- Pluggable LLM back-end for dynamic question generation
- Scoring rubric and richer analytics
- Session export/share and cloud storage options

