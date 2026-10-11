---
name: impeccable
description: Use when the user wants to design, redesign, shape, critique, audit, polish, clarify, distill, harden, optimize, adapt, animate, colorize, extract, or otherwise improve a frontend interface. Covers websites, landing pages, dashboards, product UI, app shells, components, forms, settings, onboarding, and empty states. Handles UX review, visual hierarchy, information architecture, cognitive load, accessibility, performance, responsive behavior, theming, anti-patterns, typography, fonts, spacing, layout, alignment, color, motion, micro-interactions, UX copy, error states, edge cases, i18n, and reusable design systems or tokens. Also use for bland designs that need to become bolder or more delightful, loud designs that should become quieter, live browser iteration on UI elements, or ambitious visual effects that should feel technically extraordinary. Not for backend-only or non-UI tasks.
version: 4.5.2
user-invocable: true
argument-hint: "[shape · audit|critique · animate|bolder|colorize|delight|layout|overdrive|quieter|typeset · adapt|clarify|distill · harden|onboard|optimize|polish · init|document|extract|live|generate] [target]"
license: Apache 2.0
---

# Impeccable Design Guidance

This skill provides an award-winning creative director perspective for AI-generated frontend interfaces: production-grade code, peak creativity, clear POV, and exceptional craft.

## Core Principles
1. **The brief wins:** Honor product truth, constraints, audience, and functional purpose.
2. **Hierarchy in grayscale:** Structure and spacing must work in grayscale before color is applied.
3. **Avoid AI tells / anti-patterns:**
   - Overused fonts (Arial, Inter without custom weights/styling, default browser fonts)
   - Purple-to-blue gradients on everything
   - Cards nested inside cards
   - Gray text on colored backgrounds or poor contrast (<4.5:1)
   - Meaningless rounded-square icon tiles above every heading
   - Decorative animations without intent or purpose
4. **Refinement preserves, redesign replaces:** Keep existing functionality, domain facts, and data models intact during review.

## Review Dimensions
- **Visual Hierarchy & Rhythm:** Spacing scale (4/8/12/16/24/32/48px), consistent line-heights, distinct header levels.
- **Color & Contrast:** Semantic palette (primary, success, warning, danger, neutral), tinted neutrals over pure black/gray.
- **Component Consistency:** Predictable borders, radiuses, shadows, padding across cards and interactive widgets.
- **Responsive Behavior:** Graceful degradation across 375px mobile, 768px tablet, and 1280px+ desktop.
- **Edge States:** Explicit loading, empty, error, and stale data indicators.
