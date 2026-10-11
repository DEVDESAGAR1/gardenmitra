# GardenMitra 🌱 — Milestone 19.1: Comprehensive Findings & Evidence Register

> **Repository:** [https://github.com/DEVDESAGAR1/gardenmitra](https://github.com/DEVDESAGAR1/gardenmitra)  
> **Milestone:** M19.1 — Design Audit & Research  
> **Document Purpose:** Systematic register of all verified defects, accessibility gaps, architectural anti-patterns, and design improvements discovered during the M19.1 audit.  

---

## Findings Summary Matrix

| ID | Title | Category | Severity | Confidence | M19.2 Priority | Source Reference |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`FIND-NAV-01`** | Mobile Bottom Navigation 13-Tab Overflow & Severe Touch Target Collapse | UI/UX & A11y | **High** | Confirmed | **P1** | `src/components/Header.tsx:98-110` |
| **`FIND-REL-01`** | Missing React Error Boundaries Resulting in Blank White Screen Crashes | Reliability | **High** | Confirmed | **P1** | `src/App.tsx:23-80` |
| **`FIND-A11Y-01`** | Modal Dialogs Lack Focus Trapping, Escape Key Dismissal & Focus Restoration | Accessibility | **High** | Confirmed | **P1** | `PlantDetailModal.tsx`, `TouchGrassModal.tsx` |
| **`FIND-TOK-01`** | 1,700+ Inline Style Declarations Bypassing Central Design Tokens | Code Quality | **High** | Confirmed | **P1** | Across all components in `src/components/` |
| **`FIND-A11Y-02`** | Synchronous Native `window.alert()` Calls Across 10 Core User Journeys | UI/UX & A11y | **Medium** | Confirmed | **P2** | `TodaysGardenView.tsx:80`, `MyGardenDashboard.tsx:548` |
| **`FIND-PERF-01`** | Monolithic 960 kB Bundle Without Route-Level Code Splitting | Performance | **Medium** | Confirmed | **P2** | `src/App.tsx:5-21`, `vite build` output |
| **`FIND-ARCH-01`** | Monolithic 2,929-Line `GardenContext` Inducing Global Cascade Re-renders | Architecture | **Medium** | Confirmed | **P2** | `src/context/GardenContext.tsx` |
| **`FIND-ARCH-02`** | Bloated Monolithic Screen Components Exceeding 1,400 Lines | Architecture | **Medium** | Confirmed | **P2** | `src/components/GardenDoctorView.tsx` |
| **`FIND-UX-01`** | Internal Tab Routing Without URL Hash or Browser History Synchronization | UX | **Medium** | Confirmed | **P2** | `src/App.tsx:26-59` |
| **`FIND-A11Y-03`** | Search and Filter Inputs Lacking Associated Accessible Names | Accessibility | **Medium** | Confirmed | **P3** | `PlantRecommendationView.tsx:171` |
| **`FIND-A11Y-04`** | Filter Category Pills Missing ARIA Pressed/Selected Attributes | Accessibility | **Low** | Confirmed | **P3** | `PlantRecommendationView.tsx:197-205` |
| **`FIND-OSS-01`** | Absence of GitHub Actions CI Workflow, PR Templates & Issue Governance | OSS Readiness | **Low** | Confirmed | **P3** | Repository Root (`.github/` missing) |

---

## Detailed Findings Profiles

### `FIND-NAV-01`: Mobile Bottom Navigation 13-Tab Overflow & Severe Touch Target Collapse
- **Category:** UI/UX & Accessibility (A11y)
- **Severity:** High
- **Confidence:** Confirmed
- **Evidence Type:** Code inspection & mathematical viewport layout calculation.
- **Source Reference:** [`src/components/Header.tsx:98-110`](file:///c:/Users/devde/Downloads/garden/src/components/Header.tsx#L98-L110), [`src/index.css:442-485`](file:///c:/Users/devde/Downloads/garden/src/index.css#L442-L485)
- **Current Behavior:** The mobile navigation bar (`.mobile-nav`) renders all 13 items (`Home`, `My Garden`, `Insights`, `Journal`, `Environment`, `Care`, `Twin`, `Layout`, `Plants`, `Today`, `Shopping`, `Ask Mitra`, `Doctor`) side-by-side using `display: flex; justify-content: space-around;`. On standard mobile screens (375px–414px), each tab item is squeezed to approximately $28.8\text{px}$ width. Text labels overlap or clip into 3 unreadable lines, and tapping a tab routinely triggers adjacent buttons.
- **Expected Behavior:** Mobile bottom navigation should follow established mobile UX standards (iOS HIG / Material 3) by presenting **4 primary tabs** (e.g. `Today`, `Garden`, `Care`, `Doctor`) and a **5th "More..." button** that opens a clean modal sheet or drawer containing secondary tools (`Twin`, `Layout`, `Environment`, `Journal`, `Shopping`, `Performance`, `Ask Mitra`).
- **User / Engineering Impact:** Extreme user frustration on mobile devices; failure of WCAG 2.5.5 Target Size minimums ($44\text{px} \times 44\text{px}$).
- **Root-Cause Hypothesis:** New features added in sequential milestones (M0 through M17) iteratively appended tabs directly to the global navigation list without establishing a mobile drawer tier.
- **Recommended Remediation:**
  1. Refactor `Header.tsx` to display only 4 primary items + 1 "More" drawer item on viewports $<900\text{px}$.
  2. Implement an accessible, animated `<MobileNavDrawer>` slide-over sheet.
  3. Ensure all mobile interactive buttons meet the $44\text{px} \times 44\text{px}$ touch target floor.
- **Trade-offs & Risks:** Low risk. Secondary features require one additional tap to access on mobile, but primary usability is restored.
- **Effort:** Medium (4 hours).
- **Dependencies:** None.
- **Validation Method:** Viewport simulation at 375px, 390px, and 414px width; touch target bounding box measurements.
- **Acceptance Criteria:** Every interactive element in the mobile navigation bar has $\ge 44\text{px}$ touch area; no horizontal label clipping; drawer opens smoothly and can be closed via tap, backdrop, or swipe.
- **Proposed M19.2 Priority:** **P1**

---

### `FIND-REL-01`: Missing React Error Boundaries Resulting in Blank White Screen Crashes
- **Category:** Reliability & Resilience
- **Severity:** High
- **Confidence:** Confirmed
- **Evidence Type:** Static AST inspection of React tree.
- **Source Reference:** [`src/App.tsx:23-88`](file:///c:/Users/devde/Downloads/garden/src/App.tsx#L23-L88)
- **Current Behavior:** There is zero `<ErrorBoundary>` component anywhere in the React tree. If an uncaught exception is thrown in any component (for instance, an unexpected null property in a plant instance, an unhandled IndexedDB QuotaExceededError, or a canvas context failure in Digital Twin), React unmounts the entire application root and leaves the user on a blank white screen.
- **Expected Behavior:** Any unhandled component error should be caught by a top-level or sectional ErrorBoundary. The user should see a supportive fallback screen embodying GardenMitra's calm "Touch Grass" philosophy ("Something stumbled in the garden, but your plants are safe. Take a breath and reload the view.") with an action button to recover.
- **User / Engineering Impact:** Unrecoverable total application crash on unhandled edge cases; loss of in-flight user edits; negative user trust.
- **Root-Cause Hypothesis:** Rapid milestone-driven feature additions without implementing frontend resilience infrastructure.
- **Recommended Remediation:**
  1. Implement a reusable, resilient `<ErrorBoundary>` class component.
  2. Wrap `<AppContent />` in a top-level error boundary.
  3. Wrap complex visual subsystems (`DigitalTwinStudio`, `GardenCaptureStudio`) in localized section boundaries so a failure in the canvas does not break the rest of the application.
- **Trade-offs & Risks:** Zero risk. Pure defensive engineering.
- **Effort:** Low (2 hours).
- **Dependencies:** None.
- **Validation Method:** Intentionally throw an error inside a test component and verify the friendly fallback UI displays with working recovery button.
- **Acceptance Criteria:** Throwing an unhandled exception renders the fallback UI; clicking "Reload Garden" resets error state; console logs the error details safely without leaking user data.
- **Proposed M19.2 Priority:** **P1**

---

### `FIND-A11Y-01`: Modal Dialogs Lack Focus Trapping, Escape Key Dismissal & Focus Restoration
- **Category:** Accessibility (A11y)
- **Severity:** High
- **Confidence:** Confirmed
- **Evidence Type:** DOM and keyboard interaction analysis.
- **Source Reference:** [`src/components/PlantDetailModal.tsx:34-88`](file:///c:/Users/devde/Downloads/garden/src/components/PlantDetailModal.tsx#L34-L88), [`src/components/TouchGrassModal.tsx:11-30`](file:///c:/Users/devde/Downloads/garden/src/components/TouchGrassModal.tsx#L11-L30), [`src/components/SpaceModal.tsx:165-185`](file:///c:/Users/devde/Downloads/garden/src/components/SpaceModal.tsx)
- **Current Behavior:** Modals apply `role="dialog"` and `aria-modal="true"`, but do not implement focus management. When opened:
  1. Focus remains on the background trigger element instead of moving into the dialog.
  2. Pressing `Tab` allows focus to escape behind the backdrop into covered page elements.
  3. Pressing `Escape` does not dismiss the modal.
  4. Dismissing the modal resets document focus to `<body>`, disorienting screen reader and keyboard-only users.
  5. There is no `aria-labelledby` linking the dialog container to its title heading.
- **Expected Behavior:** Conformance with W3C WAI-ARIA Dialog (Modal) Pattern:
  - Focus moves to the first interactive element or dialog title upon opening.
  - Tab and Shift+Tab loop strictly within the dialog.
  - Pressing `Escape` immediately dismisses the modal.
  - Focus returns to the button that opened the modal upon closing.
  - `aria-labelledby` connects the dialog container to the heading `id`.
- **User / Engineering Impact:** Keyboard and screen reader users are trapped or disoriented; severe failure of WCAG 2.1.1, 2.1.2, and 2.4.3.
- **Root-Cause Hypothesis:** Modals were coded as simple conditional `div` overlays rather than utilizing an accessible dialog pattern.
- **Recommended Remediation:**
  1. Create a reusable custom hook `useFocusTrap(ref, isOpen, onClose)` handling focus containment, initial focus, restore focus, and `Escape` key event listeners.
  2. Update all modal components (`PlantDetailModal`, `TouchGrassModal`, `SpaceModal`, `HeightMeasurementModal`) to consume this hook and include proper `aria-labelledby` attributes.
- **Trade-offs & Risks:** Low risk. Standard accessible behavior.
- **Effort:** Medium (4 hours).
- **Dependencies:** None.
- **Validation Method:** Keyboard-only navigation test: open modal, press `Tab` 20 times (verify focus never leaves modal), press `Escape` (verify modal closes and focus returns to trigger).
- **Acceptance Criteria:** 100% compliance with WCAG 2.1.1 and 2.1.2 across all application dialogs.
- **Proposed M19.2 Priority:** **P1**

---

### `FIND-TOK-01`: 1,700+ Inline Style Declarations Bypassing Central Design Tokens
- **Category:** Code Quality, Maintainability & Theming
- **Severity:** High
- **Confidence:** Confirmed
- **Evidence Type:** Static grep search and CSS audit.
- **Source Reference:** 1,700+ matches for `style={{ ... }}` across `src/components/`, notably `AdaptiveScanGuidanceCard.tsx`, `GardenDoctorView.tsx`, `GardenPerformanceView.tsx`, `CarePlannerView.tsx`.
- **Current Behavior:** While `src/index.css` defines a clean token system (`--color-primary`, `--color-terracotta`, `--color-bg-base`, etc.), component files bypass these tokens by hardcoding inline style objects with raw hex colors: `#0F172A` (Slate 900), `#2563EB` (Blue 600), `#15803D` (Green 700), `#D97706` (Amber 600), `#FEF3C7` (Amber 100).
- **Expected Behavior:** Components should consume semantic CSS utility classes or CSS custom properties defined in `src/index.css`. Raw hex codes should be eliminated from JSX style props.
- **User / Engineering Impact:**
  - Prevents the implementation of Dark Mode or customizable high-contrast themes.
  - Creates visual drift where three different shades of green or amber are used for similar status badges.
  - Increases React memory footprint and virtual DOM reconciliation time due to recreating inline style objects on every render cycle.
- **Root-Cause Hypothesis:** Rapid milestone builds where developers inlined styles for quick prototyping rather than creating designated CSS utility classes.
- **Recommended Remediation:**
  1. Expand `src/index.css` with missing semantic tokens (e.g. `--color-info`, `--color-info-subtle`, `--color-warning-subtle`, `--color-danger-subtle`).
  2. Create structured CSS classes (`.badge-info`, `.badge-warning`, `.badge-danger`, `.stat-tile`, `.card-section`).
  3. Refactor inline styles in major components to use class names and CSS variables.
- **Trade-offs & Risks:** Requires careful regression checking to ensure layout dimensions and spacings remain pixel-accurate.
- **Effort:** High (6 hours).
- **Dependencies:** None.
- **Validation Method:** Grep search audit for raw hex literals in `src/components/`; visual inspection across desktop and mobile.
- **Acceptance Criteria:** Over 80% reduction in inline style objects; zero raw hex color literals in JSX; full support for CSS-variable-based theming.
- **Proposed M19.2 Priority:** **P1**

---

### `FIND-A11Y-02`: Synchronous Native `window.alert()` Calls Across 10 Core User Journeys
- **Category:** UI/UX & Accessibility
- **Severity:** Medium
- **Confidence:** Confirmed
- **Evidence Type:** Static grep search.
- **Source Reference:**
  - `src/components/TodaysGardenView.tsx:80` (`alert(res.message);`)
  - `src/components/GardenPerformanceView.tsx:97` (`alert('Please select a plant...');`)
  - `src/components/MyGardenDashboard.tsx:548, 605, 617`
  - `src/components/GardenCaptureStudio.tsx:280`
  - `src/components/PhotoUploader.tsx:71, 531, 548`
  - `src/components/SunlightIntelligenceCard.tsx:54`
- **Current Behavior:** Clicking key actions (e.g., recording watering, performing a 1-inch soil check, logging plant height, or reporting camera errors) invokes native browser `window.alert()`. This pauses the JavaScript execution thread, prevents background rendering, sounds an OS beep, cannot be styled or animated, and is inaccessible to many assistive technologies.
- **Expected Behavior:** Actions should trigger a non-blocking, accessible toast notification (e.g. "Recorded: Holy Basil watered at the base 🌱") that floats in the bottom-right or top-right, auto-dismisses after 4 seconds, and includes an `aria-live="polite"` announcement.
- **User / Engineering Impact:** Jarring UX interruption; breaks automated browser tests; main thread freezing.
- **Root-Cause Hypothesis:** Temporary debugging alerts left in place during earlier milestones.
- **Recommended Remediation:**
  1. Implement a lightweight, unstyled, zero-dependency `ToastContext` and `useToast()` hook.
  2. Render a fixed `<ToastContainer>` with `aria-live="polite"` in `App.tsx`.
  3. Replace all 10 `alert(...)` calls with `toast.success(...)`, `toast.info(...)`, or `toast.error(...)`.
- **Trade-offs & Risks:** None. Substantial UX and a11y upgrade.
- **Effort:** Medium (3 hours).
- **Dependencies:** None.
- **Validation Method:** Perform all 10 actions and verify modern non-blocking toasts appear and auto-dismiss without thread locking.
- **Acceptance Criteria:** Zero occurrences of `alert(` in the codebase; toasts announce correctly to screen readers; auto-dismiss and manual dismiss both work.
- **Proposed M19.2 Priority:** **P2**

---

### `FIND-PERF-01`: Monolithic 960 kB Bundle Without Route-Level Code Splitting
- **Category:** Performance & Startup Latency
- **Severity:** Medium
- **Confidence:** Confirmed
- **Evidence Type:** Vite build output warning: `dist/assets/index-DCC1AvHq.js 960.15 kB (!) Some chunks are larger than 500 kB after minification.`
- **Source Reference:** [`src/App.tsx:5-21`](file:///c:/Users/devde/Downloads/garden/src/App.tsx#L5-L21)
- **Current Behavior:** All 17 view components (`WelcomeScreen`, `MyGardenDashboard`, `GardenDoctorView`, `DigitalTwinStudio`, `CarePlannerView`, `GardenEnvironmentView`, `GardenPerformanceView`, etc.) are imported eagerly at the top of `App.tsx`. As a result, the user must download and parse the entire 960 kB JavaScript payload upon initial page load, even if they only view the Welcome or Today screen.
- **Expected Behavior:** Secondary and heavyweight views (especially `DigitalTwinStudio` with its 2D canvas, `GardenCaptureStudio` with video decoding, `GardenDoctorView`, and `GardenPerformanceView`) should be lazy-loaded on demand using `React.lazy()` and `<Suspense fallback={<ScreenSkeleton />}>`.
- **User / Engineering Impact:** Slower initial page load and Time-to-Interactive (TTI), particularly on mobile devices on slower 3G/4G connections.
- **Root-Cause Hypothesis:** All views were imported statically in `App.tsx` during rapid milestone prototyping.
- **Recommended Remediation:**
  1. Replace static imports for secondary screens in `App.tsx` with `React.lazy(() => import(...))`.
  2. Add `<Suspense fallback={<PageSkeleton />}>` around `{renderActiveScreen()}`.
  3. Configure Vite `build.rollupOptions.output.manualChunks` to split vendor dependencies (`lucide-react`, `react-dom`).
- **Trade-offs & Risks:** Low risk. A small initial skeleton placeholder is shown when switching to a heavy screen for the very first time.
- **Effort:** Low (2 hours).
- **Dependencies:** None.
- **Validation Method:** Re-run `vite build` and verify that the main bundle chunk is under **250 kB** with zero Vite size warnings.
- **Acceptance Criteria:** Main entry bundle $<300\text{ kB}$; secondary chunks loaded asynchronously; seamless transition with skeleton loader.
- **Proposed M19.2 Priority:** **P2**

---

### `FIND-ARCH-01`: Monolithic 2,929-Line `GardenContext` Inducing Global Cascade Re-renders
- **Category:** Architecture & Code Maintainability
- **Severity:** Medium
- **Confidence:** Confirmed
- **Evidence Type:** Code length & dependency graph inspection.
- **Source Reference:** [`src/context/GardenContext.tsx:1-2929`](file:///c:/Users/devde/Downloads/garden/src/context/GardenContext.tsx)
- **Current Behavior:** A single React Context (`GardenContext`) contains 2,929 lines of code, managing 14 separate functional domains: active tab, spaces, plant catalog, shopping list, chat messages, sunlight profiles, layout containers, media capture, digital twins, sensors, adaptive care tasks, doctor diagnoses, weather snapshots, and notifications.
- **Expected Behavior:** State should be decomposed into cohesive domain contexts or custom hooks (e.g., `NavigationContext`, `GardenSpaceContext`, `CarePlannerContext`, `PlantDoctorContext`, `EnvironmentContext`).
- **User / Engineering Impact:**
  - High cognitive overhead for maintainers.
  - Performance degradation: typing in the chat or ticking a care task forces re-renders across all active components subscribed to `useGarden()`.
- **Root-Cause Hypothesis:** Iterative accumulation of state across 17 milestones within a single centralized context file.
- **Recommended Remediation:**
  1. Extract pure navigation state (`activeTab`, `setActiveTab`) into a lightweight `NavigationContext`.
  2. Keep `useGarden()` as a unified facade for backward compatibility, but delegate state domains internally to specialized slice hooks (`useGardenSpaces`, `useCareTasks`, `useDoctorDiagnostics`).
- **Trade-offs & Risks:** Medium risk if public interface changes. Must preserve `useGarden()` hook signature so existing tests and components continue functioning without breakage.
- **Effort:** High (6 hours).
- **Dependencies:** None.
- **Validation Method:** Run the entire 205-test Vitest regression suite; verify zero test failures or regressions.
- **Acceptance Criteria:** `GardenContext.tsx` reduced to $<1,000$ lines; all 205 Vitest tests pass; measurable reduction in unnecessary render cycles.
- **Proposed M19.2 Priority:** **P2**

---

### `FIND-ARCH-02`: Bloated Monolithic Screen Components Exceeding 1,400 Lines
- **Category:** Architecture & Maintainability
- **Severity:** Medium
- **Confidence:** Confirmed
- **Evidence Type:** Code inspection (`src/components/GardenDoctorView.tsx` = 1,460 lines; `src/components/GardenPerformanceView.tsx` = 771 lines; `src/components/TodaysGardenView.tsx` = 707 lines).
- **Source Reference:** [`src/components/GardenDoctorView.tsx`](file:///c:/Users/devde/Downloads/garden/src/components/GardenDoctorView.tsx)
- **Current Behavior:** `GardenDoctorView` contains vision camera dropzones, symptom multi-select grids, diagnostic reasoning cards, recovery care task creators, 48-72h follow-up modals, and diagnosis history lists all within a single 1,460-line component file.
- **Expected Behavior:** Follow the Ponytail minimalism and Clean Architecture principles by breaking large screen components into focused subcomponents (e.g. `DoctorDiagnoseTab`, `DoctorSymptomSelector`, `DoctorReportCard`, `DoctorFollowUpModal`, `DoctorHistoryTab`).
- **User / Engineering Impact:** High code complexity, difficult code reviews, high risk of unintended regressions during bug fixes.
- **Root-Cause Hypothesis:** New diagnostic and follow-up capabilities were appended directly to the existing view file in Milestone 15.
- **Recommended Remediation:**
  - Extract subcomponents into a dedicated feature directory: `src/components/doctor/`.
- **Trade-offs & Risks:** Low risk. Pure code organization refactoring without changing runtime behavior.
- **Effort:** Medium (4 hours).
- **Dependencies:** None.
- **Validation Method:** Vitest component tests and manual regression review.
- **Acceptance Criteria:** `GardenDoctorView.tsx` reduced to $<300$ lines acting as an orchestrator for dedicated subcomponents.
- **Proposed M19.2 Priority:** **P2**

---

### `FIND-UX-01`: Internal Tab Routing Without URL Hash or Browser History Synchronization
- **Category:** UX & Usability
- **Severity:** Medium
- **Confidence:** Confirmed
- **Evidence Type:** Code review of `App.tsx` and `Header.tsx`.
- **Source Reference:** [`src/App.tsx:26-59`](file:///c:/Users/devde/Downloads/garden/src/App.tsx#L26-L59)
- **Current Behavior:** Navigation between screens is managed purely via in-memory React state (`activeTab`). The browser URL never changes (it always remains `http://localhost:5173/`). If a user presses the browser Back button on mobile or desktop, they are navigated away from GardenMitra entirely rather than returning to the previous screen. Users also cannot bookmark or share links to specific tabs (e.g. `#care`, `#doctor`, `#plants`).
- **Expected Behavior:** Changing tabs should update the URL hash (`window.location.hash = tabId`) and listen to `hashchange` events. Pressing Back navigates to the previous tab within the application.
- **User / Engineering Impact:** Frustration on mobile when accidentally exiting the app; inability to bookmark views.
- **Root-Cause Hypothesis:** Initial prototype used simple in-memory state switching.
- **Recommended Remediation:**
  - Integrate lightweight hash synchronization in `useNavigation`: read initial tab from `window.location.hash.slice(1)` and push/replace state on tab switch.
- **Trade-offs & Risks:** Low risk. No heavy router library (like `react-router`) required.
- **Effort:** Low (2 hours).
- **Dependencies:** None.
- **Validation Method:** Switch between 3 tabs, press the browser Back button twice, and verify the UI returns to each previous tab in order.
- **Acceptance Criteria:** URL hash reflects active tab; browser Back/Forward buttons navigate between tabs; refreshing preserves active tab.
- **Proposed M19.2 Priority:** **P2**

---

### `FIND-A11Y-03`: Search and Filter Inputs Lacking Associated Accessible Names
- **Category:** Accessibility (A11y)
- **Severity:** Medium
- **Confidence:** Confirmed
- **Evidence Type:** Static inspection of `PlantRecommendationView.tsx:171-184`.
- **Source Reference:** [`src/components/PlantRecommendationView.tsx:171`](file:///c:/Users/devde/Downloads/garden/src/components/PlantRecommendationView.tsx#L171)
- **Current Behavior:** The plant search input relies solely on `placeholder="..."` without an `aria-label`, `aria-labelledby`, or `<label>` element. Quick filter checkboxes (`edibleOnly`, `petSafeOnly`, `indoorOnly`, `beginnerOnly`) lack `id` and explicit `<label htmlFor="...">` associations.
- **Expected Behavior:** Every input must have a programmatic accessible name satisfying WCAG 4.1.2 Name, Role, Value.
- **User / Engineering Impact:** Screen reader users cannot determine the purpose of the input field.
- **Root-Cause Hypothesis:** Visual placeholders were used as substitutes for accessible labels.
- **Recommended Remediation:** Add `aria-label="Search plants by name, scientific name, or Hindi"` to the search input, and add `id` + `htmlFor` pairings to filter checkboxes.
- **Trade-offs & Risks:** None.
- **Effort:** Low (1 hour).
- **Dependencies:** None.
- **Validation Method:** Screen reader inspection; axe-core automated check.
- **Acceptance Criteria:** Zero axe-core label violation errors on `PlantRecommendationView`.
- **Proposed M19.2 Priority:** **P3**

---

### `FIND-A11Y-04`: Filter Category Pills Missing ARIA Pressed/Selected Attributes
- **Category:** Accessibility (A11y)
- **Severity:** Low
- **Confidence:** Confirmed
- **Evidence Type:** Code inspection of `PlantRecommendationView.tsx:197-205`.
- **Source Reference:** [`src/components/PlantRecommendationView.tsx:197-205`](file:///c:/Users/devde/Downloads/garden/src/components/PlantRecommendationView.tsx#L197-L205)
- **Current Behavior:** Category pills (*All Plants, Vegetables, Herbs, Flowers, Succulents*) are plain `<button>` elements with class toggling (`btn-primary` vs `btn-secondary`). They do not declare `aria-pressed={selectedCategory === cat.id}` or `role="tab"` / `aria-selected`.
- **Expected Behavior:** Screen reader users should be notified of which category filter is currently active.
- **User / Engineering Impact:** Minor accessibility gap for visually impaired users.
- **Recommended Remediation:** Add `aria-pressed={selectedCategory === cat.id}` to each filter pill button.
- **Trade-offs & Risks:** None.
- **Effort:** Low (30 minutes).
- **Dependencies:** None.
- **Validation Method:** Verify screen reader announces "All Plants, toggle button, pressed".
- **Acceptance Criteria:** `aria-pressed` correctly reflects selected state.
- **Proposed M19.2 Priority:** **P3**

---

### `FIND-OSS-01`: Absence of GitHub Actions CI Workflow, PR Templates & Issue Governance
- **Category:** Open-Source Readiness
- **Severity:** Low
- **Confidence:** Confirmed
- **Evidence Type:** Repository root listing (`.github/` directory is missing).
- **Source Reference:** Repository root directory.
- **Current Behavior:** The repository has an MIT `LICENSE` and a comprehensive `README.md`, but lacks automated GitHub Actions CI workflows, issue templates, pull request templates, and a `CONTRIBUTING.md` guide.
- **Expected Behavior:** Production open-source projects should maintain a `.github/workflows/ci.yml` running linting, type-checking, and tests on pull requests, along with structured issue templates for bug reports and feature requests.
- **User / Engineering Impact:** Risk of regressions slipping into upstream branches from community contributions; lack of clear onboarding for outside contributors.
- **Recommended Remediation:**
  1. Add `.github/workflows/ci.yml` running `npm test`, `tsc --noEmit`, and `npm run build`.
  2. Add `CONTRIBUTING.md` explaining architecture and test commands.
  3. Add issue templates for bug reports and feature ideas.
- **Trade-offs & Risks:** None.
- **Effort:** Low (1.5 hours).
- **Dependencies:** None.
- **Validation Method:** Verify workflow syntax using action linter.
- **Acceptance Criteria:** CI workflow cleanly runs test suite and build on push/PR.
- **Proposed M19.2 Priority:** **P3**
