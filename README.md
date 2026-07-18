# CampusFlow

A lightweight, AI-assisted course planning tool for university students. Built as an open-source portfolio project with **fictional sample data** — it is not connected to any real university system.

## Features

- **Dashboard** — total completed AU, degree completion percentage, per-category requirement progress, and live plan warnings.
- **Course Explorer** — search by code or name; filter by category, semester, and career interest; view schedules, prerequisites, and descriptions for 27 fictional courses.
- **Completed Courses** — mark courses as completed; degree progress updates automatically.
- **Semester Planner** — plan four future semesters (Year 2–3), add/remove/move courses, and see per-semester AU totals.
- **Rule Validation** — a deterministic rule engine checks prerequisites, semester availability, the 21 AU semester limit, timetable conflicts, and duplicates. Warnings appear directly beside invalid courses.
- **Recommendations** — transparent rule-based scoring (+3 career match, +2 incomplete requirement, +1 offered next semester, −5 missing prerequisite) ranks the top five courses with reasons.
- **AI Assistant** — explains rule-engine results and answers planning questions. The LLM only receives structured data computed by the application; it never calculates prerequisites, conflicts, or AU totals. Without an API key the assistant runs in a fully offline mock mode.

All user data is stored in browser `localStorage` — no accounts, no server-side state.

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript
- Tailwind CSS
- Vitest for unit tests
- Anthropic Messages API (optional, for the assistant)

All planning logic lives in plain TypeScript modules (`lib/`), fully separated from UI components — the "Simpler Option" backend from the project spec (Next.js only, no separate Python service).

## Getting Started

```bash
npm install
npm run dev        # http://localhost:3000
```

### Optional: enable the real AI assistant

```bash
cp .env.example .env
# then set ANTHROPIC_API_KEY in .env
```

Without a key, the assistant answers with deterministic mock responses built from the same rule-engine data, so the whole app works offline.

### Run tests

```bash
npm test
```

### Production build

```bash
npm run build && npm start
```

## Project Structure

```
campusflow/
├── app/                  # Next.js pages + the assistant API route
│   ├── page.tsx          # Dashboard
│   ├── explorer/         # Course Explorer
│   ├── completed/        # Completed-course tracker
│   ├── planner/          # Semester planner
│   ├── recommendations/  # Rule-based recommendations
│   ├── assistant/        # AI assistant chat panel
│   └── api/assistant/    # LLM proxy with mock fallback
├── components/           # UI components + localStorage-backed state
├── lib/
│   ├── catalog.ts        # Course catalogue and programme constants
│   ├── rules.ts          # Deterministic rule engine (no LLM)
│   ├── progress.ts       # Degree progress calculation
│   ├── recommendations.ts# Rule-based recommendation scoring
│   └── assistant.ts      # Structured context builder for the LLM
├── data/
│   ├── courses.json      # 27 fictional courses
│   └── degree_requirements.json
├── tests/                # Vitest unit tests for all rules
└── docs/screenshots/
```

## Sample Data

`data/courses.json` contains 27 fictional courses across five categories (Core, Major Elective, General Elective, Mathematics, Laboratory), each with AU, prerequisites, offered semesters, career tags, and a weekly class schedule. `data/degree_requirements.json` defines a fictional **Bachelor of Engineering in Computer Engineering** requiring 72 AU:

| Category | Required AU |
|---|---|
| Core | 30 |
| Major Electives | 15 |
| General Electives | 9 |
| Mathematics | 12 |
| Laboratory | 6 |

The catalogue includes deliberate edge cases, e.g. CS2101 and EE3201 both meet Monday 10:00–12:00 (timetable conflict), and CS3202 is only offered in Semester 2 (availability check).

## Assumptions

- The 72 AU total is intentionally smaller than a real degree so the sample catalogue can actually satisfy every requirement.
- AU earned beyond a category's requirement is capped and does not count toward the overall total.
- "Next semester" for recommendation scoring defaults to Semester 1 (the first planner semester).
- Prerequisites must be completed in a *strictly earlier* semester; taking a prerequisite concurrently is not allowed.
- Back-to-back classes (10:00–12:00 and 12:00–14:00) do not conflict.

## Deployment

The app is a standard Next.js project and deploys to [Vercel](https://vercel.com/) with zero configuration: import the repo, optionally set `ANTHROPIC_API_KEY`, and deploy.

## Roadmap

- [ ] Drag-and-drop planner
- [ ] Multiple degree programmes
- [ ] Exportable/shareable plans
- [ ] GPA what-if scenarios
- [ ] Streaming AI responses

## License

MIT — see [LICENSE](./LICENSE).
