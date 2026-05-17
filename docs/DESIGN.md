# Design System Document: The Kinetic Monolith

## 1. Overview & Creative North Star
### Creative North Star: "The Precision Instrument"
This design system rejects the "social platform" aesthetic in favor of a high-performance "tool" ethos. We are building the digital equivalent of a calibrated steel plate or a precision-engineered barbell. The experience is defined by **Industrial Brutalism**—where every element has a functional purpose, and beauty is derived from efficiency, not decoration.

To move beyond generic dark mode templates, this system utilizes **intentional asymmetry** and **tonal depth**. We break the standard grid by using heavy typographic anchors and "breathing" negative space, ensuring the UI feels expansive yet focused. The interface does not compete for the lifter’s attention; it waits for their input with absolute clarity.

---

## 2. Colors: Tonal Layering & The "No-Line" Rule
The palette is rooted in deep obsidian tones, designed to minimize distraction in high-intensity environments.

### The "No-Line" Rule
**Borders are prohibited for sectioning.** To achieve a premium, integrated feel, structural boundaries must be defined solely through background shifts.
- Use `surface-container-low` for large section blocks.
- Use `surface-container-highest` for interactive card elements.
- Never use a 1px solid line to separate content; use a 16px or 24px vertical gap instead.

### Surface Hierarchy
Depth is achieved through "Tonal Stacking," mimicking physical layers of material.
- **Base Layer:** `surface` (#101419) – The "floor" of the application.
- **Mid-Level:** `surface-container` (#1C2025) – Primary content housing.
- **Floating/Active:** `surface-container-highest` (#31353B) – Context menus or active input areas.

### The Glass & Gradient Rule
For primary actions and "PR" (Personal Record) moments, utilize **Signature Textures**:
- **CTAs:** Apply a subtle linear gradient from `primary` (#B4C5FF) to `primary-container` (#2563EB) at a 135° angle.
- **Floating Action Buttons (FAB):** Use Glassmorphism—`surface-container-high` at 80% opacity with a 12px backdrop-blur.

---

## 3. Typography: The Editorial Edge
We utilize **Inter** as a variable font to create a hierarchy that feels authoritative and legible under gym lights.

### Metric-First Logic
All weight, rep, and RPE data **must** use `font-variant-numeric: tabular-nums`. This prevents the "jumping" of text when numbers change and ensures columns of data align perfectly for quick scanning.

*   **Display (Display-LG/MD):** Used for massive, unapologetic weight totals. High contrast `on-surface` (#E0E2EA).
*   **Headline (Headline-SM):** For exercise names. Bold weight (700).
*   **Body (Body-MD):** For coaching notes. Regular weight (400) using `on-surface-variant` (#C3C6D7).
*   **Labels (Label-MD):** For "Set", "Reps", "LBS". Always uppercase with 0.05em letter spacing.

---

## 4. Elevation & Depth
In a dark-only system, traditional black shadows are invisible. We use **Ambient Light** and **Material Stacking**.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` background to create a "sunken" or "carved" effect, ideal for data input fields.
*   **Ghost Borders:** Only if accessibility requires a stroke (e.g., input focus), use `outline-variant` (#434655) at 20% opacity. 
*   **High-Glare Strategy:** In gym environments with overhead fluorescent lighting, contrast is king. Ensure all primary interactions maintain a 7:1 contrast ratio. Avoid using pure black (#000000) as it increases glare; the deep charcoal `surface` (#101419) provides a softer, more legible base.

---

## 5. Components: The Powerlifting Toolkit

### Buttons (The "Command" Style)
*   **Primary:** Gradient fill (`primary` to `primary-container`). No border. 48dp height minimum.
*   **Secondary:** `surface-container-highest` fill with `primary` text.
*   **Tertiary:** No fill, `on-surface-variant` text.

### The "Performance" Input
*   **Metrics:** Large-scale inputs for weight. No box; just a thick `outline-variant` bottom-weighted "pedestal" that glows `primary` when active.
*   **Steppers:** For reps, use large 48x48dp +/- touch targets to accommodate shaky, post-set hands.

### Cards & Lists
*   **The "Invisible" Divider:** Use a 12px gap of the `surface` color to separate exercise cards. Never use a line.
*   **PR State:** When a lifter hits a Personal Record, the card gains a subtle 2px inner-glow of `tertiary` (#79DB8D) and a semi-transparent gradient mesh background.

### Micro-interactions
*   **"Done" Set Action:** Upon tapping a set checkbox, the row doesn't just check; the background color should "bleed" from `surface-container` to a muted `tertiary-container` (#117E3B) at 30% opacity from left to right.
*   **"Save" Workout:** A 500ms haptic "thud" (heavy feedback) accompanied by the button expanding slightly before collapsing into a "Saved" state.

---

## 6. Spacing Scale: The 4px Hard Grid
All layout decisions must be divisible by 4.

*   **4px:** Tight grouping (Label to Input).
*   **8px:** Element internal padding.
*   **16px:** Standard gutter between cards.
*   **32px:** Section headers.
*   **64px:** Hero element "breathing room."

---

## 7. Do's and Don'ts

### Do:
*   **Do** use tabular numbers for all numeric data.
*   **Do** use "Surface Stacking" to create hierarchy.
*   **Do** prioritize the "1-Tap" rule: the most likely next action (e.g., adding a set) should be the most prominent visual element.

### Don't:
*   **Don't** use 1px solid borders to separate list items.
*   **Don't** use standard blue (#0000FF); only use the defined `primary-container` (#2563EB) which is tuned for dark-mode legibility.
*   **Don't** use center-alignment for data tables. Keep it left-aligned for speed of reading, except for the "Big Three" total weights.