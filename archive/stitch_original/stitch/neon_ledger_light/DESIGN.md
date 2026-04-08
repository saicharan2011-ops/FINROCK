# Design System Specification: Editorial Precision

## 1. Overview & Creative North Star: "The Technical Curator"
This design system moves away from the "standard" fintech aesthetic of rigid grids and heavy borders, opting instead for a high-end editorial feel. The Creative North Star, **The Technical Curator**, blends the precision of financial engineering with the airy sophistication of modern architecture. 

We achieve a "signature" look by prioritizing **negative space as a structural element**. By leveraging the technical rigor of *Space Grotesk* against expansive, layered white space, we create a UI that feels intentional, high-fidelity, and premium. The layout should feel like a well-composed gallery—asymmetric where necessary to guide the eye, but always grounded in mathematical balance.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a "Deep Forest" tonal range, moving away from "tech blue" to a more organic, prestigious green.

### Surface Hierarchy & The "No-Line" Rule
To achieve a high-end feel, **1px solid borders are prohibited for sectioning.** Boundaries must be defined through tonal shifts in the background.
- **The Foundation:** Use `surface` (#f8f9fa) for the main canvas.
- **Nesting Depth:** Place `surface_container_lowest` (#ffffff) cards on top of `surface_container_low` (#f3f4f5) sections. This creates a natural "lift" that mimics physical paper without the clutter of lines.
- **Tonal Transitions:** Use `surface_container` (#edeeef) for sidebars or utility panels to create a clear architectural break from the main content area.

### Glass & Gradient Rules
- **Frosted Finishes:** For floating navigation or modal overlays, use `surface` at 80% opacity with a `24px` backdrop-blur. This "Glassmorphism" ensures the UI feels integrated rather than disconnected.
- **Luminous CTAs:** Primary buttons and hero elements should utilize a subtle linear gradient from `primary` (#012d1d) to `primary_container` (#1b4332). This adds "soul" and depth, preventing the deep greens from feeling flat or "muddy."

---

## 3. Typography: Technical Elegance
We utilize a pairing of *Space Grotesk* for technical authority and *Manrope* for human-centric readability.

| Level | Font Family | Token | Role |
| :--- | :--- | :--- | :--- |
| **Display** | Space Grotesk | `display-lg` (3.5rem) | Hero numbers and impact statements. |
| **Headline** | Space Grotesk | `headline-md` (1.75rem) | Section titles. Use tight letter-spacing (-0.02em). |
| **Title** | Manrope | `title-lg` (1.375rem) | Card headers and prominent list titles. |
| **Body** | Manrope | `body-md` (0.875rem) | Standard reading text. High line-height (1.6) for airiness. |
| **Label** | Space Grotesk | `label-md` (0.75rem) | Data points, badges, and all-caps micro-copy. |

**The Typography North Star:** Always contrast a large *Space Grotesk* display number with a small, wide-tracked *Manrope* label. This "Editorial Scale" creates instant hierarchy and a premium feel.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "heavy" for this system. We use light to define space.

- **The Layering Principle:** Depth is achieved by stacking. A `surface_container_highest` element should only ever sit on a `surface_container` or lower. 
- **Ambient Shadows:** When an element must float (e.g., a dropdown), use an extra-diffused shadow: `box-shadow: 0 12px 40px rgba(25, 28, 29, 0.06);`. The shadow must be tinted with the `on_surface` color to feel natural.
- **The "Ghost Border":** If accessibility requires a container boundary, use `outline_variant` at 15% opacity. Never use 100% opaque lines.
- **The Glass Depth:** For mobile navigation bars or headers, use a `surface` tint with a `blur(12px)` to maintain the "Technical Curator" atmosphere while scrolling.

---

## 5. Components: Refined Primitives

### Buttons
- **Primary:** `primary` background with `on_primary` text. Use `xl` (0.75rem) corner radius. Add a subtle inner-glow on hover.
- **Secondary:** `secondary_container` background. These should feel "recessed" into the page.
- **Tertiary:** No background. Bold `primary` text in *Space Grotesk* with a subtle underline that appears only on hover.

### Cards & Lists
- **The "No-Divider" Rule:** Forbid 1px horizontal lines between list items. Instead, use 16px of vertical white space or a 2% color shift on hover (`surface_container_low`).
- **Data Cards:** Use `surface_container_lowest` with a `lg` (0.5rem) radius. Align technical data to the right using `label-md` for a "ticker" feel.

### Input Fields
- **Style:** Understated. Use `surface_container_low` for the fill. No bottom border.
- **Focus State:** Transition the background to `white` and add a 1px "Ghost Border" using `surface_tint`.

### Signature Component: The "Pulse Tile"
A specialized financial data card using a `secondary_container` (soft mint) background with a micro-graph (sparkline) in `primary`. It uses no borders and relies on its background color to stand out against the white canvas.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical layouts. A header that is left-aligned with a data point pushed to the extreme right creates an editorial balance.
*   **Do** favor vertical white space over lines. If a section feels messy, add more padding, don't add a border.
*   **Do** use `secondary_fixed` (#cee9d3) for positive financial trends. It is softer and more premium than a standard "success green."

### Don't
*   **Don't** use pure black for text. Use `on_surface` (#191c1d) to maintain the soft-minimalist contrast.
*   **Don't** use standard Material Design elevations (Level 1, 2, 3). Stick to the **Tonal Layering** rules defined in Section 4.
*   **Don't** use icons that are too heavy. Use "Light" or "Thin" weight stroke icons to match the technicality of *Space Grotesk*.

---

## 7. Spacing Scale
Maintain a strict 8px-based grid, but prioritize "Breathing Room" values:
- **Section Padding:** 64px or 80px.
- **Inter-Component:** 24px or 32px.
- **Micro-Spacing:** 4px, 8px, or 12px for internal label-to-value relationships.