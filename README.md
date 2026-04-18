# NPTEL Study Hub — Innovation in Marketing

A production-ready React study app built from 12 weekly NPTEL assignment PDFs. Practice questions, take timed tests, and track your progress.

## Features

- 📚 **120 MCQs** organized by week (Weeks 1-12)
- 📖 **Study Mode** — One question at a time with submit/reveal answer
- 📝 **Test Mode** — Configurable tests with randomization, timer, and scoring
- 🔍 **Search & Filter** — Find questions by keyword, filter by status
- ⭐ **Bookmarks** — Save questions for quick access
- 🌙 **Dark Mode** — Toggle between light and dark themes
- 📊 **Progress Tracking** — Accuracy by week, test history
- 💾 **Import/Export** — Backup and restore your progress
- 📱 **Responsive** — Works on desktop and mobile

## Quick Start

```bash
cd nptelstudy
npm install
npm run dev
```

Open http://localhost:5173

## Deploy to Netlify

### Option 1: Netlify CLI
```bash
cd nptelstudy
npm run build
npx netlify deploy --prod --dir=dist
```

### Option 2: Git-based deploy
1. Push `nptelstudy/` to a GitHub repo
2. Go to [app.netlify.com](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repo
5. Build settings are auto-detected from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy"

## Project Structure

```
nptelstudy/
├── src/
│   ├── data/questions.json    # 120 parsed questions
│   ├── context/AppContext.tsx  # State management
│   ├── pages/
│   │   ├── Dashboard.tsx      # Stats & weekly overview
│   │   ├── WeekView.tsx       # Question list per week
│   │   ├── StudyMode.tsx      # Single-question study
│   │   └── TestMode.tsx       # Configurable tests
│   ├── types.ts               # TypeScript types
│   ├── App.tsx                # Layout & routing
│   └── index.css              # Design system
├── netlify.toml               # Netlify config
└── package.json
```

## Data Extraction

Questions were extracted from PDFs using `extract_questions.py` (PyMuPDF).

| Weeks | Answer Source | Confidence |
|-------|--------------|------------|
| 1-6 | No answers in PDF | ⚠️ Low — needs manual review |
| 7-9 | "ANSWERS" section at end of PDF | ✅ High |
| 10-12 | Bold text marks correct options | ✅ High |

### Re-extract questions
```bash
pip install pymupdf
python extract_questions.py
cp questions.json nptelstudy/src/data/questions.json
```

## Manual Review Needed

Weeks 1-6 (60 questions) have no programmatically detectable answers.
See `review.json` for the list. To fix:
1. Open `nptelstudy/src/data/questions.json`
2. Find questions with `"needsReview": true`
3. Fill in the `correctAnswer` field (e.g., `["B"]` or `["A", "C"]`)
4. Set `"needsReview": false` and `"confidence": "high"`

## Tech Stack

- React 19 + TypeScript
- Vite 8
- React Router 7
- localStorage for persistence
- No backend required
