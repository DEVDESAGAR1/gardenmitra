# Contributing to GardenMitra 🌱

Welcome! We are excited to build GardenMitra with the open-source gardening community.

GardenMitra exists to bridge the gap between digital gardening guides and real balcony/patio soil:
> **Understand → Take action → Go outside → Care for the real garden.**

---

## 1. Guiding Principles & Architectural Invariants

Before proposing changes, please note our core architectural constraints:

1. **Local-First & Privacy-First:**
   - Garden layout, journal history, notes, and photos belong to the gardener.
   - All persistence is client-side (`LocalStorage` for metadata and state; `IndexedDB` for binary media assets).
   - No user photos or telemetry are sent to cloud services without explicit opt-in.

2. **Zero Paid APIs & Cloud Lock-in:**
   - GardenMitra operates completely offline or with local models (e.g., local Ollama for vision AI).
   - Weather fallback mechanisms and local mock modes ensure the application functions without network access.

3. **Accessibility as a Requirement:**
   - Every interactive control must be reachable and operable via keyboard (`Tab`, `Shift+Tab`, `Space`, `Enter`, `Escape`).
   - Touch targets on mobile must be at least $44 \times 44\text{ px}$.
   - Modals must contain focus and restore focus on exit (`useFocusTrap`).
   - Dynamic buttons and filters must declare semantic states (`aria-pressed`, `aria-checked`).

4. **Honest Botanical Feedback:**
   - Uncertainty in diagnoses and measurements is communicated openly.
   - We never fabricate plant growth rates or fake sensor readings.

---

## 2. Getting Started

### Prerequisites
- **Node.js**: `20.x` or later (LTS recommended)
- **npm**: `10.x` or later

### Installation
Clone the repository and install dependencies with a clean install:
```bash
git clone https://github.com/DEVDESAGAR1/gardenmitra.git
cd gardenmitra
npm ci
```

### Running Locally
Start the development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 3. Verification & Testing

Always verify your changes locally before submitting a Pull Request:

1. **Type Checking:**
   ```bash
   npx tsc --noEmit
   ```
   Must pass with 0 errors.

2. **Automated Tests:**
   ```bash
   npm test
   ```
   All test suites in `src/__tests__/` must pass.

3. **Production Build:**
   ```bash
   npm run build
   ```
   Ensures the Vite bundle succeeds without warnings or circular dependencies.

---

## 4. Code Standards & Style

- **CSS & Design Tokens:** Use semantic CSS variables defined in `src/index.css` (e.g., `var(--color-primary)`, `var(--color-surface)`, `var(--radius-md)`) rather than raw hardcoded hex codes.
- **Components:** Favor focused, domain-specific components with clear prop interfaces.
- **Error Boundaries:** Isolate risky render paths with `ErrorBoundary` to preserve overall application stability.
- **Toasts vs Alerts:** Never use blocking browser `alert()`. Use `useToast()` from `ToastContext` for user notifications.

---

## 5. Submitting a Pull Request

1. Create a feature branch: `git checkout -b feat/my-improvement`
2. Commit with descriptive messages: `git commit -m "feat(a11y): add aria-pressed to category filters"`
3. Push to your fork: `git push origin feat/my-improvement`
4. Open a Pull Request referencing relevant issues or findings.

Thank you for helping gardeners across the world grow their first garden from zero! 🌱
