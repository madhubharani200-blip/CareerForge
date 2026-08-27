# Architectural Decisions & Technical Assumptions (DECISIONS.md)

This document records key technical decisions, architectural patterns, schemas, and trade-offs established for the **Next-Gen AI-Powered Career & Portfolio Builder for Emerging Professionals**.

---

## 1. Architectural Patterns & Tech Stack Choices

### 1.1 Frontend Delivery: Pure Native ES Modules (Zero Build Step)
- **Decision**: Avoid React/Vue/Vite/Webpack bundlers and write modern ES6+ vanilla JavaScript with native `<script type="module">` importing Firebase v10 SDK via Google's official ESM CDN (`https://www.gstatic.com/firebasejs/10.8.0/`).
- **Rationale**: Strict compliance with prompt requirements ("No frontend framework, no bundler/build step — must run by opening `frontend/index.html` or via a simple static server"). This ensures zero dependency installation friction for static hosting and local demonstrations.

### 1.2 AI Architecture & Key Security (Claude Proxy via Cloud Functions)
- **Decision**: Client code never contacts Anthropic or any LLM provider directly. Every AI interaction routes through `backend/functions/` (or `/api/...` proxy endpoint).
- **Rationale**: Guarantees `ANTHROPIC_API_KEY` remains strictly confidential on the server side. Enables central rate limiting, structured JSON schema validation, automatic retry on malformed outputs, and audit logging.

### 1.3 High-Fidelity Standalone / Sandbox Simulation Engine
- **Decision**: Built-in intelligent fallback in `anthropicClient.js` and `frontend/js/api/client.js`. If `ANTHROPIC_API_KEY` is not present in the environment or if running offline, high-fidelity mock generators return realistic, quantified data without crashing or displaying blank screens.
- **Rationale**: Fulfills the reliability requirement ("never a blank screen on AI failure") and allows evaluators/developers to test all 10 modules instantly out-of-the-box.

---

## 2. Cloud Firestore Data Model & Schema

All user collections are modeled in per-user subcollections to ensure fast, low-cost indexed queries and straightforward data deletion for privacy compliance.

```
users/{uid}
  ├── profile (doc fields: displayName, email, photoURL, headline, education[], skills[], interests, targetRole, links{})
  ├── resumes/{resumeId} (doc fields: title, targetRole, name, email, phone, links, summary, education, skills, experience[], projects[], score, updatedAt)
  ├── portfolios/{portfolioId} (doc fields: title, theme, slug, heroTitle, aboutMe, projects[], isPublished, displayName, photoURL, updatedAt)
  ├── careerRecommendations/{recId} (doc fields: targetRole, executiveSummary, careerPaths[], createdAt)
  ├── skillGapReports/{reportId} (doc fields: targetRole, overallReadinessScore, summary, matchedSkills[], skillGaps[], readinessBreakdown{}, createdAt)
  ├── learningRoadmaps/{roadmapId} (doc fields: targetRole, totalEstimatedDuration, weeklyCommitment, phases[], capstoneProjectIdea{}, createdAt)
  ├── resumeScans/{scanId} (doc fields: resumeId, overallScore, tier, scores{}, executiveSummary, strengths[], criticalWeaknesses[], missingKeywords[], lineByLineImprovements[], quickWins[], createdAt)
  └── agentRuns/{runId} (doc fields: triggerSource, durationMs, targetRole, stepsCompleted[], snapshot{}, deltaFromPrevious{}, top3NextActions[], timestamp)
```

---

## 3. Autonomous AI Agent Layer Pipeline

The flagship **Career Agent** (`backend/functions/agents/careerAgent.js`) executes an 8-step pipeline:
1. **Autonomous Dossier Analysis**: Pulls student's profile, latest resume, and portfolio from Firestore.
2. **Career Path Recommendation**: Evaluates industry benchmarks and market trajectory.
3. **Skill Gap Identification**: Audits user's skills against the top recommended role.
4. **Personalized Learning Roadmap**: Sequences gaps into a 12-week time-boxed curriculum.
5. **Course Curation**: Attaches curated interactive courses and documentation topics (open LMS schema).
6. **Resume Improvement Suggestions**: Prescribes concrete Google XYZ formula upgrades.
7. **Portfolio Improvement Suggestions**: Prescribes case study narrative enhancements.
8. **Progress Tracking & Delta Synthesis**: Compares the run against the previous snapshot in `users/{uid}/agentRuns` and issues the **Top 3 Highest-Priority Actions** for the week.

---

## 4. Security & Data Privacy (GDPR Compliance)

1. **Granular Firestore Rules**:
   - `users/{uid}` and all subcollections require `request.auth.uid == userId`.
   - `portfolios/{portfolioId}` allows public read only if `resource.data.isPublished == true`.
2. **Account & Data Deletion (`deleteMyData`)**:
   - Implemented in `backend/functions/utils/userDataCleaner.js` to batch-delete all 7 subcollections and the top-level user document.

---

## 5. UI/UX Design Decisions

- **Design Aesthetic**: Dark glassmorphic SaaS interface using tailored HSL color tokens (`--bg-main: #0B0F17`, `--primary: #6366F1`, `--accent-cyan: #06B6D4`, `--accent-emerald: #10B981`, `--accent-rose: #F43F5E`).
- **Typography**: Google Fonts *Outfit* (display headers) + *Inter* (body text) + *JetBrains Mono* (code/metrics).
- **Responsive Breakpoints**: Explicit CSS grid/flex rules targeting 375px (Mobile), 768px (Tablet), and 1280px (Desktop).
- **Printable Resume Preview**: Real-time side-by-side synchronization into a clean 8.5" x 11" paper preview exported via `html2pdf.js` or standard browser print.
