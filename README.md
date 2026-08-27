# CareerForge AI — Next-Gen AI-Powered Career & Portfolio Builder

> **A modern web platform where students and early-career professionals craft AI-assisted resumes & portfolios, analyze skill gaps, explore career recommendations, and receive an autonomous multi-step "AI Career Agent" that tracks their progress over time.**

---

## 🌟 Key Features & Modules

1. **User Authentication & Profile** (`Module 1 & 2`):
   - Firebase Auth (Email/Password, Google Sign-In, Password Reset) + 1-Click Demo Sandbox.
   - Profile management: Education, interactive skill tags with proficiency levels, target role, GitHub/LinkedIn links, and avatar storage.
2. **AI Resume Builder & PDF Exporter** (`Module 3`):
   - Structured multi-section resume builder with Google XYZ-formula AI bullet generator.
   - AI Career Objective / Summary generator with 3 tone presets (Impact, Technical, Visionary).
   - Real-time side-by-side ATS paper preview and 1-click PDF download via `html2pdf.js`.
3. **AI Portfolio Builder & Public Sharing** (`Module 4 & 10`):
   - Showcase projects with Problem -> Architecture -> Outcome AI case study storytelling.
   - AI "About Me" generator with personal philosophy pillars.
   - Public read-only shareable portfolio URL (`/pages/public-portfolio.html?u={uid}`).
4. **Reusable AI Content Assistant** (`Module 5`):
   - Embedded across the app with user-selectable tones (*Professional*, *Impactful*, *Technical*, *Concise*).
5. **Career Recommendation Engine** (`Module 6`):
   - Ranked career paths with fit score %, market demand, salary benchmarks, and match rationales.
6. **Skill Gap Analysis & Matrix** (`Module 7`):
   - Target role benchmarking with category progress meters and prioritized remediation plans.
7. **Personalized Learning Roadmap** (`Module 8`):
   - Sequenced 12-week time-boxed curriculum with curated open course topics and capstone project blueprint.
8. **ATS Resume Scanner & Auditor** (`Module 9`):
   - ATS algorithm scoring (0-100), missing technical keywords checklist, and line-by-line diff fixes.
9. **Autonomous 8-Step Career Agent** (`Agentic AI Layer`):
   - Multi-step pipeline evaluating student dossiers, tracking deltas across runs, and assigning the **Top 3 Highest-Priority Actions** for the week.
10. **Data Privacy & GDPR Compliance**:
    - Complete account and subcollection deletion via `deleteMyData`.

---

## 🏗️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System with HSL Tokens & Glassmorphism), Vanilla JavaScript (Native ES Modules, No build step / bundler).
- **Backend**: Firebase Cloud Functions (Node.js 20).
- **Database**: Cloud Firestore (Structured per-user subcollections).
- **Auth**: Firebase Authentication (Email/Password + Google Sign-In).
- **Storage**: Firebase Storage (Avatars, project media).
- **Hosting**: Firebase Hosting.
- **LLM Provider**: Anthropic API (Claude 3.5 Sonnet / Claude 3.7) proxied strictly through serverless Cloud Functions.

---

## 📂 Repository Structure

```
Career-and-Portfolio-Builder/
├── frontend/
│   ├── index.html                  # Landing page & feature showcase
│   ├── pages/                      # Application screens
│   │   ├── auth.html               # Sign in / Register / Google Auth
│   │   ├── dashboard.html          # Career Cockpit & Agent Status
│   │   ├── profile.html            # Profile, Skills, Links & GDPR removal
│   │   ├── resume-builder.html     # AI Resume Builder with live ATS preview
│   │   ├── portfolio-builder.html  # AI Portfolio Builder with Case Studies
│   │   ├── recommendations.html    # AI Career Path Recommendations
│   │   ├── skill-gap.html          # Skill Gap Analysis & Radar Matrix
│   │   ├── learning-roadmap.html   # 12-Week Time-Boxed Learning Plan
│   │   ├── resume-analyzer.html    # ATS Resume Scoring & Diff Audit
│   │   ├── career-agent.html       # 8-Step Autonomous Career Agent
│   │   └── public-portfolio.html   # Public Shareable Portfolio
│   ├── css/
│   │   ├── main.css                # Design system & CSS tokens
│   │   ├── components.css          # Cards, modals, buttons, forms, badges
│   │   ├── responsive.css          # Breakpoints (375px, 768px, 1280px)
│   │   └── print.css               # Resume PDF print layout
│   └── js/
│       ├── firebase-config.js      # Firebase v10 modular initialization
│       ├── auth.js                 # Authentication service & listeners
│       ├── storage.js              # Avatar & media upload service
│       ├── ui-utils.js             # Toasts, modals, button spinners
│       ├── nav.js                  # Navigation shell & dropdown
│       ├── api/                    # Cloud Function wrappers
│       │   ├── client.js           # Central API client & mock engine
│       │   ├── resume-api.js
│       │   ├── portfolio-api.js
│       │   ├── career-api.js
│       │   ├── content-api.js
│       │   └── agent-api.js
│       └── pages/                  # Page controllers
│           ├── auth.js
│           ├── dashboard.js
│           ├── profile.js
│           ├── resume-builder.js
│           ├── portfolio-builder.js
│           ├── recommendations.js
│           ├── skill-gap.js
│           ├── learning-roadmap.js
│           ├── resume-analyzer.js
│           ├── career-agent.js
│           └── public-portfolio.js
├── backend/
│   ├── functions/
│   │   ├── package.json
│   │   ├── index.js                # Cloud Functions registry
│   │   ├── ai/                     # Claude AI features (Tunable Prompts)
│   │   │   ├── resumeGenerator.js
│   │   │   ├── portfolioGenerator.js
│   │   │   ├── contentAssistant.js
│   │   │   ├── careerRecommender.js
│   │   │   ├── skillGapAnalyzer.js
│   │   │   ├── courseRecommender.js
│   │   │   └── resumeAnalyzer.js
│   │   ├── agents/
│   │   │   └── careerAgent.js      # 8-step Autonomous Career Pipeline
│   │   └── utils/
│   │       ├── anthropicClient.js  # Claude client with JSON retry
│   │       ├── prompts.js          # Centralized tunable prompts
│   │       ├── authMiddleware.js   # Token verification
│   │       ├── dataService.js      # Firestore CRUD helpers
│   │       └── userDataCleaner.js  # deleteMyData GDPR logic
│   ├── firestore/
│   │   ├── firestore.rules         # Per-user security rules
│   │   └── firestore.indexes.json
│   └── config/
│       ├── firebase.json           # Hosting & Function rules
│       └── .firebaserc
├── DECISIONS.md
└── README.md
```

---

## 🚀 Quick Start & Local Setup

### 1. Standalone Frontend Preview (Zero Installation)
Because the frontend uses native ES Modules, you can run it immediately with any static HTTP server:

```bash
# Using Python 3 built-in server:
python -m http.server 8000 --directory frontend

# OR using npx serve:
npx serve frontend
```
Then open `http://localhost:8000/` in your browser.
*Note: The built-in developer simulation engine enables full end-to-end testing of every AI tool and Agent step even before configuring backend credentials.*

---

### 2. Backend Cloud Functions Setup

1. **Install Backend Dependencies**:
   ```bash
   cd backend/functions
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in `backend/functions/`:
   ```ini
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ALLOW_ANONYMOUS_DEV=true
   ```

3. **Run Firebase Emulators (Optional)**:
   ```bash
   firebase emulators:start
   ```

4. **Deploy to Firebase**:
   ```bash
   firebase login
   firebase use <your-firebase-project-id>
   firebase deploy
   ```

---

## 🔒 Security & Firestore Rules

- **Strict User Scoping**: All user data (`users/{uid}/*`) is protected by rules checking `request.auth.uid == userId`.
- **Public Portfolios**: Anyone can view a portfolio if and only if `resource.data.isPublished == true`.
- **API Key Confidentiality**: All Claude API calls are made server-side in Cloud Functions.

---

## 📄 License
MIT License. Developed for emerging professionals and students worldwide.
