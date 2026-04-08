# Design System Specification: High-End Fintech Editorial

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Kinetic Vault."** 

In an industry often defined by cold, static grids, this system introduces a high-stakes editorial feel that balances the impenetrable security of a "vault" with the "kinetic" energy of global markets. We move beyond the "template" look by embracing **intentional asymmetry** and **tonal depth**. This is not just a dashboard; it is a professional instrument. We achieve this by layering semi-transparent surfaces, utilizing massive typographic contrasts, and replacing rigid structural lines with sophisticated light-and-shadow play.

## 2. Colors & Surface Architecture
The palette is rooted in a deep, "obsidian" environment, allowing the primary action colors to achieve a radioactive luminescence.

### The Color Logic
- **Primary Action (#85f1ca):** This neon green is the "heartbeat" of the system. It should be used sparingly for high-value interactions (CTAs, success states, active indicators) to maintain its visual punch.
- **Surface Neutrals (#0e0e0e):** The base is a true dark mode. Avoid using pure #000000; instead, use the `surface` token (#0e0e0e) to allow for depth and subtle lighting effects.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning content. Boundaries must be defined solely through background color shifts or tonal transitions.
- To separate a sidebar from a main feed, transition from `surface` (#0e0e0e) to `surface-container-low` (#131313).
- Vertical white space from our spacing scale is the primary separator, not a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of frosted glass.
- **Level 0 (Base):** `surface` (#0e0e0e).
- **Level 1 (Sections):** `surface-container-low` (#131313).
- **Level 2 (Cards/Containers):** `surface-container-highest` (#262626).
- **Glass Floating Layers:** Use `surface-variant` (#262626) at 60% opacity with a `backdrop-filter: blur(20px)`. This creates a premium, high-tech financial "glass" look.

### Signature Textures
Main CTAs and high-impact hero elements must use a **linear gradient** transitioning from `primary` (#85f1ca) to `primary-container` (#43b38f) at a 135-degree angle. This provides a "visual soul" that a flat hex code cannot replicate.

## 3. Typography
Our typography creates an "editorial tension" between bold, technical headers and hyper-legible data.

- **Display & Headlines (Space Grotesk):** This typeface provides a technical, cutting-edge edge. Use `display-lg` (3.5rem) for hero statements to command attention. The wide apertures and geometric shapes signal transparency and modernity.
- **Body & Titles (Manrope):** Chosen for its high legibility in dense financial data. Use `body-md` (0.875rem) for standard text.
- **Visual Hierarchy:** Create drama by pairing `display-md` headlines with `label-sm` (all caps, tracked out +10%) for sub-headers. This "Big-Small" contrast is a hallmark of high-end digital editorial design.

## 4. Elevation & Depth
Depth in this system is achieved through **Tonal Layering**, not structural scaffolding.

- **The Layering Principle:** Instead of a shadow, place a `surface-container-highest` card inside a `surface-container-low` section. The contrast in value provides the necessary lift.
- **Ambient Shadows:** When a floating element (like a modal or 3D asset) requires a shadow, use a large blur (30px+) with low-opacity (6%). The shadow color should be a tinted version of `surface-container-lowest` (#000000) to mimic natural light.
- **The "Ghost Border" Fallback:** If accessibility requires a container boundary, use the `outline-variant` token (#494847) at **15% opacity**. This creates a "glint" on the edge of the glass rather than a heavy border.
- **3D Financial Elements:** Use assets that incorporate the `secondary` (#4dfcde) and `tertiary` (#6cddff) tokens to create a multi-dimensional feel. These elements should "break the container," overlapping edges to create a sense of three-dimensional space.

## 5. Components

### Buttons
- **Primary:** Roundedness: `full`. Background: Gradient (`primary` to `primary-container`). Text: `on-primary` (#005a43).
- **Secondary (Glass):** Roundedness: `full`. Background: `surface-variant` at 20% opacity with 10px backdrop-blur. 
- **Interaction:** On hover, the primary button should have a `primary-fixed` (#85f1ca) outer glow (shadow) with an 8px spread.

### Cards & Lists
- **Layout:** Cards must use `xl` (1.5rem) roundedness to feel modern and approachable.
- **No Dividers:** In lists, never use horizontal lines. Use a `surface-container-high` hover state or simply increase vertical padding to separate items.
- **Glassmorphism:** Use for floating widgets (e.g., a "Quick Trade" panel). Combine a subtle gradient background with a 1px "Ghost Border" at the top edge only to simulate a light source.

### Input Fields
- **Style:** Underline-only or subtle "Surface-low" fills.
- **States:** When active, the label should animate to a `label-sm` and change color to `primary`. Use a `primary` 2px bottom border as the active indicator—this is the only time a stroke is encouraged.

### Additional Signature Components
- **Data Glow Traces:** In charts, the line graph should use the `primary` token with a subtle drop-shadow of the same color to create a "neon pulse" effect.
- **Perspective Cards:** For featured financial products, use a 5-degree skew or slight rotation to break the verticality of the page.

## 6. Do's and Don'ts

### Do
- **Do** use intentional asymmetry. Place a large headline on the left and a floating glass card overlapping a 3D asset on the right.
- **Do** prioritize "Breathing Room." High-end design is defined by what you leave out.
- **Do** use the `primary` color as a "signal" (Interactive elements, successful trends).

### Don't
- **Don't** use 100% opaque, high-contrast borders. It kills the "Kinetic Vault" aesthetic.
- **Don't** use standard "Material Design" blue for links. Stick to the `primary` green or `tertiary` cyan.
- **Don't** crowd the interface. If a screen feels busy, increase the background `surface` area and move secondary actions into a "More" glass menu.
- **Don't** use flat grey shadows. If a shadow is needed, ensure it feels like ambient occlusion within a dark environment.