---
name: Lumina Lifestyle
colors:
  surface: '#fff8f5'
  surface-dim: '#e9d6cc'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1ea'
  surface-container: '#feeadf'
  surface-container-high: '#f8e4da'
  surface-container-highest: '#f2dfd4'
  on-surface: '#231a13'
  on-surface-variant: '#564337'
  inverse-surface: '#392e27'
  inverse-on-surface: '#ffede4'
  outline: '#897365'
  outline-variant: '#dcc1b1'
  surface-tint: '#944a00'
  primary: '#944a00'
  on-primary: '#ffffff'
  primary-container: '#e67e22'
  on-primary-container: '#502600'
  inverse-primary: '#ffb783'
  secondary: '#006d37'
  on-secondary: '#ffffff'
  secondary-container: '#7bf8a1'
  on-secondary-container: '#007239'
  tertiary: '#b4271d'
  on-tertiary: '#ffffff'
  tertiary-container: '#ff6856'
  on-tertiary-container: '#6a0001'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc5'
  primary-fixed-dim: '#ffb783'
  on-primary-fixed: '#301400'
  on-primary-fixed-variant: '#713700'
  secondary-fixed: '#7efba4'
  secondary-fixed-dim: '#61de8a'
  on-secondary-fixed: '#00210c'
  on-secondary-fixed-variant: '#005228'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4a9'
  on-tertiary-fixed: '#410000'
  on-tertiary-fixed-variant: '#910807'
  background: '#fff8f5'
  on-background: '#231a13'
  surface-variant: '#f2dfd4'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 18px
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.02em
  price-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-padding: 1.25rem
  stack-gap-sm: 0.5rem
  stack-gap-md: 1rem
  card-inner-padding: 1rem
  group-margin-bottom: 1.5rem
---

## Brand & Style

The design system is built for the modern consumer—someone who values organization, clarity, and a soft, approachable aesthetic. The personality is helpful and optimistic, using a "Warm Minimalism" style that prioritizes content legibility while injecting personality through a curated pastel palette.

The visual language is characterized by:
- **Soft Geometry:** High corner radii that evoke a sense of safety and friendliness.
- **Chromatic Organization:** Using color not just for decoration, but as a primary navigational and grouping tool.
- **Depth through Layering:** Subtle usage of glassmorphism for persistent elements (like the total bar) to maintain context without cluttering the viewport.

## Colors

The palette is anchored by a warm, off-white neutral background that reduces eye strain compared to pure white. 

- **Categorical Pastels:** These are functional backgrounds used for grouping items. Each pastel is paired with a high-saturation version of the same hue for iconography and labels to ensure accessibility.
- **Primary Action:** A vibrant orange is reserved for the most important global actions (e.g., Add Item).
- **Text & Hierarchy:** Pure black is avoided in favor of a deep charcoal (#1A1A1A) for headings, with mid-range greys used for secondary metadata and unit prices.

## Typography

The design system utilizes **Plus Jakarta Sans** for its modern, clean, and slightly rounded letterforms that complement the overall soft UI. 

- **Weight as Hierarchy:** Bold weights are used for titles and prices to create immediate scan-points. 
- **Tabular Numbers:** Where possible, ensure price displays use proportional or tabular figures to keep decimal points aligned in lists.
- **Contrast:** Secondary information (like "per kg" or "12 items") uses a lighter font weight and a reduced opacity (approx 60%) to recede behind primary item names.

## Layout & Spacing

This design system uses a **fluid-width model with fixed safe-area margins**. 

- **The 8px Grid:** All spacing is derived from increments of 8px to ensure visual rhythm.
- **Vertical Grouping:** Categories are separated by generous 24px (1.5rem) margins. Within a category, cards are stacked with 8px gaps to show relationship.
- **Safe Zones:** A 20px side margin is maintained on mobile to prevent content from touching the bezel, while the bottom "Total" bar is anchored to the viewport bottom with a floating inset appearance.

## Elevation & Depth

Depth is used sparingly to maintain the clean, "flat-plus" aesthetic.

- **Level 0 (Floor):** The page background.
- **Level 1 (Cards):** Item cards have no shadows; depth is instead communicated through subtle background color fills.
- **Level 2 (Floating UI):** The "Total" bottom bar and the FAB (Floating Action Button) utilize a blur-heavy shadow (0px 10px 30px rgba(0,0,0,0.08)) and backdrop-filtering.
- **Glassmorphism:** The Total bar uses a `saturate(180%) blur(20px)` background to allow the colors of the list to bleed through as the user scrolls, creating a sense of physical layering.

## Shapes

The shape language is "Hyper-Rounded." 

- **Containers:** Item cards use a generous 20px (`1.25rem`) corner radius. This softens the interface and makes the grid feel less rigid.
- **Controls:** Stepper buttons (plus/minus) and the main FAB use circular or pill shapes to distinguish them from content containers.
- **Inputs:** Dropdowns and text fields follow the card radius for consistency.

## Components

### Item Cards
Cards must use the background color corresponding to their category. They feature a two-column layout: title/stepper on the left, unit-price/total-price on the right.

### The "Total" Bar
A persistent floating element at the bottom of the screen.
- **Background:** Semi-transparent white with backdrop-blur.
- **Structure:** Contains a "Bag" icon in a soft-rounded square, a vertical stack for item count/labels, and a large-format price display on the right.

### Quantity Stepper
A neutral, low-contrast component nested within the card. It uses a light-grey background to stay functional without competing with the card's primary color.

### Floating Action Button (FAB)
The primary "Add" action. It is a perfect circle, colored in the system's Primary Orange, positioned in the bottom right, slightly overlapping the Total bar contextually.

### Category Labels
Small-caps or semi-bold labels accompanied by a relevant icon in the same high-saturation color.