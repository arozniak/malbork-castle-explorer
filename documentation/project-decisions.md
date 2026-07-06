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
- Phase 4 layer selection persists until the user changes it and is reapplied after slide state restores so focus areas still work in both mesh and Gaussian splat modes.
- No authentication flow is included.
- Phase 1 stores a normalized in-app slide model from the loaded scene so later UI work can use consistent slide data.
