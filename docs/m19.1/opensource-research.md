# GardenMitra 🌱 — Milestone 19.1: Open-Source Research & Architectural Precedents

> **Milestone:** M19.1 — Research, Audit and Design Specification  
> **Purpose:** Document authoritative open-source libraries, design systems, and architectural patterns evaluated to resolve verified findings in GardenMitra.  
> **Philosophy:** Adopt proven patterns, adapt when simpler in-house implementations suffice, avoid adding bloated dependencies, and preserve GardenMitra's local-first zero-cost nature.  

---

## 1. Research Areas & Project Evaluation Matrix

| Domain | Researched Project(s) | Official Repository / Docs | License | Decision | Core Lesson / Application for GardenMitra |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Accessible Primitives** | **Radix UI Primitives** & W3C APG | `https://github.com/radix-ui/primitives`<br>`https://www.w3.org/WAI/ARIA/apg/` | MIT | **Adapt** | Focus-trap algorithm, `Escape` dismissal, focus restoration, and dialog portal patterns adapted into lightweight zero-dependency hooks (`useFocusTrap`). |
| **Design Tokens** | **Open Props** & **Refactoring UI** | `https://github.com/argyleink/open-props`<br>`https://refactoringui.com` | MIT | **Adapt** | Constrained semantic scales for spacing (8-point grid), elevation, radiuses, and semantic status colors without requiring Tailwind or heavy preprocessors. |
| **Mobile Navigation** | **Material Design 3** & **iOS HIG** | `https://m3.material.io/components/navigation-bar`<br>`https://developer.apple.com/design/human-interface-guidelines/tab-bars` | Public Standard | **Adopt** | 4-destination bottom navigation bar with a dedicated "More..." modal drawer; strict 44×44px minimum hit targets. |
| **React Resilience** | **`react-error-boundary`** | `https://github.com/bvaughn/react-error-boundary` | MIT | **Adapt** | Declarative error boundary catching component crashes, rendering calm "Touch Grass" recovery UI with reset capability. |
| **Accessible Notifications** | **Radix UI Toast** & Sonner | `https://github.com/radix-ui/primitives/tree/main/packages/react/toast`<br>`https://github.com/emilkowalski/sonner` | MIT | **Adapt** | Lightweight in-house `ToastProvider` using `aria-live="polite"` and auto-dismissal to replace blocking `window.alert()`. |
| **Code Splitting** | **Vite / Rollup Code Splitting** | `https://vitejs.dev/guide/build.html`<br>`https://rollupjs.org/configuration-options/#output-manualchunks` | MIT | **Adopt** | `React.lazy()` with route `<Suspense>` and `manualChunks` vendor isolation, slashing bundle chunk from 960 kB to <300 kB. |
| **State Decoupling** | **Zustand** & Domain-Sliced Context | `https://github.com/pmndrs/zustand`<br>`https://kentcdodds.com/blog/how-to-use-react-context-effectively` | MIT | **Adapt** | Slicing monolithic 2.9k-line context into domain slices (`NavigationContext`, `GardenSpaceContext`, `CarePlannerContext`) preserving the facade. |
| **Repository Governance** | **GitHub Actions Starter Workflows** | `https://github.com/actions/starter-workflows` | MIT | **Adopt** | Automated multi-stage CI pipeline verifying tests, type checking, and production builds on push/PR. |

---

## 2. In-Depth Project Studies

### 2.1 Accessible Dialog & Focus Management (Radix UI & W3C APG)
- **Primary Source:** W3C Web Accessibility Initiative — *Accessible Rich Internet Applications (WAI-ARIA) Authoring Practices 1.2: Dialog (Modal) Pattern*.  
- **Official Docs:** `https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/`  
- **License:** W3C Software and Document License / MIT (Radix UI).  
- **Problem Addressed in GardenMitra:** Modal dialogs (`PlantDetailModal`, `TouchGrassModal`, `SpaceModal`) currently allow keyboard focus to escape into background elements, fail to dismiss upon pressing `Escape`, and do not restore focus upon closing (`FIND-A11Y-01`).  
- **Key Architectural Lessons:**
  1. **Focus Trapping:** When the modal mounts, query all focusable elements inside the dialog:
     ```ts
     const focusableElements = modalRef.current.querySelectorAll(
       'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
     );
     ```
  2. **Tab Key Interception:** On `keydown` with `Tab`, if `ShiftKey` is active and focus is on the first item, cycle focus to the last element. If `ShiftKey` is inactive and focus is on the last item, cycle to the first element.
  3. **Escape Key Handling:** A window-level `keydown` listener listening for `event.key === 'Escape'` must invoke `onClose()`.
  4. **Initial & Restore Focus:** Store `document.activeElement` before opening; restore focus to this element on unmount.
- **Why Adapt Instead of Adding Radix Dependency?**
  GardenMitra uses Vanilla CSS and zero external component library runtimes. Introducing `@radix-ui/react-dialog` requires multiple sub-packages and polyfills. Creating a compact 50-line hook `useFocusTrap(dialogRef, isOpen, onClose)` provides 100% of the accessibility benefits with 0 kB of added external dependencies.

---

### 2.2 Design Token Systems (Open Props & Refactoring UI)
- **Primary Sources:**
  - *Open Props* by Adam Argyle (`https://open-props.style/`, MIT).
  - *Refactoring UI* by Adam Wathan & Steve Schoger.
- **Problem Addressed in GardenMitra:** Over 1,700 inline styles declare raw hex values (`#0F172A`, `#2563EB`, `#15803D`, `#D97706`), causing visual inconsistency, preventing dark mode, and inflating virtual DOM re-renders (`FIND-TOK-01`).
- **Key Architectural Lessons:**
  1. **Consistent 8-Point Spacing Scale:**
     ```css
     --space-1: 0.25rem; /* 4px */
     --space-2: 0.5rem;  /* 8px */
     --space-3: 0.75rem; /* 12px */
     --space-4: 1rem;    /* 16px */
     --space-6: 1.5rem;  /* 24px */
     --space-8: 2rem;    /* 32px */
     --space-12: 3rem;   /* 48px */
     ```
  2. **Functional Status Color Ramps (50 to 900):**
     Instead of arbitrary hardcoded greens and ambers, establish structured pairs:
     - `--color-success`: `#2F855A` (border/text), `--color-success-subtle`: `#E6F4EA` (background)
     - `--color-warning`: `#D97706` (border/text), `--color-warning-subtle`: `#FEF3C7` (background)
     - `--color-danger`: `#DC2626` (border/text), `--color-danger-subtle`: `#FEE2E2` (background)
     - `--color-info`: `#2563EB` (border/text), `--color-info-subtle`: `#EFF6FF` (background)
  3. **Elevation & Surface Separation:** Standardize card borders and drop shadows (`--shadow-sm`, `--shadow-md`) to avoid hardcoded borders (`border: '1.5px solid #E2E8F0'`).
- **Application to GardenMitra:**
  Enrich `src/index.css` with these semantic variables and replace repetitive inline styles with reusable classes (`.stat-badge`, `.card-header`, `.metric-card`).

---

### 2.3 Mobile Navigation Architecture (Material Design 3 & iOS HIG)
- **Primary Sources:**
  - Material Design 3 Navigation Bar Specification (`https://m3.material.io/components/navigation-bar/overview`).
  - Apple Human Interface Guidelines — Tab Bars (`https://developer.apple.com/design/human-interface-guidelines/tab-bars`).
- **Problem Addressed in GardenMitra:** All 13 application tabs are currently squeezed into the mobile bottom bar, causing buttons to collapse to 28.8px width, violating the 44px touch target minimum and truncating labels (`FIND-NAV-01`).
- **Key Architectural Lessons:**
  1. **Strict 3–5 Destination Rule:** Mobile navigation bars should never contain more than 5 destinations. When an application has more than 5 top-level sections, the 5th destination must be a "More" trigger.
  2. **Ergonomic Thumb-Zone Layout:** Primary daily actions should reside on the bottom bar:
     - **Tab 1: Today** (Daily routine, soil check, watering, ~8-minute garden tasks)
     - **Tab 2: My Garden** (Spaces, containers, plant inventory)
     - **Tab 3: Care** (Adaptive care planner, weather advisories)
     - **Tab 4: Doctor** (Contextual plant health diagnostics)
     - **Tab 5: More (Menu)** (Opens clean bottom sheet/drawer)
  3. **"More" Sheet Categories:**
     - *Planning & Design:* Layout Planner, Digital Twin, Capture Studio
     - *Analytics & Growth:* Growth Journal, Insights & Performance, Environment Sensors
     - *Knowledge & Supplies:* Plant Library, Shopping List, Ask Mitra Chat
- **Application to GardenMitra:**
  Refactor `Header.tsx` on viewports $<900\text{px}$ to implement this 5-item model with a slide-over navigation drawer.

---

### 2.4 Resilient Error Boundaries (`react-error-boundary`)
- **Primary Source:** `bvaughn/react-error-boundary` (`https://github.com/bvaughn/react-error-boundary`, MIT).
- **Problem Addressed in GardenMitra:** Lack of React ErrorBoundaries means any unexpected runtime exception unmounts the whole application into a white screen (`FIND-REL-01`).
- **Key Architectural Lessons:**
  1. **Graceful Fallback:** Catch errors via `componentDidCatch` or `getDerivedStateFromError`.
  2. **Contextual Reset:** Allow resetting the error boundary state via an `onReset` callback without requiring a full browser page reload.
  3. **Supportive User Voice:**
     ```tsx
     <div className="error-fallback card">
       <Sprout size={48} color="var(--color-primary)" />
       <h2>Take a breath & touch grass 🌱</h2>
       <p>A small hiccup occurred in the garden interface, but your plants and data are completely safe.</p>
       <button onClick={resetErrorBoundary} className="btn btn-primary">
         Reload This View
       </button>
     </div>
     ```
- **Application to GardenMitra:**
  Implement a lightweight `ErrorBoundary` component and wrap `<AppContent />` and complex subsystems (`DigitalTwinStudio`, `GardenCaptureStudio`).

---

### 2.5 Accessible Toast Notifications (Radix Toast & Sonner)
- **Primary Source:** Radix UI Toast / Emil Kowalski's Sonner (`https://github.com/emilkowalski/sonner`, MIT).
- **Problem Addressed in GardenMitra:** 10 core interactions invoke blocking `window.alert()`, pausing the UI and presenting an inaccessible experience (`FIND-A11Y-02`).
- **Key Architectural Lessons:**
  1. **Non-Blocking Feedback:** Render a fixed notification viewport:
     ```html
     <div class="toast-container" role="region" aria-label="Notifications" aria-live="polite">
     ```
  2. **Auto-Dismissal:** Automatically remove toasts after 4,000 ms, with an explicit close button for mouse and keyboard users.
  3. **Categorized Variants:** `success` (green), `info` (blue), `warning` (amber), `error` (red).
- **Application to GardenMitra:**
  Implement `ToastContext` and `useToast()` hook, completely eliminating all 10 `window.alert()` calls in `TodaysGardenView`, `GardenPerformanceView`, `MyGardenDashboard`, etc.

---

### 2.6 Code Splitting & Performance Optimization (Vite & Rollup)
- **Primary Source:** Vite Documentation — *Building for Production: Chunking & Dynamic Imports* (`https://vitejs.dev/guide/build.html`).
- **Problem Addressed in GardenMitra:** Eager static imports in `App.tsx` bundle all 17 screens into a monolithic 960 kB JavaScript file, triggering Vite's $>500\text{ kB}$ build warning (`FIND-PERF-01`).
- **Key Architectural Lessons:**
  1. **Dynamic Route Imports:**
     ```tsx
     const DigitalTwinStudio = React.lazy(() => import('./components/DigitalTwinStudio'));
     const GardenCaptureStudio = React.lazy(() => import('./components/GardenCaptureStudio'));
     const GardenPerformanceView = React.lazy(() => import('./components/GardenPerformanceView'));
     const GardenDoctorView = React.lazy(() => import('./components/GardenDoctorView'));
     ```
  2. **Suspense with Calming Skeleton:**
     ```tsx
     <Suspense fallback={<ScreenLoadingSkeleton />}>
       {renderActiveScreen()}
     </Suspense>
     ```
  3. **Vendor Manual Chunking in `vite.config.ts`:**
     ```ts
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             'vendor-react': ['react', 'react-dom'],
             'vendor-icons': ['lucide-react']
           }
         }
       }
     }
     ```
- **Application to GardenMitra:**
  Reduces initial bundle entry from 960 kB to $<250\text{ kB}$, dramatically speeding up initial load on mobile networks.

---

### 2.7 State Decoupling & Context Slicing
- **Primary Source:** Kent C. Dodds — *How to use React Context effectively* (`https://kentcdodds.com/blog/how-to-use-react-context-effectively`).
- **Problem Addressed in GardenMitra:** Monolithic 2,929-line `GardenContext` couples 14 domains, triggering cascading re-renders across all components on any minor state update (`FIND-ARCH-01`).
- **Key Architectural Lessons:**
  1. **Separate Infrequently-Changing State from High-Frequency State:** Active navigation tab (`activeTab`) changes frequently, whereas garden profile and spaces change rarely.
  2. **Facade Pattern for Backward Compatibility:** Keep `useGarden()` as the primary consumer hook, but compose it from smaller slice hooks (`useNavigationState()`, `useSpaceState()`, `useCareTaskState()`).
  3. **Memoization:** Wrap context values in `useMemo` so that consumers only re-render when their specific data slice mutates.
- **Application to GardenMitra:**
  Extract navigation state and doctor diagnosis state into modular slices in M19.2 while maintaining 100% backward compatibility for all existing tests.

---

### 2.8 Open-Source Repository Governance (GitHub Actions)
- **Primary Source:** GitHub Actions Starter Workflows (`https://github.com/actions/starter-workflows`, MIT).
- **Problem Addressed in GardenMitra:** Missing `.github/` folder; zero automated CI validation on pull requests (`FIND-OSS-01`).
- **Key Architectural Lessons:**
  1. **Automated CI Matrix:** Run on `push` to `main` and all `pull_request` events:
     - Node.js 18.x and 20.x
     - Steps: `npm ci`, `npm run build` (type-check + vite build), `npm test` (vitest run).
  2. **Issue Templates:** YAML-based GitHub issue forms for Bug Reports and Feature Suggestions.
  3. **Contribution Guidelines:** `CONTRIBUTING.md` detailing code style, branch naming, and testing standards.
- **Application to GardenMitra:**
  Add `.github/workflows/ci.yml` and governance documents in Milestone 19.2.
