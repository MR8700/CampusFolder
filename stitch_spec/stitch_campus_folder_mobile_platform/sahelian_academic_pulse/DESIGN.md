---
name: Sahelian Academic Pulse
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#404942'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#707971'
  outline-variant: '#bfc9c0'
  surface-tint: '#226b47'
  primary: '#004328'
  on-primary: '#ffffff'
  primary-container: '#0d5c3a'
  on-primary-container: '#8ad2a7'
  inverse-primary: '#8ed6aa'
  secondary: '#a73a00'
  on-secondary: '#ffffff'
  secondary-container: '#fd651e'
  on-secondary-container: '#571a00'
  tertiary: '#00422b'
  on-tertiary: '#ffffff'
  tertiary-container: '#005c3e'
  on-tertiary-container: '#49da9f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a9f3c5'
  primary-fixed-dim: '#8ed6aa'
  on-primary-fixed: '#002111'
  on-primary-fixed-variant: '#005232'
  secondary-fixed: '#ffdbce'
  secondary-fixed-dim: '#ffb599'
  on-secondary-fixed: '#370e00'
  on-secondary-fixed-variant: '#7f2b00'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  price-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '800'
    lineHeight: 22px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style
This design system anchors academic excellence and peer-to-peer knowledge sharing in a digital West African context, scaling effortlessly worldwide. The visual tone bridges institutional trust with student hustle: ambitious, energetic, reliable, and deeply functional.

The aesthetic follows an **Elevated Modern** philosophy:
- Clean card-driven architecture engineered for high information density without visual clutter.
- Tactile, refined affordances calibrated for one-handed mobile navigation under harsh outdoor sunlight.
- Crisp status badges and polymorphic media indicators that allow students to immediately parse resource formats (PDF, audio notes, video explanations, WhatsApp study circles, exam answers).
- High visual contrast that ensures readability across varied mobile screen panels, preserving battery life and data responsiveness.

## Colors
The color architecture reflects growth, academic validation, and student micro-economies:

- **Primary (`#0D5C3A` - Deep Sahel Emerald):** Anchors navigation bars, key headers, verified educator badges, and primary commitment actions. Conveys scholastic prestige and institutional grounding.
- **Secondary (`#EA580C` - Warm Solar Amber/Orange):** Dedicated strictly to transactional dynamics: FCFA pricing, Orange Money/Moov Money paywalls, wallet balances, unlock prompts, and high-urgency notifications.
- **Tertiary (`#10B981` - Vibrant Emerald Mint):** Used for micro-success states, downloaded offline indicators, peer endorsements, and active progress rings.
- **Neutral Surface & Text (`#0F172A` - Dark Slate):** Delivers crisp typographic contrast on pure white canvas (`#FFFFFF`) and warm neutral sub-surfaces (`#F8FAFC`, `#F1F5F9`). Avoids pitch black for natural optical comfort during late-night study sessions.

### Polymorphic Media Format Tokens
- **PDF Document:** Canvas `#FEE2E2`, Foreground `#DC2626`
- **Video Lecture:** Canvas `#EDE9FE`, Foreground `#7C3AED`
- **Audio Note / Podcast:** Canvas `#E0F2FE`, Foreground `#0284C7`
- **Corrigé / Exam Answer:** Canvas `#ECFDF5`, Foreground `#059669`
- **Study Group / WhatsApp Bridge:** Canvas `#DCFCE7`, Foreground `#15803D`

## Typography
Plus Jakarta Sans provides a contemporary, geometric sans-serif posture with humanist warmth. Its wide apertures and crisp vertex joins maintain superior legibility at small sizes on high-density smartphone screens.

- **Headlines:** Use `700` and `800` weights with negative letter-spacing for sharp, magazine-grade academic punch.
- **Numbers & Monetary Values:** Utilize tabular numeric alignments (`font-variant-numeric: tabular-nums`) for FCFA pricing and transaction streams to guarantee vertical balance.
- **Micro Labels:** Render badge texts and media flags using `label-sm` with explicit uppercase casing and expanded tracking (+0.04em) to avoid optical blur.

## Layout & Spacing
A fluid 4-column layout governs mobile screens (<640px), evolving into an 8-column layout for tablets and a 12-column layout for desktop admin views.

- **Mobile Viewport Discipline:** Outer screen margins remain fixed at `1rem` (16px) to maximize horizontal real estate for folder cards, split resource rows, and horizontal filter chips.
- **Rhythm Engine:** All padding and internal spacing follow a strict 4px/8px sub-grid. Internal component grouping uses `space-xs` (4px) and `space-sm` (8px). Structural separation between logical cards utilizes `space-lg` (16px) to `space-xl` (24px).
- **Sticky Interaction Zones:** Bottom sheets, purchase drawers, and primary filters stick to the bottom screen zone with an automatic `env(safe-area-inset-bottom)` buffer.

## Elevation & Depth
Visual separation avoids heavy skeuomorphism, relying instead on structural **low-contrast outlines paired with ambient, tinted micro-shadows**:

- **Ground Level (`0dp`):** Surface background `#F8FAFC`.
- **Card Level (`1dp`):** Surface `#FFFFFF`, hairline boundary `1px solid #E2E8F0`, diffuse shadow `0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03)`.
- **Raised Interactive Level (`2dp`):** For active dragging items or pressed cards: border `1px solid #CBD5E1`, shadow `0 4px 6px -1px rgba(13, 92, 58, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)`.
- **Floating Navigation & Paywall Drawers (`3dp`):** Border `1px solid rgba(226, 232, 240, 0.8)`, shadow `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)`.
- **Backdrop Frosting:** Sheet overlays use a backdrop-filter blur of `12px` at `rgba(15, 23, 42, 0.4)` to focus user commitment during checkout or preview moments.

## Shapes
Roundedness sits at Level 2 (Rounded), giving interactive components a modern, approachable feel while retaining organizational structure:

- **Base Components (0.5rem / 8px):** Input fields, inline media pills, list items, and standard action buttons.
- **Containers & Folders (`rounded-lg`, 1rem / 16px):** Resource summary cards, download queues, folder modules, and modal sheets.
- **Key Dialogues (`rounded-xl`, 1.5rem / 24px):** Checkout drawers, unlock confirmations, and top-level profile widgets.
- **Pills (9999px):** Filter tags, payment provider tokens, and notification bubbles.

## Components

### Buttons
- **Primary Action (Commitment):** Solid `#0D5C3A` background, text `#FFFFFF`, height 48px, radius 8px, font `label-lg`. Micro-active state: scale `0.98`, background `#0A482E`.
- **Transaction/Monetization:** Solid `#EA580C` background, text `#FFFFFF`, height 48px, contains tabular currency values (e.g., "Débloquer • 500 FCFA").
- **Secondary / Ghost:** Transparent surface with `1px solid #E2E8F0`, text `#0F172A`. Focused state uses `#F1F5F9`.

### Polymorphic Media Badges
Compact, high-visibility indicators placed on folder listings:
- **Format Tag:** 22px height, 6px border radius, padding horizontal `8px`.
- Composed of an iconic glyph (12px) and an uppercase abbreviation (PDF, MP4, AUD, CORR, WPP).
- Color pairing follows media tokens strictly (e.g., WhatsApp: `#DCFCE7` background with `#15803D` typography).

### Resource Cards (The "Campus File" Card)
- Surface `#FFFFFF`, border `1px solid #E2E8F0`, radius 16px, inner padding `16px`.
- **Top Row:** Media format pill + Level/Subject badge (e.g., "L2 Droit") + Bookmark icon.
- **Middle Row:** Document Title (2 lines clamp, `headline-md`), Author avatar, University name.
- **Bottom Row:** Price tag in Solar Amber (or "Gratuit" in Emerald Mint) + Offline availability checkmark icon.

### Form Inputs
- 48px height, radius 8px, background `#FFFFFF`, border `1.5px solid #E2E8F0`, text `body-md` in `#0F172A`.
- Active/Focus: Border transitions to `#0D5C3A` with an ambient glow (`0 0 0 3px rgba(13, 92, 58, 0.15)`).

### Bottom Sheet Monetization Drawer
- Persistent handle bar (36px width, 4px height, `#CBD5E1`, rounded full).
- Details pricing, payout method (Orange Money, Moov Money, Carte), and immediate preview toggle.