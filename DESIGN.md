# Design System Document: The Quiet Architect

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Sanctuary"**

This design system is built to counter the "noise" of modern productivity software. Rather than a rigid, spreadsheet-like interface, we are creating an editorial workspace that feels like a high-end physical studio. The goal is "The Digital Sanctuary"—a space where the UI recedes into the background, allowing the user's work to take center stage.

We achieve this through **Atmospheric Depth**. By utilizing the "Midnight Emerald" palette as an anchor of stability and the "Soft Slate" as a breathable canvas, the interface avoids the cluttered appearance of traditional SaaS. We break the "template" look by favoring intentional asymmetry, generous white space (inspired by Swiss minimalist print design), and tonal transitions rather than structural lines.

---

## 2. Colors & Tonal Logic

### The Palette
The core of this system is the interplay between the deep, intellectual weight of **Primary (#003527)** and the airy, focus-inducing **Surface (#F7F9FB)**.

*   **Primary (Midnight Emerald):** Use `primary_container` (#064E3B) for the most significant structural anchors (sidebars, primary navigation).
*   **Secondary (Emerald Accent):** Use `secondary` (#006C49) for focused actions and success states.
*   **Tertiary (Slate/Charcoal):** Use `tertiary` (#242F41) for supporting UI elements that require a neutral, professional tone.

### The "No-Line" Rule
**Explicit Instruction:** You are prohibited from using 1px solid borders to section off the interface. Standard grids feel "trapped." Instead, define boundaries through:
*   **Background Shifts:** Transition from `surface` to `surface_container_low` to denote a new section.
*   **Tonal Transitions:** Use subtle shifts in value to create logical groupings.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, fine-paper layers. 
1.  **Base:** `surface` (#F7F9FB).
2.  **Sectioning:** `surface_container_low` (#F2F4F6) for secondary modules.
3.  **Active Focus:** `surface_container_lowest` (#FFFFFF) for the actual document or task area to make it "pop" as the highest point of focus.

### The "Glass & Gradient" Rule
To inject "soul" into the digital environment:
*   **Floating Navigation:** Use `surface_container_lowest` with an 80% opacity and a `24px` backdrop-blur to create a frosted-glass effect.
*   **CTAs:** Apply a subtle linear gradient from `primary` (#003527) to `primary_container` (#064E3B) to provide a tactile, premium depth that flat colors lack.

---

## 3. Typography
We utilize **Inter** as a singular typeface, relying on extreme scale and weight contrast to establish hierarchy rather than multiple fonts.

*   **Display & Headline:** Use `display-md` (2.75rem) with `on_surface` (#191C1E) for high-impact editorial moments. These should have generous tracking (-0.02em) to feel tight and custom.
*   **Body:** `body-lg` (1rem) is your workhorse. Ensure a line height of 1.6 for maximum focus and "calm" reading.
*   **Labels:** Use `label-md` (0.75rem) in `on_surface_variant` (#404944) for metadata. These should be set in All Caps with +0.05em letter spacing to provide a sophisticated, architectural feel.

---

## 4. Elevation & Depth

### The Layering Principle
Forget shadows as a default. Use **Tonal Layering**. Place a `surface_container_lowest` card on a `surface_container_low` background. The difference in brightness creates a "Soft Lift" that feels integrated into the architecture.

### Ambient Shadows
When an element must float (e.g., a modal or dropdown), use **Ambient Shadows**:
*   **Color:** Use a tinted version of `on_surface` at 4% opacity.
*   **Blur:** 32px to 64px. The goal is a shadow so soft it is felt rather than seen.

### The "Ghost Border" Fallback
If a boundary is required for accessibility in high-density areas, use a **Ghost Border**:
*   **Token:** `outline_variant` (#BFC9C3) at **15% opacity**. This creates a suggestion of a container without breaking the flow of the "No-Line" rule.

---

## 5. Components

### Buttons
*   **Primary:** Gradient-filled (Midnight Emerald), `md` (0.75rem) or `lg` (1rem) corners. No border.
*   **Secondary:** `surface_container_highest` background with `on_surface` text.
*   **Tertiary:** Ghost style. No background, no border. Transitions to `surface_container_low` on hover.

### Input Fields
*   **Style:** Background-filled using `surface_container_low`. 
*   **Focus State:** Transition the background to `surface_container_lowest` and apply a 2px `primary_fixed` (#B0F0D6) "inner" shadow. Never use a high-contrast outer border.

### Cards & Lists
*   **Constraint:** No dividers. Use `spacing-8` (2rem) of vertical white space to separate list items, or a subtle `surface_container_low` hover state to define rows.
*   **Asymmetry:** In dashboard views, vary the width of cards (e.g., 60% / 40% split) to create a rhythmic, editorial layout.

### Contextual "Focus" Component
*   **The Focus Bar:** A custom component for this system. A slim, vertical bar using `secondary` (#006C49) placed to the left of the "Active Task" to denote priority without using intrusive badges.

---

## 6. Do's and Don'ts

### Do
*   **DO** use whitespace as a functional tool. If in doubt, add `spacing-6` (1.5rem).
*   **DO** use the `12px` (0.75rem) corner radius consistently to maintain the "Sleek" brand promise.
*   **DO** use `surface_tint` (#2B6954) at very low opacities (3-5%) for large background areas to give the Slate backgrounds a hint of Emerald warmth.

### Don't
*   **DON'T** use pure black (#000000) or pure grey. Use the Charcoal `on_surface` (#191C1E) for all text to maintain the "Midnight" depth.
*   **DON'T** use standard 1px dividers between list items. It creates visual "stutter."
*   **DON'T** use bright, saturated colors for non-action items. The "Calm" atmosphere relies on the dominance of muted, deep greens and slates.