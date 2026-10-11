---
name: better-web-ui
description: Create distinctive, production-grade frontend interfaces with strong hierarchy, thoughtful systems, and polished implementation that avoid generic AI aesthetics. Use when the user wants to build or redesign web pages, flows, components, or full app surfaces, or when auditing frontend interfaces.
license: Apache 2.0
metadata:
  argument-hint: "[page, flow, or component]"
---

# Better Web UI

Opinionated UI review and creation guidance for distinctive, production-grade web applications.

## Refactoring UI Operating Model
1. **Start with a feature, not a shell:** Design specific user jobs first.
2. **Establish hierarchy in grayscale:** Structure and grouping before color.
3. **Define systems before details:** Constrained scales for spacing, type, radius, and elevation.
4. **Choose personality through concrete levers:** Type choice, color temperature, border radius.
5. **Polish last:** Motion, depth, subtle micro-interactions only after hierarchy works.

## 5-Dimension Audit Scoring (0-4)
- **Accessibility (A11y):** Contrast >= 4.5:1, semantic landmarks, keyboard focus, ARIA labels.
- **Performance:** Interaction latency, bundle size, render efficiency, layout thrash.
- **Theming & Design Tokens:** Centralized CSS variables, no ad-hoc hardcoded hex values, consistent palette.
- **Responsive Design:** Fluid layouts, touch targets >= 44x44px, no horizontal scroll on 375px mobile.
- **Anti-patterns & Slop Detection:** Eliminating generic SaaS tropes, nested card traps, illegible muted text.
