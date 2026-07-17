# Malbork Castle Explorer

Malbork Castle Explorer is a full-screen 3D web experience built with React, Vite, ArcGIS Map Components, and Calcite. The application uses an ArcGIS Web Scene as the source of truth and presents slide-driven exploration, descriptive text overlays, and a guided tour mode over the mesh-based castle scene.

## Current Features

- Loads the public Malbork Web Scene `a032056172494a81a2105ef9232ea9a9`.
- Builds the top navigation from the scene presentation slides.
- Shows intro and expanded descriptive text from slide descriptions.
- Supports a guided tour with per-stop progress and orbit motion.
- Keeps user interactions in control: clicks and text expansion pause automation.

## Tech Stack

- React 19
- Vite
- TypeScript
- `@arcgis/map-components`
- `@arcgis/core` for tour geometry and spatial-reference math
- `@esri/calcite-components`

## Project Structure

- [src/App.tsx](src/App.tsx): top-level scene bootstrap, state, effects, and event orchestration.
- [src/scene-overlay.tsx](src/scene-overlay.tsx): presentational overlay UI for tabs, text, and tour control.
- [src/slide-model.ts](src/slide-model.ts): slide normalization and text shaping.
- [src/tour-motion.ts](src/tour-motion.ts): orbit motion, progress math, and camera-frame application.
- [src/scene-runtime-types.ts](src/scene-runtime-types.ts): shared runtime adapter types and scene element bridge.
- [documentation/](documentation): project notes, technical constraints, prompts log, and review documents.

## Run Locally

From the project root:

```bash
npm install
npm run dev
```

Vite will print a local URL, typically `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

The current production build succeeds. Vite still reports a chunk-size warning, which is tracked as a cleanup and optimization follow-up rather than a functional build failure.

## Constraints

- No authentication, OAuth, or sign-in flow.
- ArcGIS Map Components are the preferred integration surface.
- Direct `@arcgis/core` usage is intentionally limited to custom tour-motion and geometry work that Map Components do not cover.
- UI should remain minimal and unobtrusive over the full-screen scene.

## Additional Documentation

- [documentation/technical-constraints.md](documentation/technical-constraints.md)
- [documentation/project-decisions.md](documentation/project-decisions.md)
- [documentation/engineering-review-report.md](documentation/engineering-review-report.md)
- [documentation/cleanup-review-summary.md](documentation/cleanup-review-summary.md)
- [documentation/prompts.md](documentation/prompts.md)
