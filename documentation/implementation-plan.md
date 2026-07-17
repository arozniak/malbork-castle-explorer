# Implementation Plan

## Malbork Scene UX Integration

Implement the app around the provided public Web Scene as source of truth, driving tabs from scene slides and adding minimal overlay controls (tabs, expandable text, play/pause tour) while preserving user-first interaction rules so manual input always pauses automation.

## Steps

1. Phase 1 - Scene binding foundation.
2. Replace the static scene setup with `item-id="a032056172494a81a2105ef9232ea9a9"` in the scene component and wait for scene and view readiness before enabling UI state.
3. Read `presentation.slides` from the loaded scene map object, preserving the approved array order exactly: Overview, High Castle, St. Mary's Church, Dansker, Bridge Gate, Grand Master's Palace.
4. Build a simple internal slide data object for each scene slide so the app can work with consistent values: `id`, `title`, `description`, `viewpoint` or camera target, and precomputed text variants (`introText`, `fullText`).
5. Use this default intro rule: show the first 2 sentences if total description length is at least 220 characters, otherwise show the first sentence. Keep this as a configurable constant for easy tuning later.
6. Phase 2 - Primary navigation and text overlay.
7. Treat the UX references as a centered vertical stack: one segmented top rail, text directly below it, and large empty breathing room around both elements.
8. Render the top navigation as one continuous segmented control in a single row, with one shared rounded background track and one active pill inside it. Do not render visually separate standalone chips.
9. Keep the tab rail width fixed to the visual composition on desktop and allow horizontal scrolling only on narrow screens where a single row cannot fit.
10. On tab click, stop auto-tour, set play state to paused, collapse expanded text if needed, and apply the selected web scene slide itself instead of only calling `view.goTo` on its viewpoint.
11. Use the ArcGIS slide object as the authoritative transition payload so viewpoint, visible layers, and enabled focus areas are restored together when a tab is selected.
12. Render text centered below the tabs with no panel chrome, no eyebrow label, and no boxed card. The scene remains visible behind the copy.
13. Add a localized readability veil behind the centered text block: soft blur, subtle brightening or dimming, and a feathered gradient that fades into the scene instead of a hard-edged panel.
14. Collapsed state shows intro text plus `Read more`; expanded state reveals the full text in the same centered region plus `Read less`.
15. Keep the expanded text area height capped so the future play button remains clear below it. Only show a scrollbar when the text actually exceeds that height.
16. While expanded text is open, stop camera motion, disable auto-tour transitions, and preserve the clean centered composition from the reference images.
11. Phase 3 - Auto-tour behavior.
12. Add a bottom-center play and pause control with a circular progress arc and a per-stop timer.
13. Auto-tour loop semantics: start from the current active slide, run a guided reveal animation for about 7 seconds for the current stop, then advance to the next slide after timer completion, and stop automatically at the final slide.
14. Camera motion remains exploratory for the first implementation. Start with one calm generic reveal motion that can be tested across all stops, then refine or replace weak stops with custom per-slide motion only after visual review.
15. Interaction override rules: any click, including scene clicks and UI control clicks, pauses the tour. Clicking play toggles pause and resume. Clicking tabs during the tour immediately stops the tour and switches context.
16. If text is expanded, the tour pauses immediately and play remains blocked until the text is collapsed again.
17. Defer polish and hardening for now.
18. Keep the implementation focused on core experience first.

## Relevant Files

- `c:\Users\agn11392\OneDrive - Esri\Desktop\Malbork_castle_guide\malbork-castle\src\App.tsx` - main composition of scene, segmented tab rail, centered text overlay, play control, and interaction and event wiring.
- `c:\Users\agn11392\OneDrive - Esri\Desktop\Malbork_castle_guide\malbork-castle\src\index.css` - unobtrusive overlay layout, pill tabs, readability veil, text expansion, and play control placement.
- `c:\Users\agn11392\OneDrive - Esri\Desktop\Malbork_castle_guide\malbork-castle\src\main.tsx` - only if a provider or context wrapper is needed for shared UI state.
- `c:\Users\agn11392\OneDrive - Esri\Desktop\Malbork_castle_guide\Documentation\project-decisions.md` - document approved slide-order source and intro-text heuristic.
- `c:\Users\agn11392\OneDrive - Esri\Desktop\Malbork_castle_guide\Documentation\technical-constraints.md` - update with UX behavior constraints for automation override and unobtrusive UI.
- `c:\Users\agn11392\OneDrive - Esri\Desktop\Malbork_castle_guide\Documentation\prompts.md` - append each new prompt unless the user directs otherwise.

## Verification

1. Run `npm run build` in `malbork-castle` after each major phase: tabs and text overlay, and auto-tour.
2. Manual UX checks in the browser.
3. Initial load opens on Overview tab and play is paused by default.
4. Tab click moves to the matching slide, including its focus area and saved layer state, and pauses any running tour.
5. Tabs appear as one continuous single-row segmented control on desktop rather than wrapped standalone pills.
6. The text block is centered below the tabs, uses no hard-edged panel, and keeps the scene visible behind a soft readability veil.
7. Read more expands full text, remains scrollable only when needed, does not cover the play button area, and suspends auto-tour and camera motion.
8. Play starts the reveal motion plus progress arc, advances slide by slide every roughly 7 seconds, pauses on any click, and stops at the final slide.
9. The experience remains consistent across slides without any representation-switch UI.

## Decisions

- Use web scene slide array order as the authoritative tab order.
- Use sentence-aware intro truncation: 2 sentences for long descriptions, otherwise 1, with an adjustable threshold constant.
- Use ArcGIS Map Components as the primary integration surface and rely on view and map object access exposed by `arcgis-scene` where component attributes are insufficient.
- Treat the provided UX images as visual references for implementation: centered pill tabs, warm translucent text overlay, and circular bottom-center play control.
- For phase 2 transitions, apply the selected slide object to the SceneView rather than reusing only its saved viewpoint so focus areas and slide state remain intact.
- Append each new user prompt to `Documentation/prompts.md` unless the user explicitly says otherwise.

## Further Considerations

1. If intro truncation feels too verbose or too short in testing, switch to a strict character clamp such as 200 to 240 characters while keeping sentence-boundary fallback.
2. Drift implementation can start as lightweight periodic `goTo` movement around the current viewpoint and only move to authored per-slide drift offsets if the motion quality is not good enough.
3. Camera motion strategy: treat the first motion pass as experimental, validate one calm generic reveal against all stops, then promote only the weak stops to custom per-slide keyframes after visual review.