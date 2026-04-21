# Design System Specification: The Sovereign Ether

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Sovereign Ether."** 

In a landscape of Agentic Web3 and Decentralized Compute, the UI must move beyond simple utility into the realm of "Cryptographic Clarity." We are building for a world where AI agents and Trusted Execution Environments (TEEs) require a visual language that feels both high-security and hyper-fluid. 

This design system breaks the traditional "dashboard" template by utilizing intentional asymmetry, deep tonal layering, and expansive negative space. We treat the interface not as a flat screen, but as a multi-dimensional environment where data "floats" within secure, glass-like volumes.

## 2. Colors & Surface Logic
The palette is rooted in a deep Indigo and Emerald foundation, balanced by high-utility neutrals.

### The "No-Line" Rule
**Explicit Instruction:** Use of 1px solid borders for sectioning is strictly prohibited. Boundaries must be defined solely through background color shifts or subtle tonal transitions. 
- A `surface_container_low` section sitting on a `surface` background provides all the definition needed. 
- Use the `outline_variant` only as a "Ghost Border" (see Section 4).

### Surface Hierarchy & Nesting
Treat the UI as physical layers of stacked material. Use the following tiers to define importance:
- **Base:** `surface` (#f8f9ff) - The foundation.
- **Sectioning:** `surface_container_low` (#eff4ff) - Large structural areas.
- **Content Blocks:** `surface_container` (#e6eeff) - Standard card backgrounds.
- **Interactive/Raised:** `surface_container_highest` (#d9e3f6) - Active states or emphasized content.

### The Glass & Gradient Rule
To achieve an "enterprise-grade" premium feel, floating elements (Modals, Navigation Bars, Hover States) must utilize the **Glass Effect**:
- **Fill:** `rgba(255, 255, 255, 0.7)`
- **Backdrop Blur:** `12px`
- **Signature Gradient:** For primary CTAs, transition from `primary` (#4648d4) to `primary_container` (#6063ee) at a 135-degree angle to provide "visual soul."

## 3. Typography
We use **SF Pro** as our typographic backbone, scaled for an editorial experience.

| Role | Token | Size | Tracking | Weight |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | 3.5rem | -0.02em | Semibold |
| **Headline** | `headline-md` | 1.75rem | -0.02em | Semibold |
| **Title** | `title-md` | 1.125rem | Normal | Medium |
| **Body** | `body-lg` | 1rem | Normal | Regular |
| **Label** | `label-md` | 0.75rem | +0.02em | Bold (Caps) |

**Editorial Intent:** Use `display-lg` for hero moments, allowing text to overlap onto different surface containers. The -0.02em letter-spacing on headings provides a sophisticated "tightness" reminiscent of high-end print magazines.

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering** rather than heavy shadows.

- **The Layering Principle:** Place a `surface_container_lowest` card on a `surface_container_low` background to create a soft, natural lift.
- **Ambient Shadows:** For floating glass elements, use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(18, 28, 42, 0.06);`. The shadow color must be a tint of `on_surface` to mimic natural light.
- **Ghost Borders:** If a border is required for accessibility, it must use `outline_variant` at **20% opacity**. Never use 100% opaque borders.
- **Corner Radii:** Our signature curvature is `xl` (3rem/48px) for major containers and `md` (1.5rem/24px) for standard cards, creating a friendly yet futuristic silhouette.

## 5. Components

### Buttons
- **Primary:** `primary` to `primary_container` gradient. 24px+ padding. 
- **Interaction:** Must use a **Spring Animation** (`stiffness: 300, damping: 20`) on hover/press to mimic physical elasticity.
- **Tertiary:** No background; `on_surface` text with a subtle `surface_variant` hover state.

### Input Fields
- **Styling:** Use `surface_container_low` as the background. No border.
- **Active State:** Transition background to `surface_container_lowest` and add a subtle `primary` glow (2px blur).

### Cards & Lists
- **The Divider Ban:** Never use horizontal lines to separate list items. Use 16px–24px of vertical white space or a slight background shift (`surface_container` vs `surface_container_low`).

### Specialized: Agent Status Orbs
For AI Agent activity, use a 12px orb with a `secondary` (Emerald) outer glow and a "breathing" animation (opacity pulse 0.6 to 1.0).

## 6. Do's and Don'ts

### Do
- **Embrace Asymmetry:** Align high-level stats to the right while headlines remain left-aligned to create a dynamic layout.
- **Use Dynamic Type:** Ensure all text scales beautifully for iOS accessibility.
- **Layer Glass:** Overlay glass navigation over moving gradients or data visualizations to show off the `12px` blur.

### Don't
- **Don't use 1px borders:** It breaks the "Sovereign Ether" immersion.
- **Don't use pure black:** Use `on_surface` (#121c2a) for all high-contrast text.
- **Don't use standard easing:** Linear or basic "ease-in" feels robotic. Always use custom spring curves for a premium feel.