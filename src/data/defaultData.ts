import { ProfileData, ProjectData, SkillCategory } from '../types/portfolio';

export const DEFAULT_SKILLS: SkillCategory[] = [
  {
    id: 'skill-cfd',
    category: 'CFD & Aerodynamics',
    items: [
      'ANSYS Fluent',
      'Ansys SpaceClaim',
      'Ansys Meshing',
      'XFLR5',
      'SST k-omega / k-epsilon / LES',
      'Polyhedral & Boundary Layer Meshing',
    ],
  },
  {
    id: 'skill-cad',
    category: 'CAD & Structural FEA',
    items: [
      'Fusion 360',
      'Structural FEA',
      '3D Assembly & Surfacing',
      'Composite Layup & Fabrication',
      'Onshape',
    ],
  },
  {
    id: 'skill-prog',
    category: 'Programming & AI Automation',
    items: [
      'Python',
      'FastAPI',
      'Whisper Speech-to-Text',
      'LLM APIs',
      'Engineering Workflow Automation',
    ],
  },
  {
    id: 'skill-lang',
    category: 'Languages',
    items: ['Polish (Native)', 'English (Professional Technical)'],
  },
];

export const MARGARET_CONTENT_REVISION = 2;

export const MARGARET_PROJECT: ProjectData = {
  id: 'ai-secretary',
  title: 'Margaret — Personal AI Companion',
  subtitle:
    'Prototype v0.1.0 (Beta) · AI companion with dual JSON/Supabase persistence, 768D RAG, fail-closed citation audit & progress analytics',
  category: 'Artificial Intelligence & Software',
  year: '2026',
  isTeamProject: false,
  statusLabel: 'Prototype v0.1.0 (Beta) · No External User Testing Conducted',
  buildOrigin: 'Built via AI-Assisted Vibe Coding · Concept, Architecture, Scenarios & Verification by Author',
  languages: ['TypeScript (strict)', 'TSX', 'SQL', 'JavaScript/CJS', 'CSS'],
  contentRevision: MARGARET_CONTENT_REVISION,
  myRole: 'Product Concept, System Architecture, User Scenarios & Verification (AI-Assisted Vibe Coding)',
  myTools: [
    'Next.js 16.3.2',
    'React 19.2.6',
    'TypeScript',
    'Zustand 5.0',
    'Zod 3.25',
    'Supabase JS',
    'Gemini SDK',
    'Electron 39.8',
    'Vitest 4.1',
  ],
  scopeCards: [
    {
      id: 'scope-margaret-role',
      title: 'Product Role, Functional Modules & Synthetic Demo',
      badge: 'Beta & Vibe Coding',
      description:
        '- **Vibe-Coded Ownership:** Personally directed the product concept, system architecture, user scenarios, and verification criteria while iterating on implementation code with AI assistance.\n- **Implemented Views:** Daily Today ("Dziś") overview, Chat (including conversational 7-day planning directly in chat/demo seed rather than a separate plan-generator module), Charts & Heatmap, Trends (Pearson correlation across >= 3 shared days), Neuron Memory Map, Habits/Quests, Rituals, and Boundaries (budget 10, max 8 per area).\n- **Voice & Calendar Gateways:** Gemini Live WebSocket voice (16 kHz PCM capture plus simulated UI demo mode) and Google Calendar OAuth (AES-256-GCM encrypted refresh tokens with collision preview before approval), both gated by external credentials.\n- **Electron Desktop Shell:** Electron 39.8.10 spawns and health-checks a local Next.js server over loopback HTTP with minimal preload exposure (platform, isDesktop).',
    },
    {
      id: 'scope-margaret-persistence',
      title: 'Data Persistence, JSON Fallback & SHA-256 Outbox',
      badge: 'Storage & Sync',
      description:
        '- **Supabase Schema:** 14 SQL migrations (000–013) define tables (chat_messages, daily_metrics, books, book_chunks, neurons, memories, reward_events, google_tokens) and vector RPCs, accessed via service-role server client with RLS enabled.\n- **JSON & In-Memory Fallback (No SQLite):** When unconfigured, metrics, chat, neurons, outbox, and calendar proposals persist to local JSON files via temp-file + atomic rename (despite legacy sqlite.ts file naming, better-sqlite3 is not used). RAG, rewards, and quests fall back to process memory; rituals and goals require Supabase.\n- **SHA-256 Idempotent Outbox:** Queues memory extraction tasks in pending-memory.json using SHA-256 over [userId, session, message/sourceId], rejects mismatched ID reuse, processes up to 10 tasks per resume pass, and re-reads the queue before writing (single-process concurrency safe).\n- **Path-Specific Recovery:** Chat recording explicitly returns local, supabase, or recovery mode when configured Supabase fails; metrics APIs return an API error on configured DB failure rather than silently writing JSON.',
    },
    {
      id: 'scope-margaret-algorithms',
      title: 'Scoring Logic, Forecasting, Point Decay & Streaks',
      badge: 'Algorithms',
      description:
        '- **Category Averaging:** Today View averages the newest rating independently per each of the 6 categories (sum / available count, across potentially different dates); Overall Chart averages logged rows per day (null on empty days, never zero-filled). A weighted composite helper exists separately for learning subdomains.\n- **Multi-Tier Forecasting:** Queries Hugging Face amazon/chronos-t5-small (>= 3 points, 25s timeout) when configured, falling back locally to EWMA with trend (alpha = 0.3, beta = 0.15, >= 2 points) and linear regression across a 60-day lookback (1–30 day horizon, clamped 1.00–5.00).\n- **Reward-Only Exponential Decay:** Applies time decay basePoints * exp(-age_days / 30) (default 10 base points, lambda = 1/30) strictly to gamified reward points, never altering raw wellbeing ratings.\n- **Grace-Day Streaks:** Scans unique active dates over 365 days with a default 2-day grace budget; missing today preserves grace, while consecutive missed days consume grace without incrementing streak count.',
    },
    {
      id: 'scope-margaret-ai',
      title: 'AI Streaming, Rate Limits, 768D RAG & Citation Audit',
      badge: 'AI & RAG',
      description:
        '- **NDJSON Stream & Context Budgets:** Streams line-delimited meta, delta, timing, done, aborted, and error events. Zod validates chat requests (8,000 msg chars, 40 history items); context builders trim history (12 msgs / 12,000 chars) and cap prompt character budgets (books 6,000, neurons 2,400, memory 1,200).\n- **Model Fallback & Throttling:** Attempts gemini-3.5-flash (up to 2 tries) then gemini-3.1-flash-lite (1 try) with jittered backoff (400ms–2s) and 30s/90s timeouts, guarded by a process-local token bucket (30/min chat, 10/min embeddings, 5/min summaries) and per-(keyHash, model) cooldowns.\n- **PDF/TXT Vector RAG:** Extracts digital text up to 12 MiB via unpdf (no OCR), segments ~512-token chunks (64-token overlap at 3.4 chars/token), creates 768D embeddings (gemini-embedding-001, batches of 25), and retrieves top-3 chat matches above 0.55 cosine similarity (500-chunk fallback cap).\n- **Fail-Closed Citation Audit:** Searches Europe PMC & OpenAlex (up to 3 queries, 6 sources max, 30-min cache), then runs a second-pass Zod-validated Gemini audit verifying excerpts against provider abstracts—stripping ungrounded paragraphs and model-invented links before display.',
    },
    {
      id: 'scope-margaret-limits',
      title: 'Known Prototype v0.1.0 Limitations & Audit Boundaries',
      badge: 'Honest Scope',
      description:
        '- **Zero External Testing & Mocked Suite:** Prototype 0.1.0 has not been tested by external users; its 65 Vitest test files primarily use mocks/stubs with external DB/AI env vars stripped, and no Playwright E2E browser tests exist yet.\n- **Auth & RLS Policy Gaps:** Multi-user login and SQL CREATE POLICY definitions are not implemented yet; requests resolve identity via x-user-id headers or a default local ID.\n- **Unfinished & Inconsistent UI Areas:** The Wnioski (Insights) tab is a placeholder; scanned PDFs lack OCR; the chart UI displays an outdated "TimesFM" label despite using Chronos/EWMA/regression; and fail-closed citation verification can abort responses if the second-pass audit times out or returns malformed JSON.\n- **Synthetic Demo Disclosure:** All showcased chats, wellbeing ratings, and weekly charts come from pre-seeded synthetic portfolio data (12–18 November 2026), not live sessions or clinical evidence.',
    },
  ],
  description:
    'Margaret is a personal AI companion prototype (v0.1.0 Beta) exploring how conversational AI can retain structured topic memory, track six self-reported wellbeing categories, retrieve uploaded PDF/TXT knowledge via vector RAG, and audit scientific claims against external literature.\n\nI directed the product concept, system architecture, user scenarios, and verification boundaries, building and iterating on the application through AI-assisted vibe coding. Because no external user testing has been conducted yet, this portfolio entry documents the actual verified mechanics from the codebase alongside its open prototype limitations.',
  links: [
    {
      label: 'Product Portfolio Overview (PDF)',
      url: './assets/aistudio/Margaret_portfolio_8b11e208.pdf',
      isPrimary: true,
    },
    {
      label: 'Technical Architecture Monograph — 50 pp. (PDF)',
      url: './assets/aistudio/Margaret_wyklad_informatyka_9af033a2.pdf',
    },
  ],
  keySpecs: [
    { label: 'Languages', value: 'TypeScript (strict), TSX, SQL, JS/CJS, CSS' },
    { label: 'Web & State Stack', value: 'Next.js 16.3.2, React 19.2.6, Zustand 5.0, Zod 3.25' },
    { label: 'Data & Fallback', value: 'Supabase (14 SQL Migrations) + JSON / Memory' },
    { label: 'AI & Retrieval', value: 'Gemini SDK 0.24.1, 768D RAG, Europe PMC & OpenAlex' },
    { label: 'Desktop & Tests', value: 'Electron 39.8.10, Vitest 4.1.6 (65 Mocked Files)' },
    { label: 'Validation Scope', value: 'Prototype v0.1.0 (Beta) · No External Testing' },
  ],
  keyMetrics: [],
  ndaNote:
    'Demo & Prototype Disclosure: Prototype v0.1.0 (Beta) — no external user testing conducted. Screenshots display a pre-seeded synthetic demonstration week from 12–18 November 2026 (generated for portfolio demonstration, not a live Gemini session, private user history, or clinical evaluation).',
  media: [
    {
      id: 'm-margaret-01',
      title: '01 — Daily Overview ("Dziś")',
      type: 'photo',
      caption:
        'Synthetic demo (12–18 Nov 2026): brings daily habits, active quests, current priorities, and average wellbeing ratings across six categories into one dashboard.',
      previewUrl: './assets/aistudio/01-daily-overview_7b67ad13.png',
    },
    {
      id: 'm-margaret-02',
      title: '02 & 03 — Job-Search Conversation & Conversational 7-Day Plan',
      type: 'photo',
      caption:
        'Pre-seeded synthetic job-search scenario (12–18 Nov 2026): Margaret clarifies target role, time budget, and existing materials before outlining a seven-day plan directly inside the conversational chat flow.',
      previewUrl: './assets/aistudio/02-job-search-conversation_3d10a141.png',
    },
    {
      id: 'm-margaret-04',
      title: '04 — Weekly Progress Chart',
      type: 'chart',
      caption:
        'Synthetic portfolio data (12–18 Nov 2026): visualizes daily mean ratings across six tracked categories (1–5 scale, missing days omitted as null). Not evidence of product effectiveness or clinical assessment.',
      previewUrl: './assets/aistudio/04-weekly-progress-chart_f2023359.png',
    },
    {
      id: 'm-margaret-05',
      title: '05 — Conversational Memory Map',
      type: 'chart',
      caption:
        'Memory notes extracted via the SHA-256 deduplicated outbox are grouped by topic and linked visually with inspectable summaries, tags, and source message references.',
      previewUrl: './assets/aistudio/05-memory-map_0a3dcd93.png',
    },
  ],
  customNotes: '',
};

export function isMargaretPlaceholder(proj: ProjectData): boolean {
  if (proj.id !== 'ai-secretary') return false;
  const hasAnyImage = (proj.media || []).some((m) => Boolean(m.previewUrl && m.previewUrl.trim().length > 0));
  const hasDescription = Boolean(proj.description && proj.description.trim().length > 0);
  const hasScopes = Boolean(proj.scopeCards && proj.scopeCards.length > 0);
  return !hasAnyImage && !hasDescription && !hasScopes;
}

export function needsMargaretUpgrade(proj: ProjectData): boolean {
  if (proj.id !== 'ai-secretary') return false;
  if (isMargaretPlaceholder(proj)) return true;
  return (proj.contentRevision ?? 0) < MARGARET_CONTENT_REVISION;
}

export const INITIAL_PORTFOLIO_DATA: ProfileData = {
  name: "Hubert Łokieć",
  title: "Aerospace & Mechanical Engineer | CFD, CAD & Python Automation",
  bio: "",
  avatarUrl: "",
  links: {
    linkedin: "",
    github: "",
    onshape: "",
    youtube: "",
    email: "",
    cvUrl: "",
  },
  experiences: [
    {
      id: "exp-1",
      role: "Design Engineer / Intern",
      organization: "Company Name",
      period: "09.2024 – Present",
      description: "",
    },
    {
      id: "exp-2",
      role: "R&D / Engineering Assistant",
      organization: "Organization / University Lab",
      period: "06.2023 – 08.2024",
      description: "",
    },
  ],
  education: [
    {
      id: "edu-1",
      degree: "Master of Science (M.Sc.)",
      institution: "Poznań University of Technology",
      period: "2023 – 2025",
      details: "Thesis: 4-Person VTOL UAV Aircraft Design Project (Aerodynamic & CFD Analysis)",
    },
    {
      id: "edu-2",
      degree: "Bachelor of Science (B.Sc.)",
      institution: "Poznań University of Technology",
      period: "2021 – 2025",
      details: "Thesis: Simulation Analysis of the Impact of Pre-Chamber Geometry in a Turbulent Jet Ignition System on Combustion Parameters",
    },
  ],
  skills: DEFAULT_SKILLS,
  projects: [
    {
      id: "aircraft-msc",
      title: "Aircraft Design & Simulation [M.Sc. Project]",
      subtitle: "Full-scale aircraft development with aerodynamic analysis and CAD",
      category: "Aerospace & Simulations",
      year: "2025",
      isTeamProject: true,
      teamSize: 4,
      teamDescription: "Master's degree capstone project completed collaboratively in a 4-person engineering team.",
      myRole: "My Individual Scope: Aerodynamic analysis & polar curves in XFLR5, fluid dynamics & structural simulations in ANSYS, and selected CAD sub-assembly modeling in Fusion 360.",
      myTools: ["XFLR5", "ANSYS Fluent", "Fusion 360", "Structural FEA"],
      scopeCards: [
        {
          id: "scope-xflr5",
          title: "XFLR5 Aerodynamics",
          badge: "My Scope",
          description: "- **2D & 3D Panel Method Analysis:** Airfoil polar curve envelopes, zero-lift pitching moments, lift-to-drag optimization, and longitudinal static margin stability calculations.",
        },
        {
          id: "scope-ansys",
          title: "ANSYS CFD & Structural Analysis",
          badge: "My Scope",
          description: "- **Geometry Preparation & Domain Extraction:** Cleaned and optimized VTOL UAV half-model CAD geometry in Ansys SpaceClaim for fluid domain extraction.\n- **Multi-Domain Volume Meshing:** Generated a 5.65M-cell polyhedral mesh in Ansys Meshing with cylindrical rotor zones for transition angle studies.\n- **CFD Simulation Execution:** Configured the SST k-omega model in Ansys Fluent across 9 flight configurations (0°, 45°, 90° tilt at 11 m/s).\n- **Post-Processing & Load Evaluation:** Extracted lift, drag, pitching moments, and pressure-center shifts to evaluate structural flight loads.",
        },
      ],
      description: "",
      links: [
        { label: "Project Summary (PDF)", url: "" },
      ],
      keySpecs: [
        { label: "Collaboration", value: "4-Person Team" },
        { label: "Personal Scope", value: "XFLR5, ANSYS, CAD" },
        { label: "Analysis Tools", value: "XFLR5 & ANSYS" },
        { label: "Modeling", value: "Fusion 360" },
      ],
      keyMetrics: [],
      ndaNote: "Academic capstone project — selected proprietary geometry and load parameters generalized.",
      media: [
        {
          id: "m-plane-cad",
          title: "Aircraft Assembly Photo",
          type: "photo",
          caption: "Complete aircraft assembly and fabricated components.",
        },
        {
          id: "m-plane-xflr5",
          title: "XFLR5 Aerodynamic Polar Curves",
          type: "chart",
          caption: "Lift-to-drag ratios, pitching moment curves, and boundary layer analysis from XFLR5.",
        },
        {
          id: "m-plane-ansys",
          title: "ANSYS CFD Pressure & Flow Contours",
          type: "simulation",
          caption: "ANSYS 3D volume mesh and transonic/subsonic surface pressure distribution.",
        },
      ],
      customNotes: "",
    },
    MARGARET_PROJECT,
    {
      id: "tji-simulation-bsc",
      title: "Turbulent Jet Ignition (TJI) Simulation [B.Sc. Thesis]",
      subtitle: "CFD investigation of pre-chamber intake orifices and flame propagation",
      category: "Combustion & Fluid Dynamics",
      year: "2023",
      isTeamProject: false,
      myRole: "Individual Bachelor's Degree Research",
      myTools: ["ANSYS Fluent", "CFD Polyhedral Meshing", "Turbulence Modeling (k-epsilon / LES)", "Combustion Kinetics"],
      description: "",
      links: [
        { label: "Thesis Report Summary", url: "", isPrimary: true },
      ],
      keySpecs: [
        { label: "Scope", value: "B.Sc. Engineering Thesis" },
        { label: "Subject", value: "Turbulent Jet Ignition" },
        { label: "CFD Solver", value: "ANSYS Fluent" },
        { label: "Investigation", value: "Intake orifice diameter & angle" },
      ],
      keyMetrics: [],
      ndaNote: "Academic research thesis — selected experimental calibration parameters generalized.",
      media: [
        {
          id: "m-tji-mesh",
          title: "Pre-chamber Orifice CFD Mesh",
          type: "simulation",
          caption: "Refined boundary layer mesh around the pre-chamber nozzle orifices.",
        },
        {
          id: "m-tji-velocity",
          title: "Turbulent Velocity Jet Vectors",
          type: "simulation",
          caption: "Velocity magnitude contours showing high-speed turbulent reactive jet penetration into the main chamber.",
        },
      ],
      customNotes: "",
    },
  ],
};
