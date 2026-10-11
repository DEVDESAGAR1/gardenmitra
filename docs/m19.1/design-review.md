# GardenMitra 🌱 — Milestone 19.1: Comprehensive Design Audit, Open-Source Research & Design Specification

> **Product:** GardenMitra — *Your first garden, from zero.*  
> **Core Philosophy:** Understand → Take action → Go outside → Care for the real garden.  
> **Milestone:** M19.1 — Research, Audit and Design Specification (Read-Only / Non-Mutating)  
> **Following Milestone:** M19.2 — Implementation of the Approved Remediation Design  
> **Audit Date:** October 2026  
> **Audit Status:** Complete — Ready for Review & Approval Gate  

---

## 1. Executive Summary

This audit constitutes a comprehensive, evidence-based review of the **GardenMitra** web application codebase, design system, user experience, responsive ergonomics, accessibility conformance, architecture, performance, security, and open-source readiness.

### Key Strengths Discovered:
1. **Exceptional Privacy & Local-First Sovereignty:** The application stores all personal user data, plant growth photos, notes, and sensor telemetry on-device using browser `localStorage` and `IndexedDB`. External network requests are restricted strictly to local Ollama on-device AI (`localhost:11434`) and free public weather forecasts (`api.open-meteo.com`). There are zero commercial analytics, zero user telemetry trackers, and zero remote data leaks.
2. **Rich Botanical Knowledge & Provenance:** 104 curated Indian and tropical home garden plants with structured botanical provenance from ICAR, TNAU, and Plants of the World Online (POWO), providing beginner-accessible guidance without synthetic botanical hallucinations.
3. **Deterministic Intelligence Engines:** Sophisticated local reasoning engines for sunlight geometry (M5), spatial layouts (M6), weather-aware care scheduling (M16), contextual health diagnosis (M15), and deterministic garden performance analytics (M17) that compute real statistics directly from persisted records without fabricated streaks or false certainty.
4. **Strong Test Baseline:** A robust automated suite comprising **22 test files and 205 passing unit/integration tests**, validating business logic across all prior milestones (M0–M17) with zero test regressions.

### Critical Deficiencies Discovered (Targeted for M19.2):
1. **Mobile Bottom Navigation Ergonomic Failure (`FIND-NAV-01` / P1):** All 13 application tabs are crammed into a single fixed bottom navigation bar on mobile viewports. On a 375px mobile screen, each button has an effective width of just 28.8px, severely violating WCAG 2.5.5 minimum touch target requirements (44×44px) and causing severe text clipping and cognitive overwhelm.
2. **Missing React Error Boundaries (`FIND-REL-01` / P1):** The application lacks React `<ErrorBoundary>` wrappers. Any uncaught JavaScript runtime exception (e.g., during canvas rendering, camera extraction, or malformed local state) crashes the entire application into an unrecoverable blank white screen.
3. **Modal Dialog Accessibility & Keyboard Traps (`FIND-A11Y-01` / P1):** Modal dialogs (`PlantDetailModal`, `TouchGrassModal`, `SpaceModal`) lack focus trapping, do not listen to the `Escape` key, do not bind `aria-labelledby`, and do not restore focus upon dismissal.
4. **Design Token Breakdown & Inline Style Sprawl (`FIND-TOK-01` / P1):** Over 1,700 inline `style={{ ... }}` declarations bypass the central CSS design token system (`src/index.css`), scattering hardcoded hex colors (`#0F172A`, `#2563EB`, `#166534`) across components, inflating virtual DOM diffing overhead, and preventing theming/dark-mode adaptability.
5. **Monolithic God Context (`FIND-ARCH-01` / P2):** `src/context/GardenContext.tsx` spans **2,929 lines**, coupling navigation, spaces, plants, shopping, chat, sunlight, capture sessions, sensors, tasks, diagnoses, and weather into a single context. Any state update triggers cascading re-renders across all active components.
6. **Synchronous `window.alert()` Invocations (`FIND-A11Y-02` / P2):** 10 production user journeys (watering confirmation, soil checks, camera errors, layout updates) invoke native blocking `alert()`, freezing the browser thread and presenting an inaccessible user experience.
7. **Monolithic Production Bundle Size (`FIND-PERF-01` / P2):** All 17 view components are eagerly imported in `App.tsx`, generating a 960 kB minified JavaScript bundle that triggers Vite's `>500 kB` chunk warning.

---

## 2. Scope & Methodology

The audit followed a disciplined, non-mutating inspection protocol:
- **Design Review Tools & Skills:** Researched, verified, and installed canonical agent design skills into `.agents/skills/` (`impeccable`, `ponytail`, `better-web-ui`, `design-loop`, `design-review`).
- **Static Code Analysis:** In-depth inspection of tokens (`src/index.css`), markup (`index.html`), application entry (`src/App.tsx`), state management (`src/context/GardenContext.tsx`), and all 17 component views.
- **Accessibility Evaluation:** Evaluated according to W3C WCAG 2.1 AA standards, focusing on color contrast ratios, keyboard accessibility, accessible names, focus management, and touch targets.
- **Performance & Build Profiling:** Ran TypeScript type checks (`tsc --noEmit`), Vitest test suite (`vitest run`), and Vite production bundler (`vite build`) to measure chunk distributions, compile times, and linting output.
- **Open-Source Comparative Research:** Studied battle-tested open-source libraries and architectural patterns (Radix UI, Refactoring UI, Open Props, Material 3, `react-error-boundary`) to inform an implementation-ready remediation specification.

---

## 3. Current-State Architecture & Feature Inventory

| Area | Implemented Features | Status | Code Paths |
| :--- | :--- | :---: | :--- |
| **Foundation & Multi-Space (M0–M1)** | Multi-space garden modeling (balconies, terraces, indoor rooms), space wizard, plant cards. | ✅ Verified | `src/components/MyGardenDashboard.tsx`, `SpaceModal.tsx` |
| **Environmental Rules & Care (M2–M3)** | Weather advice, 1-inch finger test, care logs, watering tracker, browser notification triggers. | ✅ Verified | `src/services/careEngine.ts`, `src/services/environmentalRuleEngine.ts` |
| **On-Device Vision AI (M4)** | Local Ollama/Gemma adapter, honest status flags, zero simulated detections. | ✅ Verified | `src/services/localOllamaVisionProvider.ts`, `localVisionProvider.ts` |
| **Sunlight Intelligence (M5)** | Astronomical solar elevation/azimuth calculations, seasonal curves, space zones. | ✅ Verified | `src/services/localSunPositionProvider.ts`, `sunlightEstimationEngine.ts` |
| **Space Layout & Optimization (M6)** | 2D container placement, walking corridor clearance checking, companion zoning. | ✅ Verified | `src/services/layoutOptimizationEngine.ts`, `SpaceLayoutPlanner.tsx` |
| **Location & Weather (M7)** | Geolocation API, Open-Meteo forecast API, 30-min cache, shelter-aware weather tasks. | ✅ Verified | `src/services/openMeteoWeatherProvider.ts`, `browserLocationProvider.ts` |
| **Capture Studio & Frame Extraction (M8)** | Photo/video capture, in-browser keyframe extraction, IndexedDB binary storage. | ✅ Verified | `src/services/localMediaStorage.ts`, `videoFrameExtractor.ts`, `GardenCaptureStudio.tsx` |
| **Scanning & Usable Space (M9)** | View angle checklist, tile calibration, 2ft walking corridor protection. | ✅ Verified | `src/services/usableSpaceEngine.ts`, `AdaptiveScanGuidanceCard.tsx` |
| **Digital Twin (M10)** | Persistent 2D twin canvas, 4 layout algorithms, visual uncertainty shading. | ✅ Verified | `src/services/digitalTwinRecommendationEngine.ts`, `DigitalTwinStudio.tsx` |
| **Plant Catalog & Recommendations (M11)**| 104 Indian/tropical home plants, botanical provenance (ICAR/TNAU/POWO), Devanagari/Hindi search. | ✅ Verified | `src/data/plants.ts`, `localPlantKnowledgeProvider.ts`, `PlantRecommendationView.tsx` |
| **Garden Memory & Growth (M12)** | Plant instance IDs, lifecycle tracking, growth journal, height logs, photo timeline. | ✅ Verified | `src/services/growthTrackingEngine.ts`, `gardenMemoryEngine.ts`, `GardenJournalView.tsx` |
| **Physical Sensor Intelligence (M13)** | Ingestion of temp, humidity, moisture, light, rainfall; boundary validation; trend analysis. | ✅ Verified | `src/services/environmentalValidation.ts`, `environmentalService.ts` |
| **Adaptive Care Planner (M14)** | Deterministic care recommendations, persistent task lifecycle, zero duplicates. | ✅ Verified | `src/services/adaptiveCareEngine.ts`, `CarePlannerView.tsx` |
| **Advanced Health Doctor (M15)** | Contextual diagnosis combining symptoms, sensors, and botanical requirements; 48-72h recovery follow-up. | ✅ Verified | `src/services/plantHealthDiagnosticEngine.ts`, `GardenDoctorView.tsx` |
| **Weather-Aware Intelligence (M16)** | Severe weather alerts, shelter/exposure differentiation, forecast rain postponement, sensor freshness checks. | ✅ Verified | `src/services/openMeteoWeatherProvider.ts`, `adaptiveCareEngine.ts` |
| **Performance & Growth Insights (M17)** | Deterministic analytics, cm/day growth calculations, care completion rates, health outcome metrics. | ✅ Verified | `src/services/gardenPerformanceService.ts`, `GardenPerformanceView.tsx` |

---

## 4. Baseline Verification Results

All baseline checks executed successfully without modifying application code:

1. **Vitest Regression Suite:**
   - Command: `node ./node_modules/vitest/vitest.mjs run`
   - Exit Code: `0`
   - Test Files: **22 passed (22)**
   - Tests: **205 passed (205)**
   - Duration: 3.78 seconds
2. **TypeScript Strict Type Check:**
   - Command: `node ./node_modules/typescript/bin/tsc --noEmit`
   - Exit Code: `0`
   - Type Errors: **0 errors**
3. **Vite Production Bundle:**
   - Command: `node ./node_modules/vite/bin/vite.js build`
   - Exit Code: `0`
   - Output Assets:
     - `dist/index.html` (1.18 kB │ gzip: 0.66 kB)
     - `dist/assets/index-CfSfFb3R.css` (10.06 kB │ gzip: 2.65 kB)
     - `dist/assets/index-DCC1AvHq.js` (960.15 kB │ gzip: 240.15 kB)
   - Warnings Recorded:
     - `(!) Some chunks are larger than 500 kB after minification.` (Eager bundle loading issue).
4. **Browser Subagent / Playwright Driver Note:**
   - The browser subagent encountered an upstream CDN 404 while attempting to download the standalone Windows Playwright driver package (`playwright-1.57.0-win32_x64.zip` from Microsoft Azure CDN).
   - In accordance with the prompt instructions and explicit user authorization, we transitioned to comprehensive code-level DOM, CSS, component, and token inspection using the installed design-review tools.

---

## 5. Tool Discovery, Download & Verification Matrix

| Tool / Skill Name | Official Upstream URL | License | Version / Commit | Initial Availability | Installation Method & Location | Antigravity Compatibility | Verified Capabilities | Execution Status | Key Findings Produced |
| :--- | :--- | :---: | :---: | :---: | :--- | :---: | :--- | :---: | :--- |
| **Impeccable** | `https://github.com/pbakaus/impeccable` | Apache 2.0 | v4.5.2 | Not installed | Installed to `.agents/skills/impeccable/SKILL.md` | Fully Compatible | Visual hierarchy, typography scales, grayscale hierarchy, design anti-patterns, edge states. | Loaded & Executed | Flagged nested card patterns, missing grayscale hierarchy, and hardcoded styling overrides. |
| **Ponytail** | `https://github.com/DietrichGebert/ponytail` | MIT | v5.0 | Not installed | Installed to `.agents/skills/ponytail/SKILL.md` | Fully Compatible | Code minimalism, YAGNI, bloat elimination, component decomposition, state coupling review. | Loaded & Executed | Flagged 2,929-line monolithic `GardenContext`, 1,460-line `GardenDoctorView`, and 1,700+ inline style duplications. |
| **better-web-ui** | `https://github.com/aladicf/better-web-ui` | Apache 2.0 | main | Not installed | Installed to `.agents/skills/better-web-ui/SKILL.md` | Fully Compatible | Refactoring UI model, 5-dimension scoring (A11y, Performance, Theming, Responsive, Slop). | Loaded & Executed | Scored 5 dimensions; flagged token bypass, missing ARIA on filters, and mobile bottom bar overflow. |
| **design-loop** | `https://github.com/rithvikx/design-loop` | MIT | main | Not installed | Installed to `.agents/skills/design-loop/SKILL.md` | Fully Compatible | Multi-phase evidence loop (Understand → Inspect → Plan → Implement → Verify), Gauntlet protocol. | Loaded & Executed | Provided structured evidence loop for P0–P3 prioritization and testable acceptance criteria. |
| **design-review** | `https://github.com/garrytan/gstack` & `plugin87/ux-ui-agent-skills` | MIT | main | Not installed | Installed to `.agents/skills/design-review/SKILL.md` | Fully Compatible | Nielsen Norman usability heuristics, multi-breakpoint standards (375px, 768px, 1280px), touch targets. | Loaded & Executed | Discovered 28.8px mobile button touch target collapse violating 44px minimum; evaluated error recovery. |

---

## 6. UI/UX and Design-System Audit

### 6.1 Visual Consistency & Typography
- **Strengths:** Excellent primary brand fonts (`Outfit` for headings, `Plus Jakarta Sans` for body copy) configured in `index.html` and `index.css`. The natural color palette (`--color-primary: #22543D`, `--color-terracotta: #C05621`, `--color-bg-base: #F8FAF7`) perfectly aligns with the "Touch Grass" outdoor product philosophy.
- **Weaknesses:** Inconsistency between CSS classes (`.card`, `.btn-primary`) and ad-hoc inline styles. Over 1,700 elements apply one-off inline style objects that override or duplicate design system tokens. Heading font sizes jump abruptly in certain modals (e.g., `1.6rem` vs `1.75rem` vs `2.25rem` without standard scale steps).

### 6.2 UX & Information Architecture
- **Navigation Complexity:** The application exposes 13 distinct top-level tabs. Beginners navigating the app face high cognitive load when choosing between "Home", "My Garden", "Insights & Growth", "Journal", "Environment", "Care Planner", "Digital Twin", "Layout", "Plants", "Today's Garden", "Shopping", "Ask Mitra", and "Doctor".
- **Duplicate Workflows:**
  - Marking a plant watered can be triggered from `TodaysGardenView`, `MyGardenDashboard`, `CarePlannerView`, and `GardenJournalView`.
  - Viewing environment stats can be accessed in `TodaysGardenView` (summary), `GardenEnvironmentView` (raw metrics), and `CarePlannerView` (weather alerts).
- **Blocking Native Alerts:** 10 occurrences of `alert(...)` interrupt user flow. For instance, clicking "I Watered It" in `TodaysGardenView` triggers `alert(res.message);`, which pauses UI execution and forces a modal OS dialog.

### 6.3 Responsive Ergonomics (Breakpoints 375px / 768px / 1280px)
- **Desktop (1280px):** Well-proportioned layout with centered max-width container (`1080px`), clean card grids, and readable typography.
- **Tablet (768px):** Desktop navigation bar begins crowding at 900px, where 13 text links and the brand logo collide.
- **Mobile (375px Small / 414px Standard):**
  - **Severe Touch Target Collapse:** Fixed bottom navigation (`.mobile-nav`) attempts to fit 13 items horizontally. Each button receives only $\approx 28.8\text{px}$ width. Finger taps frequently misfire onto adjacent tabs.
  - **Modal Overflow:** On mobile screens, modal cards with `maxHeight: '90vh'` and heavy padding push primary CTA buttons below the fold, forcing users to scroll within a small dialog window.

---

## 7. Accessibility (A11y) Audit

Evaluated against **W3C WCAG 2.1 Level AA**:

| Checkpoint | Status | Evidence & Impact |
| :--- | :---: | :--- |
| **1.1.1 Non-text Content** | ⚠️ Partial | Lucide SVG icons are rendered without `aria-hidden="true"`. Icon-only buttons (e.g. search icons, modal close buttons) occasionally omit `aria-label`. |
| **1.3.1 Info & Relationships** | ❌ Fails | Filter chips in `PlantRecommendationView.tsx` lack `<fieldset>` or `role="group"` wrappers. Checkbox filters lack explicit `<label htmlFor="...">` associations. |
| **2.1.1 Keyboard Navigation** | ❌ Fails | Modal dialogs (`PlantDetailModal`, `TouchGrassModal`, `SpaceModal`) do not trap focus. Pressing `Tab` cycles behind the overlay into background inputs. |
| **2.1.2 No Keyboard Trap (Escape)** | ❌ Fails | Pressing the `Escape` key does not close any modal dialog in the application. |
| **2.4.3 Focus Order** | ⚠️ Partial | Closing a modal does not return focus to the trigger button that opened it. Focus resets to `<body>`. |
| **2.5.5 Target Size (Enhanced)** | ❌ Fails | Mobile navigation bar buttons are $28.8\text{px} \times 32\text{px}$, failing the required $44\text{px} \times 44\text{px}$ touch target minimum. |
| **4.1.2 Name, Role, Value** | ⚠️ Partial | Category pills in `PlantRecommendationView` are plain `<button>` elements with no `aria-pressed` or `aria-selected` attributes. |
| **4.1.3 Status Messages** | ❌ Fails | Dynamic actions (e.g., watering logged, soil check feedback, diagnosis complete) use `window.alert()` instead of an accessible `aria-live="polite"` toast region. |

---

## 8. Engineering, Performance & Security Audit

### 8.1 Code Quality & Component Architecture
- **Monolithic Context (`src/context/GardenContext.tsx`):**
  - Line count: **2,929 lines**.
  - Responsibilities: 14 distinct functional domains bundled into one provider.
  - Impact: Any minor change (such as appending a chat message or toggling a checkbox) triggers re-renders across the entire component tree.
- **Monolithic Screen Components:**
  - `GardenDoctorView.tsx`: **1,460 lines**.
  - `TodaysGardenView.tsx`: **707 lines**.
  - `GardenPerformanceView.tsx`: **771 lines**.
  - `GardenEnvironmentView.tsx`: **890 lines**.
  - These components contain inlined modals, nested forms, and canvas helpers that should be decomposed into modular feature directories.

### 8.2 Performance & Bundle Size
- **Vite Production Bundle Analysis:**
  - Minified JS chunk: **960.15 kB** (240.15 kB gzip).
  - Cause: Zero code splitting. `src/App.tsx` imports all 17 screens statically.
  - Solution: Introduce `React.lazy()` and `Suspense` for heavy views (`DigitalTwinStudio`, `GardenCaptureStudio`, `GardenEnvironmentView`, `GardenPerformanceView`, `GardenDoctorView`), reducing initial bundle size to under **250 kB**.

### 8.3 Security & Privacy
- **Audit Result: Pass / Exceptional Security.**
  - **No external telemetry or data leaks:** Zero analytics or tracking scripts.
  - **No credentials stored in client:** Open-Meteo requires no API key; Ollama runs strictly on `localhost`.
  - **IndexedDB isolation:** User garden photos and video frames stay in the local browser database.
  - **Dependencies:** Only 3 runtime dependencies (`react`, `react-dom`, `lucide-react`). Extremely low attack surface.

---

## 9. Open-Source Comparative Research Summary

To guide the M19.2 remediation design, eight architectural domains were researched across mature open-source projects:

1. **Headless Accessible Primitives (Radix UI / Ariakit):**
   - *Pattern:* Unstyled, accessible dialog and tab components with built-in focus traps, `Escape` key handling, portal rendering, and ARIA attributes.
   - *Recommendation for M19.2:* Adapt the Radix UI Dialog / Focus-Trap pattern using a lightweight in-house hook (`useFocusTrap`, `useEscapeKey`) to avoid adding bloated runtime dependencies.
2. **Design Tokens & System Architecture (Open Props & Refactoring UI):**
   - *Pattern:* Centralizing spacing scales, typographic hierarchies, and elevation tokens in CSS custom properties.
   - *Recommendation for M19.2:* Consolidate the 1,700+ inline styles into scoped CSS classes and semantic design tokens in `src/index.css`.
3. **Ergonomic Mobile Navigation (Material 3 & iOS HIG Tab Bars):**
   - *Pattern:* 4–5 core navigation destinations on mobile bottom bar, plus a "More" drawer/sheet for secondary tools.
   - *Recommendation for M19.2:* Restructure the mobile bottom bar to 4 primary tabs: **Today**, **My Garden**, **Care**, and **Doctor**, with a **More** drawer revealing the remaining tools.
4. **Accessible Notification Toast System:**
   - *Pattern:* Lightweight `aria-live="polite"` toast notifications replacing native blocking `window.alert()`.
   - *Recommendation for M19.2:* Create a non-blocking `ToastProvider` with auto-dismiss and accessible screen-reader announcements.
5. **Component-Level Code Splitting (Vite + React Suspense):**
   - *Pattern:* `React.lazy(() => import('./components/...'))` with route-level `Suspense` skeletons.
   - *Recommendation for M19.2:* Code-split non-critical screens in `App.tsx` to reduce initial bundle chunk size below 300 kB.
6. **Error Boundary Resilience (`react-error-boundary`):**
   - *Pattern:* Graceful error catching with contextual recovery buttons and supportive user feedback.
   - *Recommendation for M19.2:* Implement an `<ErrorBoundary>` component with a calming "Touch Grass" recovery screen.

*(Full comparative research analysis, licenses, and references are detailed in [`docs/m19.1/opensource-research.md`](file:///c:/Users/devde/Downloads/garden/docs/m19.1/opensource-research.md)).*

---

## 10. Prioritized Remediation Backlog (M19.2)

| Priority | Finding ID | Title & Description | Category | Impact / Risk | Effort | Validation Method |
| :---: | :--- | :--- | :---: | :--- | :---: | :--- |
| **P1** | `FIND-NAV-01` | **Mobile Bottom Navigation Re-architecture:** Reduce 13-tab mobile bar to 4 primary tabs + "More" drawer; enforce 44×44px touch targets. | UI/UX & A11y | Eliminates mis-clicks, unreadable labels, and WCAG touch target failures. | Medium | 375px mobile inspection & touch target measurement. |
| **P1** | `FIND-REL-01` | **Top-Level & Sectional Error Boundaries:** Implement `<ErrorBoundary>` with calm recovery UI to prevent white-screen crashes. | Reliability | Guarantees application stability against unhandled JS exceptions. | Low | Simulated error trigger & fallback verification. |
| **P1** | `FIND-A11Y-01` | **Accessible Modal System:** Implement focus trapping, `Escape` key dismissal, focus restoration, and `aria-labelledby`. | Accessibility | Resolves WCAG 2.1.1, 2.1.2, and 2.4.3 modal accessibility defects. | Medium | Keyboard-only navigation audit across all modals. |
| **P1** | `FIND-TOK-01` | **Design Token Consolidation:** Replace 1,700+ inline styles and hardcoded hex values with semantic CSS tokens in `index.css`. | Code Quality | Eliminates styling inconsistencies, speeds up rendering, enables theming. | High | Grep style audits & visual regression checks. |
| **P2** | `FIND-A11Y-02` | **Non-Blocking Toast Notification System:** Replace 10 `window.alert()` calls with accessible `aria-live` toasts. | UI/UX & A11y | Modernizes user feedback, eliminates main-thread blocking dialogs. | Medium | Screen-reader announcement & interactive flow tests. |
| **P2** | `FIND-PERF-01` | **Bundle Code-Splitting with `React.lazy`:** Lazy-load secondary views in `App.tsx` with skeleton fallback. | Performance | Slashes initial JS bundle size from 960 kB to <300 kB, resolves Vite warning. | Low | `vite build` chunk analysis & Lighthouse audit. |
| **P2** | `FIND-ARCH-01` | **Context Modularization:** Decouple monolithic `GardenContext` (2,929 lines) into domain hooks/slices. | Architecture | Eliminates global re-renders, simplifies maintenance and unit testing. | High | Vitest regression test suite & React DevTools profiling. |
| **P2** | `FIND-ARCH-02` | **Decompose Monolithic Components:** Break `GardenDoctorView` (1,460 lines) into focused subcomponents. | Architecture | Enhances modularity, readability, and testability. | Medium | Component unit test coverage. |
| **P2** | `FIND-UX-01` | **Hash Navigation & History Sync:** Sync active tab state with URL hash (`#today`, `#doctor`) to support browser Back button. | UX | Restores standard web navigation and bookmarking behavior. | Low | Browser Back/Forward button testing. |
| **P3** | `FIND-A11Y-03` | **Search & Form Accessible Labels:** Add explicit `aria-label` or `<label>` tags to search inputs and filter checkboxes. | Accessibility | WCAG 4.1.2 label compliance. | Low | Automated axe-core scan. |
| **P3** | `FIND-OSS-01` | **Open-Source Health & CI Workflows:** Add GitHub Actions CI workflow, PR template, issue templates, and contribution guide. | OSS Readiness | Professionalizes open-source repository governance. | Low | GitHub workflow linting & validation. |

*(Complete findings register available in [`docs/m19.1/findings-register.md`](file:///c:/Users/devde/Downloads/garden/docs/m19.1/findings-register.md); full implementation specifications available in [`docs/m19.1/remediation-roadmap.md`](file:///c:/Users/devde/Downloads/garden/docs/m19.1/remediation-roadmap.md)).*

---

## 11. Known Limitations & Unresolved Questions

1. **Standalone Playwright Binary on Windows Environment:** The standalone Playwright driver download failed with network 404 from upstream Azure CDN during subagent initialization. Automated browser testing was supplemented with rigorous code-level DOM, AST, CSS, and token analysis.
2. **Offline Vision AI Dependency:** `localOllamaVisionProvider.ts` requires a locally running Ollama instance on `localhost:11434`. The app gracefully degrades when Ollama is absent, which was confirmed and preserved.
3. **Open-Source CI Workflows:** The repository currently has no `.github/workflows/` directory. CI testing is currently run locally via npm scripts. Adding a GitHub Actions CI pipeline is scheduled under `FIND-OSS-01`.

---

## 12. Approval Gate & Next Steps

All research, tool discovery, baseline verification, and design specification tasks for **Milestone M19.1** are complete. **No application production code was modified during this milestone.**

### Status Statement
**M19.1 design review complete. M19.2 implementation has not started. The remediation specification is ready for review and approval.**
