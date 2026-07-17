# Engineering Review Report

Date: 2026-07-06

Scope reviewed:

- [package.json](package.json)
- [src/main.tsx](src/main.tsx)
- [src/App.tsx](src/App.tsx)
- [src/index.css](src/index.css)
- current build output from `npm run build`

This is a code review report only. No application code was changed as part of this review.

This version is intentionally concise and excludes current bug findings. It focuses on structural engineering risks, maintainability, fragility, and performance.

## Findings

### 1. The main component is carrying too many responsibilities

- Severity: Medium
- Evidence: [src/App.tsx](src/App.tsx) contains the scene bootstrap, slide parsing, text shaping, layer resolution, layer persistence, focus-area resolution, orbit math, animation loop control, interaction overrides, and UI rendering in one file. The file also defines a large local type layer in [src/App.tsx](src/App.tsx#L29) through [src/App.tsx](src/App.tsx#L175).
- Why it matters: This concentration of responsibilities increases the cost of any change. Small UX changes now require touching a file that mixes React state, ArcGIS interop, geometry math, and rendering logic. That encourages regressions because there is no clear seam between scene-domain logic and UI composition.
- Recommendation: Split the file by responsibility. The most valuable extractions would be: `slide-model.ts`, `tour-motion.ts`, and a smaller presentational component for the overlay controls. Keep ArcGIS interop and React orchestration at the edge, not interwoven throughout the main component.

### 2. Hand-written ArcGIS facsimile types reduce type safety and increase drift risk

- Severity: Medium
- Evidence: The code defines many local structural interfaces such as [src/App.tsx](src/App.tsx#L29), [src/App.tsx](src/App.tsx#L57), [src/App.tsx](src/App.tsx#L71), [src/App.tsx](src/App.tsx#L132), and [src/App.tsx](src/App.tsx#L141), then relies on type assertions such as `as SceneSlideLike` and `as SpatialReferenceLike` throughout the orbit and slide logic.
- Why it matters: These interfaces only approximate the ArcGIS runtime objects. They are easy to get subtly wrong and will not automatically evolve when the SDK surface changes. That weakens TypeScript exactly in the most complex part of the app: geometry conversion, slide application, and camera control.
- Recommendation: Prefer official ArcGIS SDK types where possible, even if only as type-only imports. If full SDK typing is too heavy for component-facing code, isolate the custom adapter layer into a small module and keep the number of ad hoc interfaces minimal and well documented.

### 3. Tour motion behavior depends on brittle string matching

- Severity: Medium
- Evidence: Tour behavior is keyed off normalized slide titles in the runtime motion configuration path.
- Why it matters: Scene metadata changes are common in content-driven projects. If a slide title changes in ArcGIS Online, a stop may lose its special motion profile. This is fragile because the failure mode is behavioral, not compile-time.
- Recommendation: Prefer stable identifiers over human-readable titles whenever the scene provides them. If titles must be used, centralize the mapping in a single config structure with explicit validation and a visible error path when required content is missing.

### 4. Tour animation is custom per-frame camera math on the main thread

- Severity: Medium
- Evidence: Each orbit frame computes a new destination point with `geodesicUtils.pointFromDistance` in [src/App.tsx](src/App.tsx#L763), constructs a new `Point` and camera in [src/App.tsx](src/App.tsx#L773), assigns `view.camera` directly in [src/App.tsx](src/App.tsx#L781), and drives the loop with `requestAnimationFrame` in [src/App.tsx](src/App.tsx#L1076). The build also currently warns that some chunks exceed 500 kB after minification.
- Why it matters: This is not necessarily wrong, but it is a performance-sensitive path. On lower-end GPUs/CPUs or when the scene gets heavier, custom per-frame camera and geometry work can become visibly stuttery. The build warning is separate, but it reinforces that the app is already carrying non-trivial client weight.
- Recommendation: Treat tour performance as an explicit test area. Profile the orbit loop on lower-end hardware, consider reducing per-frame allocations, and evaluate whether some computations can be precomputed per stop. Separately, consider code splitting or bundle analysis to address the current build warning.

## Summary

The main engineering concerns are structural rather than functional: a very large multi-responsibility [src/App.tsx](src/App.tsx), a fragile custom type layer around ArcGIS runtime objects, string-based content mapping, and a performance-sensitive custom orbit loop. Those are the places most likely to slow future changes or create maintenance cost as the app grows.

## Implementation Plan For Findings 1 And 2

This plan addresses the two linked issues together because the current size of [src/App.tsx](src/App.tsx) is partly caused by the custom ArcGIS type layer living beside the React component logic. The goal is not a broad rewrite. The goal is to create a small number of explicit module boundaries, move ArcGIS-specific typing and helpers out of the component, and leave [src/App.tsx](src/App.tsx) responsible primarily for React state orchestration and UI composition.

### Target End State

- [src/App.tsx](src/App.tsx) keeps scene wiring, React state, top-level effects, and event handlers, but no longer owns geometry helpers, slide text shaping, or ArcGIS facsimile interfaces.
- [src/scene-runtime-types.ts](src/scene-runtime-types.ts) becomes the single place for ArcGIS runtime type imports, narrow adapter types, and any required runtime guards for map-component interop.
- New modules such as `slide-model.ts` and the existing [src/tour-motion.ts](src/tour-motion.ts) carry domain logic that is currently embedded in [src/App.tsx](src/App.tsx).
- Any remaining type assertions against ArcGIS runtime objects are isolated to a small adapter boundary instead of being spread through orbit, slide, and camera logic.

### Phase 1. Replace The Local ArcGIS Facsimile Type Layer

- Inventory the local interfaces at the top of [src/App.tsx](src/App.tsx) and classify them into two groups: official ArcGIS runtime types that should be imported directly, and true adapter shapes that only exist because the map component surface exposes partial or loosely typed values.
- Populate [src/scene-runtime-types.ts](src/scene-runtime-types.ts) with type-only imports from the ArcGIS SDK for the concrete runtime objects already in use. The likely starting set is `WebScene`, `SceneView`, `Slide`, `Viewpoint`, `Camera`, `Geometry`, `Extent`, `Point`, `SpatialReference`, and scene layer types.
- Move any unavoidable adapter types into [src/scene-runtime-types.ts](src/scene-runtime-types.ts), but keep them intentionally narrow and name them as adapters or guards rather than facsimiles of full ArcGIS classes.
- Replace broad structural interfaces such as `SceneSlideLike` and `SpatialReferenceLike` with official types wherever the SDK already defines the contract.
- Centralize the map-component bridge in one place. For example, if `arcgis-scene` exposes `view` through an element cast, keep that cast and any runtime null checks in a single helper instead of repeating them through the component.
- Exit criteria: [src/App.tsx](src/App.tsx) no longer declares the current ArcGIS-like interface block, and the remaining ArcGIS assertions are isolated to one module or helper boundary.

### Phase 2. Extract Slide And Text Modeling Out Of The Component

- Create `slide-model.ts` to own slide normalization and text shaping. This module should absorb helpers such as sentence splitting, intro-text selection, paragraph grouping, and the `buildSlideModel` logic that currently sits in [src/App.tsx](src/App.tsx).
- Move the `SlideModel` type into that module so the component consumes a stable domain model rather than constructing it inline.
- Keep the module API small: input is an ArcGIS slide plus configuration constants, output is a typed `SlideModel` ready for rendering and motion logic.
- Exit criteria: [src/App.tsx](src/App.tsx) imports `buildSlideModel` and `SlideModel` instead of owning text-processing rules directly.

### Phase 3. Move Tour Geometry And Camera Math To A Dedicated Motion Module

- Consolidate orbit-center resolution, point conversion, spatial-reference handling, tour-stop state building, easing, and per-frame camera updates into [src/tour-motion.ts](src/tour-motion.ts).
- Keep React concerns out of the motion module. The module should accept typed ArcGIS inputs and return motion state or apply a frame, while [src/App.tsx](src/App.tsx) remains responsible for effect timing and lifecycle cleanup.
- Use this extraction to remove the heaviest type assertions from the main component, since this is the part of the code most affected by the current facsimile types.
- Exit criteria: [src/App.tsx](src/App.tsx) retains the tour lifecycle effect, but the geometry and camera implementation details live in [src/tour-motion.ts](src/tour-motion.ts).

### Phase 5. Reduce App.tsx To Orchestration And Presentation

- After the type and helper extractions, simplify [src/App.tsx](src/App.tsx) into four concerns only: scene bootstrap, application state, event wiring, and JSX rendering.
- If the overlay JSX still dominates the file, extract a small presentational component for the controls and text overlay. Keep it dumb: it should receive props and callbacks, not ArcGIS runtime objects.
- Avoid mixing this refactor with behavior changes unless a behavior fix is required to preserve parity. The objective is safer structure and clearer ownership, not a UX redesign.
- Exit criteria: [src/App.tsx](src/App.tsx) becomes substantially shorter and easier to scan, with top-level imports pointing to the extracted modules instead of long local helper blocks.

### Recommended Delivery Sequence

1. Move runtime types and adapter helpers into [src/scene-runtime-types.ts](src/scene-runtime-types.ts).
2. Extract `slide-model.ts` and switch slide parsing to use it.
3. Move orbit and camera math into [src/tour-motion.ts](src/tour-motion.ts).
4. Trim [src/App.tsx](src/App.tsx) and optionally extract a presentational overlay component.

This order is deliberate. It removes type drift first, then peels off the lowest-risk pure logic, then isolates the more stateful tour logic once the typed boundaries are clearer.

### Verification Strategy

- Run `npm run build` after each phase to catch type regressions early.
- After phases 1 and 2, verify that scene load, slide parsing, and intro and expanded text rendering behave exactly as before.
- After phase 3, manually confirm that play and pause, orbit motion, and per-slide transitions still match the current behavior.
- Keep each phase reviewable as a focused change set. If one phase starts mixing multiple concerns, split it again.

### Risks And Constraints

- ArcGIS map components do not always expose strongly typed runtime objects at the element boundary, so a small adapter layer will still be necessary. The improvement target is containment, not absolute elimination of all assertions.
- Tour-motion extraction has the highest regression risk because it combines geometry math, spatial-reference conversion, and animation timing. That step should come only after the type boundary is clearer.
- The empty [src/scene-runtime-types.ts](src/scene-runtime-types.ts) file is the clearest existing seam for this work and should be used rather than introducing another parallel type module.
