# Malbork Castle Explorer

Malbork Castle Explorer is a full-screen 3D web experience built with React, Vite, and ArcGIS Map Components. The application uses an ArcGIS Web Scene as the source of truth and presents slide-driven exploration, descriptive text overlays, and a guided tour mode over the mesh-based castle scene.

## Live App

- GitHub Pages: https://arozniak.github.io/malbork-castle-explorer/

## Current Features

- Loads the public Malbork Web Scene `a032056172494a81a2105ef9232ea9a9`.
- Builds the scene navigation from the presentation slides, with a desktop tab rail and mobile previous/next navigation.
- Shows intro and expanded descriptive text sourced from slide descriptions.
- Supports a guided tour with per-stop progress and orbit motion.
- Keeps user interactions in control: clicks and text expansion pause automation.
- Includes a desktop navigation onboarding dialog and a mobile portrait-orientation notice.
- Adds an in-app About panel plus styled zoom and compass controls on non-mobile viewports.

## Tech Stack

- React 19
- Vite
- TypeScript
- `@arcgis/map-components`
- `@arcgis/core` for tour geometry and spatial-reference math

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

## Acknowledgements

- The source imagery was processed into a 3D mesh by Ashleigh Sier (Esri) using ArcGIS Reality Studio.
- This application was vibe coded with Microsoft Copilot by Agnieszka Rozniak as part of work carried out at Esri R&D Center Zurich.

## Additional Documentation

- [documentation/technical-constraints.md](documentation/technical-constraints.md)
- [documentation/project-decisions.md](documentation/project-decisions.md)
- [documentation/prompts.md](documentation/prompts.md)

Other documents in [documentation/](documentation) are retained as working notes and review history and may contain information that is out of date.
