# Project Decisions

- The generated app lives in `malbork-castle/` under the workspace root because that is how the CLI scaffold completed.
- No generated files were modified during this step.
- Documentation files are stored in `Documentation/` at the workspace root so the scaffolded app remains unchanged.
- The CLI template selected was `react`.
- The generated template is a Vite + React + TypeScript project according to the scaffolded package metadata.
- The current app uses Calcite for layout as well as ArcGIS UI composition.
- The OAuth helper has been removed so the project no longer includes an authentication entry point.
- The floating scene info panel from the initial 3D conversion has been removed.
- Unused chart-related scaffold leftovers are being removed from the app setup.
- The app now binds directly to the approved Malbork Web Scene item `a032056172494a81a2105ef9232ea9a9` instead of using a static starter camera.
- The web scene `presentation.slides` array order is the authoritative stop order for the UX: Overview, High Castle, St. Mary's Church, Dansker, Bridge Gate, Grand Master's Palace.
- Intro text is derived from slide descriptions using a sentence-aware rule: first 2 sentences for descriptions at least 220 characters long, otherwise first 1 sentence.
- Phase 2 renders custom pill tabs from the normalized slide model and drives camera navigation from the selected slide viewpoint.
- Phase 2 uses a soft in-scene readability overlay instead of a separate side panel for descriptive text.
- The current experience targets the mesh-based scene presentation only; the earlier mesh versus Gaussian-splat representation switch is no longer part of the product surface.
- No authentication flow is included.
- Phase 1 stores a normalized in-app slide model from the loaded scene so later UI work can use consistent slide data.

## Documented `@arcgis/core` Usage

- Current direct `@arcgis/core` usage is limited to `Point`, `geodesicUtils`, and `webMercatorUtils` in [src/App.tsx](src/App.tsx).
- This usage exists only for custom guided-tour orbit math and point normalization: building point instances from runtime geometry, converting between geographic and Web Mercator coordinates, measuring geodesic distance and azimuth from orbit center to camera, and calculating destination points for orbit frames.
- Official ArcGIS Map Components documentation describes components as reusable UI/component surfaces with functionality equivalent to widgets. In that component surface, no geometry-construction API, geodesic helper API, or spatial-reference conversion helper API was identified that could replace these tour-math operations.
- Based on the current codebase and the official Map Components surface reviewed, there is no component-only path for the orbit calculations now implemented in [src/App.tsx](src/App.tsx). The direct `@arcgis/core` imports are therefore documented as a necessary exception to the Map Components-first rule.

## Implementation References Used

- Guided tour motion and camera/orbit approach: official ArcGIS Maps SDK for JavaScript components overview and scene guidance.
	https://developers.arcgis.com/javascript/latest/components/
	https://developers.arcgis.com/javascript/latest/scenes-3d/
- Slide-driven scene state restoration and Web Scene driven navigation: official ArcGIS Maps SDK for JavaScript product documentation and Web Scene based scene workflows.
	https://developers.arcgis.com/javascript/latest/
	https://developers.arcgis.com/javascript/latest/get-started/
- 3D scene capabilities and scene-layer integration context: official ArcGIS Maps SDK for JavaScript reference surface.
	https://developers.arcgis.com/javascript/latest/layers/
- Map Components-first integration surface used by the app shell and scene controls.
	https://developers.arcgis.com/javascript/latest/components/
	https://developers.arcgis.com/javascript/latest/references/map-components/
