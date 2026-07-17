# Technical Constraints Compliance Report

Date: 2026-07-06

Source of truth: [documentation/technical-constraints.md](documentation/technical-constraints.md)

Scope reviewed:

- [package.json](package.json)
- [README.md](README.md)
- [src/main.tsx](src/main.tsx)
- [src/App.tsx](src/App.tsx)
- [src/index.css](src/index.css)
- supporting project notes in [documentation/project-decisions.md](documentation/project-decisions.md)

This review distinguishes between:

- standing implementation constraints that should still be visible in the current codebase
- process or bootstrap constraints that were only intended for the original scaffold step

## Compliant Items

- Official CLI initialization is documented consistently. The constraints require `npx @arcgis/create`, and the repo documentation still reflects that approach in [documentation/technical-constraints.md](documentation/technical-constraints.md#L3), [documentation/prompts.md](documentation/prompts.md#L9), and [README.md](README.md#L22).
- The app is implemented as a 3D scene-based experience. The runtime uses the ArcGIS scene component in [src/App.tsx](src/App.tsx#L1171) and the scene fills the viewport through [src/index.css](src/index.css#L14).
- ArcGIS Map Components are the primary integration surface. The implementation imports and uses `arcgis-scene`, `arcgis-home`, `arcgis-zoom`, and `arcgis-compass` in [src/App.tsx](src/App.tsx#L5) and [src/App.tsx](src/App.tsx#L1171).
- Calcite is used appropriately for layout/UI. The app uses `calcite-shell` in [src/App.tsx](src/App.tsx#L10) and [src/App.tsx](src/App.tsx#L1170).
- No authentication, OAuth, or sign-in flow is present. There are no auth-related runtime imports in the source tree, `popupDisabled` is set on the scene component in [src/App.tsx](src/App.tsx#L1175), and the project notes explicitly confirm the OAuth removal in [documentation/project-decisions.md](documentation/project-decisions.md#L9) and [documentation/project-decisions.md](documentation/project-decisions.md#L18).
- The castle scene remains full-screen and the overlays are minimal/unobtrusive. The full-screen shell/scene styling is in [src/index.css](src/index.css#L1), [src/index.css](src/index.css#L9), and [src/index.css](src/index.css#L14), while the overlay UI remains lightweight in [src/index.css](src/index.css#L34), [src/index.css](src/index.css#L87), [src/index.css](src/index.css#L202), and [src/index.css](src/index.css#L223).
- User-triggered interactions override automation state. Tab clicks stop the tour and collapse expanded text in [src/App.tsx](src/App.tsx#L1105), expanded text pauses the tour in [src/App.tsx](src/App.tsx#L974), and general interaction pauses the running tour in [src/App.tsx](src/App.tsx#L989).
- Expanded descriptive text is rendered over the scene with a soft overlay treatment instead of a separate panel. The veil and overlay treatment are implemented in [src/App.tsx](src/App.tsx#L1185), [src/index.css](src/index.css#L62), and the centered text treatment in [src/index.css](src/index.css#L110).
- Phase 2 navigation is presented as a continuous single-row segmented control centered near the top. The tab rail structure is in [src/App.tsx](src/App.tsx#L1187) and the single-row styling is in [src/index.css](src/index.css#L87).
- Slide changes preserve slide state beyond camera position when the slide object supports it. The code applies the ArcGIS slide object first in [src/App.tsx](src/App.tsx#L269), uses `applyTo` where available in [src/App.tsx](src/App.tsx#L275), and only falls back to `goTo` in [src/App.tsx](src/App.tsx#L290).

## Partially Compliant Items

- The SDK version is on the current `5.1` line, but not on the latest observable patch release today. The repo uses `@arcgis/core` and `@arcgis/map-components` `^5.1.0` in [package.json](package.json#L12), while the official `@arcgis/create` package page currently shows version `5.1.9`. This is close to the documented intent, but not fully aligned with the latest available patch level.
- The constraint to prefer official ArcGIS documentation, samples, and showcases as references is not contradicted anywhere, but it is only weakly evidenced in the repo. The rule is recorded in [documentation/technical-constraints.md](documentation/technical-constraints.md#L10), and the README links official ArcGIS documentation in [README.md](README.md#L40), but there is no review note or implementation note documenting which official references were actually used for key features such as tour motion.
- The requirement to keep the first version minimal and easy to test locally is only partially true in the current codebase. Local testing remains simple through [package.json](package.json#L5) and the runtime surface is still compact, but the app has grown beyond a minimal first-pass scene viewer into a multi-feature experience with custom slide text and tour logic in [src/App.tsx](src/App.tsx).
- The bootstrap constraint to keep generated source code unchanged was likely respected during the initial scaffold step, but it is no longer true of the current repository state. The current implementation is intentionally customized throughout [src/App.tsx](src/App.tsx) and [src/index.css](src/index.css). Because the constraint explicitly says "for this step," this is best treated as a historical process constraint rather than an active defect.

## Non-Compliant Items

- The project uses `@arcgis/core` directly without documenting why Map Components were insufficient, which the constraints explicitly require. Direct imports are present in [src/App.tsx](src/App.tsx#L2), [src/App.tsx](src/App.tsx#L3), and [src/App.tsx](src/App.tsx#L4). The corresponding requirement is in [documentation/technical-constraints.md](documentation/technical-constraints.md#L8). The current repo does not contain a companion note explaining why these geometry utilities and `Point` were necessary for orbit/tour behavior.

## Recommended Actions

- Add a short documentation note explaining the `@arcgis/core` usage. The minimal acceptable note is that Map Components do not expose the geometry helpers needed for the custom orbit/tour camera math, so `Point`, geodesic calculations, and Web Mercator conversion helpers were pulled from `@arcgis/core`.
- Decide whether the SDK packages should be updated from `^5.1.0` to the latest `5.1.x` patch line, then record that decision in project documentation. If the team intentionally stays pinned to the scaffolded versions, document that rationale.
- Mark bootstrap-only constraints more explicitly as historical in [documentation/technical-constraints.md](documentation/technical-constraints.md), especially the "generated source code unchanged for this step" rule, so future compliance reviews do not treat normal implementation work as a failure.
- Add a brief "implementation references used" section to documentation for higher-risk features such as guided tour motion and slide application. That would make the "prefer official ArcGIS references" constraint auditable instead of inferred.

## Summary

The codebase is broadly aligned with the active product-facing technical constraints: 3D scene architecture, Map Components-first integration, no authentication, minimal full-screen overlays, user-overrides-tour behavior, centered segmented navigation, and slide-state preservation are all implemented. The only clear current non-compliance is missing documentation for the direct `@arcgis/core` usage. The other deltas are either process-history constraints or items that are only partially verifiable from the repository.