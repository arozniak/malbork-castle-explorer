# Responsive Design Implementation Plan

## Scope

Add explicit mobile and tablet behavior on top of the current desktop-first scene experience while keeping desktop behavior unchanged above 1200px.

## Current Baseline

- The app currently renders one shared overlay structure for all sizes in [src/scene-overlay.tsx](src/scene-overlay.tsx).
- Breakpoint handling is limited to one narrow-screen CSS media query in [src/index.css](src/index.css).
- Map controls are always rendered from [src/App.tsx](src/App.tsx).
- The onboarding dialog is always eligible to render from [src/App.tsx](src/App.tsx) and [src/navigation-onboarding.tsx](src/navigation-onboarding.tsx).
- The current mobile behavior still relies on the desktop tab rail and does not enforce portrait-only usage.

## Proposed Approach

### 1. Introduce explicit viewport modes

Add a small viewport classification layer in [src/App.tsx](src/App.tsx) or a dedicated helper so the UI can branch on three modes:

- Mobile: width < 768px
- Tablet: width >= 768px and width <= 1200px
- Desktop: width > 1200px

Track orientation alongside width so mobile can distinguish portrait from landscape without affecting tablet or desktop.

Rationale:
- The current code is mostly desktop-first and uses one shared overlay tree.
- Mobile requirements change behavior, not only styling, so CSS alone is not the right control point.

### 2. Keep desktop as the untouched baseline

Do not change the current desktop navigation model, onboarding behavior, or map controls for widths above 1200px unless a desktop-only regression requires a local fix.

This means:
- Keep the existing tab rail.
- Keep the existing map controls.
- Keep existing onboarding behavior.
- Keep the current text layout and tour control behavior unless a shared fix is needed for all sizes.

### 3. Add a dedicated mobile navigation variant

For mobile only, replace the tab rail with a simple previous/current/next navigation control rendered in [src/scene-overlay.tsx](src/scene-overlay.tsx) or a small mobile-only child component.

Expected behavior:
- Left arrow moves to the previous slide when available.
- Center label shows the current location title.
- Right arrow moves to the next slide when available.
- Disabled states appear at the first and last slide.
- No horizontal tab scrolling exists on mobile because the tab rail is not used there.

Rationale:
- This directly satisfies the touch-friendly arrow-navigation requirement.
- It avoids squeezing the existing segmented tab rail into an unreliable narrow layout.

### 4. Suppress mobile-only incompatible UI

For mobile only:
- Do not render map controls.
- Do not render the onboarding dialog.
- Keep the info button in the top-right corner.

For tablet:
- Do not render the onboarding dialog.
- Keep the existing tab-based navigation.
- Keep current map controls unless later requested otherwise.

For desktop:
- Preserve current map controls and onboarding behavior unless later requested otherwise.

### 5. Enforce portrait-only mobile handling

For mobile landscape, show a lightweight rotate-device state instead of the normal mobile overlay and interaction surface.

Expected behavior:
- Hide the mobile navigation and text UI while landscape is active.
- Show a minimal message asking the user to rotate back to portrait.
- Resume the normal mobile UI when portrait orientation returns.

Rationale:
- Web apps cannot reliably hard-lock screen orientation across all mobile browsers.
- A landscape guard is the most reliable implementation path.

### 6. Adapt the text region for mobile

Keep the current text-content model but change the mobile layout rules so the text uses most of the available width and expands vertically without covering the play button.

Expected mobile rules:
- Text block width should use nearly the full viewport width with safe side padding.
- Expanded text should scroll vertically only when needed.
- Available text height should be capped relative to the viewport and reserved space below for the tour button.
- Intro and expanded text behavior should remain functionally consistent with desktop.

### 7. Keep tablet close to current desktop behavior

For tablet only:
- Keep the existing tab-based navigation.
- Keep it clickable and visually close to desktop.
- Adjust spacing, font size, and width constraints as needed.
- Avoid introducing the mobile arrow navigation unless testing proves the tab rail is not usable.
- Do not show the onboarding dialog.

### 8. Limit CSS changes to mode-specific layout rules

Update [src/index.css](src/index.css) so breakpoint-specific styles are scoped clearly to mobile and tablet behavior.

Expected focus areas:
- Mobile overlay spacing
- Mobile text width and height caps
- Mobile arrow navigation sizing and touch targets
- Tablet tab spacing and sizing
- Tablet text width tuning
- Landscape guard styling

## Likely Files

- [src/App.tsx](src/App.tsx): viewport mode detection, conditional map controls, onboarding suppression, orientation handling
- [src/scene-overlay.tsx](src/scene-overlay.tsx): conditional mobile navigation vs tablet/desktop tab rail
- [src/index.css](src/index.css): mobile, tablet, and landscape-specific layout rules
- [src/navigation-onboarding.tsx](src/navigation-onboarding.tsx): only if minor API changes are needed for conditional rendering

## Validation Plan

### Desktop

- Confirm widths above 1200px look and behave exactly as they do now.
- Confirm existing tab rail, info button, onboarding, map controls, and play button remain unchanged.

### Tablet

- Confirm widths from 768px through 1200px keep the current tab-based navigation.
- Confirm tabs remain clickable without requiring a separate mobile navigation model.
- Confirm spacing and text sizing remain usable in both portrait and landscape tablet layouts.
- Confirm the onboarding dialog never appears.

### Mobile portrait

- Confirm no map controls render.
- Confirm the info button remains top-right.
- Confirm arrow navigation works through the slide order.
- Confirm text uses most of the available horizontal space.
- Confirm expanded text scrolls only when needed.
- Confirm text never overlaps the play button.
- Confirm the onboarding dialog never appears.

### Mobile landscape

- Confirm the rotate-device state appears consistently.
- Confirm the normal mobile UI resumes when the device returns to portrait.

### Build verification

- Run `npm run build` after implementation.
- Manually test mobile, tablet, and desktop layouts independently in browser responsive mode and, if possible, on real touch hardware.

## Confirmed Decisions

- Mobile landscape should use a rotate-device blocker rather than trying to force orientation at the browser level.
- The onboarding dialog should be hidden on both mobile and tablet.
- The play button remains bottom-center on mobile, and the mobile text area must reserve space above it.
- The mobile center label should show only the current slide title.

## Implementation Order

1. Add viewport-mode and orientation detection.
2. Gate map controls and onboarding by mode.
3. Add the mobile arrow-navigation variant.
4. Apply mobile text-area layout rules and play-button clearance.
5. Tune tablet spacing while preserving the current tab model.
6. Run build and manual breakpoint checks.