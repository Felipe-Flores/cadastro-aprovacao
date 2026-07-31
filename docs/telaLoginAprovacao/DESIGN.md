---
name: Indigo Precision
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8fd'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#464555'
  inverse-surface: '#293040'
  inverse-on-surface: '#edf0ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#4648d4'
  on-secondary: '#ffffff'
  secondary-container: '#6063ee'
  on-secondary-container: '#fffbff'
  tertiary: '#46494a'
  on-tertiary: '#ffffff'
  tertiary-container: '#5e6061'
  on-tertiary-container: '#dadbdc'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#f9f9ff'
  on-background: '#141b2b'
  surface-variant: '#dce2f7'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  button:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-padding: 16px
  gutter: 12px
---

## Brand & Style
The design system is rooted in a **Corporate Modern** aesthetic, prioritizing clarity, efficiency, and professional trust. It is designed for high-utility administrative and SaaS environments where data density must coexist with visual breathing room.

The emotional response is one of "structured calm." This is achieved through a systematic application of whitespace, a focused indigo-centric color palette, and a "soft-functional" interface style that uses subtle borders rather than heavy shadows to define structure. The mobile-first approach ensures that complex workflows remain legible and actionable on smaller screens through rigorous alignment and touch-friendly target areas.

## Colors
The palette is dominated by a vibrant **Indigo** primary, used strategically for the main actions (buttons) and interactive highlights. This is supported by a range of functional grays.

- **Primary:** #4F46E5 (Indigo) – Used for primary CTA buttons, active states, and focus indicators.
- **Surface:** #F9FAFB – A soft gray-white used for page backgrounds to reduce eye strain compared to pure white.
- **Card/Modal:** #FFFFFF – Pure white is reserved for elevated surfaces like modals and input containers to create clear separation from the background.
- **Border:** #E5E7EB – A subtle gray for input fields and structural dividers.
- **Text:** #111827 (Primary) and #6B7280 (Secondary/Muted).

## Typography
This design system utilizes **Inter** for its neutral, highly legible, and systematic qualities. The type scale is intentionally tight to maintain a professional, data-driven feel.

- **Headlines:** Semi-bold weight with tight tracking. Mobile headlines should not exceed 20px to ensure modal titles do not wrap unnecessarily.
- **Labels:** Small caps are used for input field headers to create a clear visual distinction between metadata and user-entered content.
- **Body:** Standardized at 14px for most UI elements to balance density and readability on mobile devices.

## Layout & Spacing
The layout follows a **fluid grid** model optimized for mobile-first delivery. 

- **Grid:** On mobile, use a 4-column layout with 16px side margins. 
- **Rhythm:** An 8px base unit drives all spacing. 16px is the standard padding for containers and modals.
- **Density:** Vertical rhythm is maintained by using 24px spacing between form groups and 8px between a label and its respective input.
- **Safe Areas:** Ensure all bottom-fixed buttons account for mobile OS home indicators with a minimum of 24px bottom padding.

## Elevation & Depth
Depth is communicated through **tonal layers** and soft, wide-dispersion shadows.

- **Base Layer:** The application background uses the Tertiary color (#F9FAFB).
- **Surface Layer:** Modals and cards use pure white with a "Large" shadow (Blur: 20px, Y-Offset: 10px, Color: #000000 at 5% opacity) to feel lifted without appearing heavy.
- **Interactive Layer:** Buttons use a subtle inner glow or a very small drop shadow to indicate pressability.
- **Outlines:** Input fields use 1px solid borders (#E5E7EB) instead of shadows to maintain a clean, "flat-plus" aesthetic.

## Shapes
The shape language is consistently **Rounded**, conveying modern accessibility while remaining structured.

- **Inputs/Buttons:** Use a 0.5rem (8px) radius.
- **Modals:** Use a 1rem (16px) radius for the top corners on mobile "bottom sheets" or all corners for centered dialogs.
- **Icons:** Contained within 40px square housings with 8px radius for consistency.

## Components
- **Buttons:** Primary buttons are solid Indigo with white text. Secondary buttons use a transparent background with a subtle gray border (#E5E7EB) and dark text.
- **Input Fields:** 48px minimum height for touch accessibility. They feature a light gray border that transitions to Indigo on focus. Placeholder text is a soft gray (#9CA3AF).
- **Icons:** Use linear, 20px or 24px icons with a 1.5px stroke weight. Match icon color to the associated text (e.g., Indigo for primary actions, Gray for decorative).
- **Modals:** Mobile modals should function as centered dialogs with a dim, 40% opacity backdrop. 
- **Lists:** User rows should have a minimum height of 64px with a 1px bottom divider to separate entries clearly without adding visual bulk.