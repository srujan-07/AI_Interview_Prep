# AI Interview Prep - Integrated AI-Powered Interview Platform

This project combines a React TypeScript frontend with an AI-powered Python backend for conducting intelligent interview sessions. The system uses Google's Gemini AI (instead of Grok) to generate dynamic questions based on uploaded resumes and evaluate candidate responses.

## Architecture

- **Frontend**: React + TypeScript + Vite (Port 5173)
- **Backend**: Python Flask API (Port 5000)  
- **AI Engine**: Google Gemini API for question generation and evaluation
- **Document Processing**: PyMuPDF and python-docx for resume parsing
- **Speech**: Browser Web Speech API + optional Murf TTS integration

## Key Changes Made

### 1. AI Backend Integration
- Replaced static question templates with dynamic AI-generated questions
- Questions are now generated based on actual resume content and role requirements
- Real-time answer evaluation using AI

### 2. API Migration
- **Removed**: Grok API dependency
- **Added**: Google Gemini AI integration with API key: `AIzaSyAWF4TvMZMEv7W-MTkNdZzTel324MwrZaE`
- **New**: Flask REST API endpoints for seamless frontend-backend communication

### 3. Enhanced Resume Processing
- AI-powered document text extraction
- Improved parsing for PDF and DOCX files
- Fallback to client-side processing if backend is unavailable

## Quick Start

### Prerequisites
- Node.js 18+
- Modern Chromium-based browser (Chrome recommended) with mic access

### Installation & Setup
1. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

2. **Run the Application**
   ```bash
   npm run dev
   ```
   - Open http://localhost:5174/ (or the printed Local URL)

### How It Works

**NEW: Direct AI Integration**
- The frontend now directly integrates with Google Gemini AI for question generation and evaluation
- No separate Python backend required for basic functionality
- Questions are dynamically generated based on resume content using the same logic as the Ai-interview folder
- Real-time answer evaluation with detailed feedback

**Core Features:**
- **Smart Question Generation**: AI analyzes your resume and generates role-specific questions
- **Voice Interface**: Full voice flow - questions are spoken, responses captured via microphone
- **Real-time Evaluation**: Each answer is evaluated using AI with detailed scoring and feedback
- **Follow-up Questions**: Dynamic follow-ups based on your responses
- **Comprehensive Reporting**: Detailed performance analysis and improvement suggestions

**Workflow:**
1. Upload your resume (PDF, DOCX, or TXT)
2. Select your target role
3. AI generates personalized questions based on your resume content
4. Answer questions using voice input
5. Receive real-time evaluation and feedback
6. Get comprehensive performance report with improvement suggestions
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

