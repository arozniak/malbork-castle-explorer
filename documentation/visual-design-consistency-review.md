# Visual Design Consistency Review

Date: 2026-07-07

Scope:
- Desktop default state
- Desktop expanded text state
- Desktop window-size behavior across smaller and larger desktop widths
- Source review of [src/scene-overlay.tsx] and [src/index.css]

Overall assessment:

The application already has a clear and appropriate design direction: minimal, cinematic, and scene-first. The warm ivory accent, translucent dark surfaces, and restrained control count support the immersive concept well. The main consistency gap is not the direction itself, but the uneven maturity of the visual system across custom UI, ArcGIS default controls, and desktop resizing behavior.

## Findings

### 1. Native map controls visually conflict with the custom interface

- Category: Inconsistency, visual hierarchy
- Priority: High
- Observation:
  The top-left ArcGIS controls use a bright white default treatment, while the custom navigation, text, play button, and layer switch use a warm translucent palette. This creates two competing UI systems in the same frame.
- Usability concern:
  The map controls draw disproportionate attention because they are higher contrast than the custom controls and sit near the top content area.
- Design debt:
  The interface currently depends on third-party default control styling instead of a unified product-level visual system.
- Recommended improvement:
  Restyle or visually contain the map controls so they share the same material language as the custom controls: darker translucent surfaces, softer contrast, and warmer highlights.

### 2. The top navigation rail becomes less robust on narrower desktop windows

- Category: Inconsistency, usability concern
- Priority: High
- Observation:
  On larger desktop widths, the pill rail is balanced and visually strong. On narrower desktop windows, the long label set pushes the rail toward a horizontal-scroll pattern, but the scrollbar is hidden and there is no clear overflow cue.
- Usability concern:
  Users may not immediately realize there are more tabs available when the rail overflows, especially because the component still appears visually complete.
- Design debt:
  The navigation pattern scales down mechanically, but it does not introduce a desktop-specific overflow strategy for medium-width windows.
- Recommended improvement:
  Preserve the pill language, but define a clearer desktop overflow behavior for medium-width windows: stronger clipping logic, visible continuation cues, or a more deliberate rail sizing rule.

### 3. Text readability is mostly successful, but the type system is under-defined

- Category: Typography, visual consistency
- Priority: Medium
- Observation:
  The main body text reads well overall because of the darkened upper gradient and restrained white color. However, the interface relies on a single generic sans-serif voice with only minor weight and size shifts, so the hierarchy between tabs, body copy, and secondary actions is not as crisp as it could be.
- Usability concern:
  The intro text, expanded text, and text action all feel related, but not clearly systematized. Secondary interactive text such as "Read more" and "Read less" risks being overlooked.
- Design debt:
  The design language has color and material direction, but not a fully articulated typographic system.
- Recommended improvement:
  Define a tighter typographic scale for navigation, body copy, and utility actions while keeping the same restrained tone. The goal should be stronger hierarchy, not more decoration.

### 4. Bottom controls do not yet read as one coordinated control family

- Category: Alignment, component styling
- Priority: Medium
- Observation:
  The play button and the layer-switch chip are individually well designed, but they feel adjacent rather than intentionally related. The play button is a large warm circular primary control, while the chip is a small dark utility pill offset to the far right.
- Usability concern:
  The bottom-right chip can feel detached from the rest of the interaction model, especially on narrower desktop widths where the central and right-side controls read as separate systems rather than a coordinated control zone.
- Design debt:
  The system has primary and secondary controls, but no stronger compositional logic tying them together.
- Recommended improvement:
  Keep the current asymmetry, but refine the relationship through shared baseline logic, clearer spacing rhythm, and slightly stronger visual kinship between the two controls.

### 5. Expanded reading mode introduces visual friction through dual scrolling cues

- Category: Usability concern, component styling
- Priority: Medium
- Observation:
  In expanded mode, the page can show both the browser viewport scroll and the internal text-area scroll. On shorter desktop windows this becomes visually noisy because the text scrollbar, page scrollbar, and lower controls remain visible in the same frame.
- Usability concern:
  Competing scroll affordances make it less obvious what area is currently scrollable and increase perceived clutter in a design that otherwise aims for calm minimalism.
- Design debt:
  The reading state solves content overflow functionally, but the interaction model is not yet fully refined visually.
- Recommended improvement:
  Reduce the perception of multiple scrolling regions. If the internal scroll must remain, make its visual presence more discreet and ensure the reading state feels intentionally staged rather than improvised.

### 6. Vertical spacing rhythm is inconsistent between states

- Category: Spacing, alignment
- Priority: Medium
- Observation:
  The spacing between the tab rail, intro text, expanded paragraphs, text action, and bottom controls changes noticeably between collapsed and expanded states. On shorter or narrower desktop windows, the composition feels more compressed and loses some of its calm pacing.
- Usability concern:
  The interface loses some of its calmness when spacing becomes uneven under stress conditions.
- Design debt:
  Spacing rules appear to be component-local rather than governed by a stronger page-level rhythm.
- Recommended improvement:
  Establish a more explicit vertical spacing system for top navigation, text blocks, and bottom actions across state changes.

### 7. The attribution strip and lower controls compete visually at the bottom edge

- Category: Inconsistency, usability concern
- Priority: Low
- Observation:
  The ArcGIS attribution/footer text remains visible and visually active near the play button and layer-switch chip, especially on shorter desktop windows where the bottom edge becomes denser.
- Usability concern:
  The bottom edge becomes busy and reduces the premium feel of the custom control area.
- Design debt:
  Product UI and platform-required UI are sharing the same edge without clear compositional separation.
- Recommended improvement:
  Increase visual separation between the custom bottom controls and the attribution zone so the branded product controls keep their intended prominence.

### 8. Control materials are close, but not fully standardized

- Category: Component styling, design debt
- Priority: Low
- Observation:
  The tab rail, active tab, play button, and layer-switch chip all use related but slightly different treatments of blur, border strength, elevation, and highlight warmth. They belong to the same family, but not yet to the same exact system.
- Usability concern:
  This does not create confusion, but it weakens the sense of polish.
- Design debt:
  Styling decisions appear to have evolved incrementally per component.
- Recommended improvement:
  Standardize the core material tokens: translucent dark surface, warm highlighted surface, border opacity, shadow depth, and hover lift behavior.

## Priority Summary

### High

1. Unify ArcGIS default control styling with the custom interface.
2. Make the top navigation rail more robust for medium-width desktop windows.

### Medium

1. Define a clearer typographic hierarchy.
2. Make the bottom control cluster feel more intentionally related.
3. Reduce the visual friction of dual scrolling in expanded reading mode.
4. Normalize vertical spacing rhythm across collapsed and expanded states.

### Low

1. Separate the attribution zone more clearly from the bottom action area.
2. Standardize component material tokens for a more finished feel.

## Recommended Direction

The right next step is not a redesign. The product already has a strong atmosphere. The better path is a visual systems pass focused on unification:

1. Align native and custom controls into one material language.
2. Define deliberate behavior for narrower and shorter desktop windows.
3. Formalize typography, spacing, and component token rules so the UI feels intentional in every state.

If those three areas are addressed, the app should retain its current minimal and immersive identity while feeling substantially more cohesive and premium.