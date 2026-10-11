# GardenMitra 🌱
> **“Your first garden, from zero.”**

A beginner-first gardening companion crafted for the **Hacktoberfest Week 1 “Touch Grass” Challenge**.

GardenMitra guides complete newcomers from *"I know nothing about gardening"* to *"I know what I can grow, what I need to buy, how to start, and what I should do today."*

Crucially, GardenMitra is designed to encourage users to spend **less time inside the app** and **more time outside touching real soil and nurturing living plants**.

---

## 🌿 Core Philosophy: "Touch Grass"

```
PHOTO → UNDERSTAND → RECOMMEND → PREPARE → GROW → GO OUTSIDE
```

Most gardening apps either bury the user in botanical jargon or try to keep them addicted to screens. GardenMitra embraces a calm, supportive, outdoor-first mindset:
1. Provide instant clarity in under 2 minutes.
2. Deliver an actionable, bite-sized daily routine (~8 minutes).
3. **Encourage the user to close the app and step outside into the real world.**

---

## 🧐 The Problem GardenMitra Solves

When beginners attempt to start their first garden:
- **Decision Paralysis:** Overwhelmed by seed catalogs and gardening jargon (determinate vs. indeterminate, NPK ratios, soil pH).
- **The "Black Thumb" Myth:** Most beginners kill their first plant by overwatering or placing it in zero light, falsely concluding they "can't grow things."
- **Overcomplicated Tooling:** Endless commercial ads pushing expensive gadgets rather than simple seeds, soil, and pots.

GardenMitra solves this by offering an opinionated, beginner-proof onboarding path with personalized reasoning for every recommendation.

---

## 🚀 Implemented Milestones (M0 – M15)

| Milestone | Status | Description |
| :--- | :---: | :--- |
| **M0–M1: Multi-Space Foundation** | ✅ Complete | Multi-space garden modeling (Balconies, Terraces, Windowsills, Yards), setup wizard, plant matching & care cards. |
| **M2: Environmental Rules** | ✅ Complete | Rule engine for heat, rain, and wind advice, connected with daily checklist generation. |
| **M3: Smart Care & Touch Grass** | ✅ Complete | 1-inch finger soil test, care logs, watering tracker, web notifications, and sensory exit exercises. |
| **M4: On-Device Vision AI** | ✅ Complete | Local Ollama/Gemma vision adapter with zero fake computer vision detections and honest availability status. |
| **M5: Sunlight Intelligence** | ✅ Complete | Local solar elevation & azimuth calculations, seasonal daylight curves, and morning/afternoon exposure zones. |
| **M6: Space & Layout Planner** | ✅ Complete | Interactive space layout grid, container placement, walkway clearance checking, and companion zoning. |
| **M7: Automatic Location & Real Weather** | ✅ Complete | Browser Geolocation API integration, Open-Meteo live forecast API, 30-min cache, honest stale/unavailable states, and shelter-aware idempotent weather tasks. |
| **M8: Garden Capture Intelligence** | ✅ Complete | Unified multi-media capture studio, direct camera & video recording, keyframe extraction, IndexedDB binary storage, space guidance checklists, and multi-image vision analysis. |
| **M9: Space Scanning & Usable Space** | ✅ Complete | Multi-angle scan guidance, tile calibration with manual overrides, protected 2ft walking corridors, and usable area calculations. |
| **M10: Digital Twin & Layout Proposals** | ✅ Complete | Persistent 2D twin with visual uncertainty representation, 4 deterministic layout algorithms, and offline canvas visualizer. |
| **M11: Plant Knowledge Expansion** | ✅ Complete | 104 curated Indian home garden plants, structured provenance metadata (ICAR/TNAU/POWO), multi-field search (Devanagari/scientific/regional), and explainable recommendation intelligence. |
| **M12: Garden Memory & Growth Tracking** | ✅ Complete | Stable plant instance identity, lifecycle stage tracking, chronological growth journal, photo comparisons with honest perspective disclaimers, height measurement log, and gentle garden insights. |
| **M13: Physical Garden Intelligence** | ✅ Complete | Physical sensor & manual measurement ingestion (temp, humidity, soil moisture, light, rainfall), physical boundary validation, deduplication, trend analytics, and plant-specific requirement comparisons. |
| **M14: Adaptive Care Planner & Actions** | ✅ Complete | Deterministic care recommendation engine, persistent task lifecycle (due, complete, snooze, dismiss), zero-duplicate task synchronization, and automatic journal integration. |
| **M15: Advanced Plant Health Intelligence** | ✅ Complete | Contextual plant doctor synthesizing plant identity, lifecycle stage, symptoms, physical M13 measurements, and botanical provenance into ranked causes with evidence attribution, zero manufactured certainty, safe reversible care tasks, 48-72h recovery follow-up, and journal sync. |
| **M16: Weather-Aware Garden Intelligence** | ✅ Complete | Multi-variable weather intelligence (Open-Meteo live/cached/stale/unavailable), severe weather warnings (frost, storm, heatwave), shelter & exposure awareness (exposed vs sheltered vs indoor), telemetry freshness checks (>24h stale prompts physical check), plant-specific temperature limits, forecast rain postponement without false completion, and deduplicated notification reminders. |
| **M17: Garden Performance & Analytics** | ✅ Complete | Fully deterministic garden analytics engine, real persisted history analysis, plant inventory & lifecycle milestone breakdown, dated height growth rate calculations (cm/day) with data limitation transparency, care completion analytics with explicit mathematical denominators (strictly excluding dismissed tasks), health recovery tracking with 48-72h re-inspection alerts, and explainable insight feed with actionable direct-jump modals. |

---

## 🏗️ Architecture & Subsystems

```
src/
│   ├── gardenPerformanceService.ts      # M17: Fully deterministic garden analytics engine & explainable insights
│   ├── plantHealthDiagnosticEngine.ts   # M15: Contextual evidence-based plant doctor, ranked causes & safe recovery guidance
│   ├── environmentalValidation.ts       # M13: Physical boundary validation, non-finite checks & unit rules
│   ├── environmentalService.ts          # M13: Hardware device registry, observation ingestion, trends & botanical insights
│   ├── adaptiveCareEngine.ts            # M14/M16: Weather-aware deterministic care recommendations & task lifecycle
│   ├── localPlantKnowledgeProvider.ts   # M11: 104-plant catalog, multi-field search & explainable recommendation engine
│   ├── growthTrackingEngine.ts          # M12: Lifecycle stage tracking, height analytics & qualitative comparison
│   ├── gardenMemoryEngine.ts            # M12: Plant instance normalization, journal entries & gentle insights
│   ├── browserLocationProvider.ts       # M7: User-initiated Geolocation API & fallback
│   ├── openMeteoWeatherProvider.ts      # M7/M16: Real Open-Meteo forecast API, 30m cache & severe weather alert detection
│   ├── environmentalRuleEngine.ts       # M2/M7: Weather advice & shelter-aware tasks
│   ├── localSunPositionProvider.ts      # M5/M7: Solar calculations using geo coordinates
│   ├── localMediaStorage.ts             # M8: IndexedDB binary storage for photos/videos
│   ├── videoFrameExtractor.ts           # M8: In-browser keyframe extraction & downscaling
│   ├── captureCoverageEngine.ts        # M9: Space view angle coverage and missing view suggestions
│   ├── spaceMeasurementEngine.ts        # M9: Calibration via tiles or known dimensions
│   ├── usableSpaceEngine.ts             # M9: Protected walking corridor & usable area computation
│   ├── digitalTwinRecommendationEngine.ts # M10: 4 layout proposal strategies
│   ├── aiVisualizerService.ts           # M10: 100% offline architectural sketch visualizer
│   ├── layoutOptimizationEngine.ts      # M6: Space layout & container optimizer
│   ├── sunlightEstimationEngine.ts      # M5: Sunlight hours & profile engine
│   ├── careEngine.ts                    # M3: Smart watering & reminder engine
│   └── types.ts                         # Core Provider Interfaces
├── components/
│   ├── GardenPerformanceView.tsx        # M17: Performance dashboard, inventory, milestones, growth rates & care analytics
│   ├── CarePlannerView.tsx              # M14/M16: Weather-aware adaptive care planner, grouping, task completion & snooze
│   ├── GardenEnvironmentView.tsx        # M13: Physical measurements dashboard, observation entry, trend log & sensor registry
│   ├── GardenJournalView.tsx            # M12: Growth journal, photo comparison & height tracker
│   ├── PlantRecommendationView.tsx      # M11: Searchable plant library & explainable recommendations
│   ├── PlantDetailModal.tsx             # M11/M17: Detailed botanical card with provenance, measurements & instance stats
│   ├── DigitalTwinStudio.tsx            # M10: Interactive 2D twin & layout proposal generator
│   ├── AdaptiveScanGuidanceCard.tsx     # M9: Scan angle checklist & calibration wizard
│   ├── GardenCaptureStudio.tsx          # M8: Unified Photo / Camera / Video capture
│   └── ...
└── context/
    └── GardenContext.tsx                # Unified state, IndexedDB & LocalStorage sync (Schema v6)
```

### Architectural Highlights

- **M7 Open-Meteo Weather Integration:** Uses the official public Open-Meteo API (`https://api.open-meteo.com/v1/forecast`) with zero required API keys. Responses are cached in `localStorage` for 30 minutes to respect API rate limits. Four distinct status states are exposed: **Live** (direct network response), **Cached** (within TTL), **Stale** (network failed but cached data available), and **Unavailable** (network offline and no cache).
- **M7 Shelter-Aware Weather Tasks:** Weather advice generates additive, idempotent tasks (e.g. `weather-task-rain-<spaceId>`). Indoor rooms and sheltered balconies (`isSheltered: true`) never receive outdoor rain tasks.
- **M7 Solar Positioning:** Astronomical solar elevation and daylight calculations directly consume user coordinates from browser geolocation or manual selection.
- **M8 Privacy-Conscious Binary Media Storage:** Large video blobs and high-resolution photos are stored in browser **IndexedDB** (`gardenmitra_media_db`), preventing `localStorage` quota overflow. Lightweight JPEG thumbnails are generated for instant UI previews.
- **M8 Video Keyframe Extraction:** Runs entirely client-side using temporary HTML5 `<video>` elements and `<canvas>` downscaling to 960px. Supports user cancellation via `AbortSignal`, progress tracking, and cleans up object URLs to prevent memory leaks.
- **M8 Multi-View Multimodal Vision AI:** Analyzes collections of space photos and extracted video keyframes via local Ollama (`gemma3:latest`). Observations explicitly require user confirmation for structural safety and load limits. Never claims 3D millimeter precision or fabricated confidence.
- **M9 Adaptive Space Scanning & Usable Space:** Evaluates documented angles per space type (`balcony`, `terrace`, `backyard`, `windowsill`), prioritizes missing views, calibrates physical dimensions using tile references or user measurements without assuming standard tile sizes, preserves a protected 2ft walking corridor, and stores user-confirmed observations distinctly from AI estimations.
- **M10 Garden Digital Twin & AI Visualizer:** Maintains an editable, persistent digital representation of each real garden space with visual uncertainty rendering (solid = measured, dashed = estimated, hatched = clear walkways). Provides 4 deterministic layout proposal modes (`beginner_friendly`, `space_efficient`, `max_edibles`, `low_maintenance`), before-and-after visual comparisons without state mutation before user acceptance, and 100% offline conceptual architectural rendering with explicit illustrative disclaimers.
- **M11 Plant Knowledge Base & Recommendation Intelligence:** 104 curated plant profiles tailored to Indian balconies, terraces, and home gardens. Comprehensive multi-field search across English, Hindi (Latin + Devanagari), botanical scientific names, and regional dialects (Tamil, Telugu, Bengali, Kannada, Marathi). Deterministic explainable recommendation engine breaking matches into positive reasons, potential conflicts, missing information, and next practical actions. Strict data provenance metadata attributing ICAR, TNAU, and Kew POWO.
- **M12 Garden Memory & Growth Tracking:** Stable plant instance identity allowing multiple pots of the same species. Chronological plant journal recording user notes, watering events, flowering, and harvests. Side-by-side growth photo comparison with explicit perspective disclaimers. Quantitative height logging with daily growth rate analysis. Gentle non-guilt garden insights engine. Full offline persistence with schema version 5/6 idempotent migration.
- **M13 Physical Garden Intelligence & Sensor Integration:** Strongly typed physical observation model covering temperature, relative humidity, soil moisture, ambient light (lux/ppfd), and rainfall. Rigorous physical boundary validation rejecting non-finite and impossible values. Duplicate reading suppression within 30-second windows. Hardware sensor device registration registry. Stale-data detection (> 24h) and plant-specific requirement comparisons (heat stress alerts, chilling warnings, moisture saturation vs deficit).
- **M14 Adaptive Garden Care Planner & Action Engine:** Deterministic, explainable care recommendation engine synthesizing plant lifecycle stages, historical care logs, recent valid sensor measurements, and seasonal calendars. Automatic conversion into persistent, deduplicated `AdaptiveCareTask` items. End-to-end task completion logging authentic user actions into the persistent growth journal, with snooze (+24h) and dismissal capabilities. Fully advisory architecture with zero automated pump/hardware actuation.
- **M15 Advanced Plant Health Intelligence:** Contextual, evidence-based diagnostic engine. Synthesizes plant species identity from M11's 104-plant catalog, lifecycle stage, structured symptoms (progression, distribution, affected plant parts), historical care logs, M13 sensor telemetry, and ICAR/TNAU botanical baselines. Highlights stale environmental readings (> 24h) honestly without fake confirmation. Generates ranked possible causes with supporting and conflicting evidence pills, missing information lists, safe reversible treatment steps, and urgent escalation triggers. Seamlessly converts actionable steps into deduplicated M14 Care Tasks and tracks 48–72h recovery follow-ups synced to the M12 Garden Journal.

---

## 🔒 Privacy & Safety Principles

1. **Zero Fake AI:** GardenMitra never fabricates confidence percentages, fake sunlight calculations, or fake disease diagnoses. If a real vision model is not connected, it honestly says so.
2. **Local-First Data:** Photos and profile choices remain strictly on your device in your browser.
3. **No Accounts Required:** Instant usage from the first click—no signups, passwords, or telemetry.

---

## 🛠️ Tech Stack

- **Framework:** React 18 with TypeScript
- **Bundler & Dev Server:** Vite 5
- **Styling:** Vanilla CSS with custom nature-inspired design tokens (Moss Greens, Terracotta Clay, Warm Sand)
- **Icons:** Lucide React
- **Testing:** Vitest (183 automated unit and integration tests covering M0–M15 across 20 test suites)

---

## 💻 Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ or v22+
- Git

### Installation & Startup

```bash
# Clone the repository
git clone https://github.com/your-username/gardenmitra.git
cd gardenmitra

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Run Tests & Verification

```bash
# Run automated Vitest test suite
npm run test

# Run TypeScript type check and production build
npm run build
```

---

## 📂 Project Structure

```
gardenmitra/
├── .gitignore
├── LICENSE                  # MIT License
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── index.html
├── src/
│   ├── __tests__/           # Vitest unit and integration test suites
│   │   ├── assistantProvider.test.ts
│   │   ├── plantRecommendation.test.ts
│   │   ├── shoppingList.test.ts
│   │   ├── taskGenerator.test.ts
│   │   └── visionAndDoctor.test.ts
│   ├── components/          # Polished UI components
│   │   ├── ChatbotView.tsx
│   │   ├── Footer.tsx
│   │   ├── GardenDoctorView.tsx
│   │   ├── GardenSetupWizard.tsx
│   │   ├── Header.tsx
│   │   ├── MyGardenDashboard.tsx
│   │   ├── PhotoUploader.tsx
│   │   ├── PlantDetailModal.tsx
│   │   ├── PlantRecommendationView.tsx
│   │   ├── ShoppingListView.tsx
│   │   ├── TodaysGardenView.tsx
│   │   ├── TouchGrassModal.tsx
│   │   └── WelcomeScreen.tsx
│   ├── context/
│   │   └── GardenContext.tsx # Central React State & LocalStorage persistence
│   ├── data/
│   │   └── plants.ts        # Curated beginner-friendly plant dataset
│   ├── services/            # Modular provider abstractions & MVP implementations
│   │   ├── localAssistantProvider.ts
│   │   ├── localPlantKnowledgeProvider.ts
│   │   ├── localShoppingProvider.ts
│   │   ├── localTaskGenerator.ts
│   │   ├── localVisionProvider.ts
│   │   └── types.ts
│   ├── types/
│   │   └── index.ts         # Shared TypeScript interfaces & models
│   ├── App.tsx
│   ├── index.css            # Responsive botanical design system
│   └── main.tsx
```

---

## 🤝 Contributing

Contributions are warmly welcomed for Hacktoberfest!
1. Fork the repo and create your branch: `git checkout -b feature/my-new-feature`
2. Add tests for your logic under `src/__tests__/`
3. Verify that `npm run test` and `npm run build` pass
4. Commit your changes: `git commit -m 'feat: add local seasonal sowing guide'`
5. Push to the branch and open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

<div align="center">

<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  <h1>Built with AI Studio</h2>

  <p>The fastest path from prompt to production with Gemini.</p>

  <a href="https://aistudio.google.com/apps">Start building</a>

</div>

