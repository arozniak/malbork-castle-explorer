# Project Decisions

- The project is a Vite + React + TypeScript application generated from the official ArcGIS CLI scaffold and then customized for the Malbork Castle experience.
- Project documentation lives in the lowercase [documentation/](documentation) folder at the workspace root.
- The app binds directly to the public Malbork Web Scene item `a032056172494a81a2105ef9232ea9a9`.
- The web scene `presentation.slides` collection is the source of truth for navigation order and per-location scene state.
- The app uses Calcite for shell-level UI composition together with ArcGIS Map Components.
- The current experience is mesh-based only; the earlier mesh versus Gaussian splat switching experiment is not part of the product surface.
- No authentication flow is included.
- The desktop experience includes a top segmented navigation rail, guided-tour control, scene overlay text, an About panel, styled zoom and compass controls, and a first-visit navigation onboarding dialog.
- Mobile uses portrait-first behavior, previous and next location navigation, and no desktop onboarding or map controls.
- Intro text is derived from slide descriptions using sentence-aware splitting. On desktop and tablet it keeps a longer intro excerpt, while on mobile it uses a single-sentence intro and moves the remaining text into the expandable content.
- Slide selection is applied through the source ArcGIS slide object where available so that viewpoint, focus areas, and other saved slide state are preserved together.
- Guided tour behavior always starts from the currently active slide, pauses on user interaction, and stops automatically at the final slide.

## Documented `@arcgis/core` Usage

- Current direct `@arcgis/core` usage is limited to geometry and spatial-reference helpers required for guided-tour orbit motion.
- That usage exists to normalize points, perform spatial-reference conversion, and compute the orbit camera path around the active slide focus area.
- No equivalent Map Components-only API was identified for these tour-motion calculations, so this remains a documented exception to the Map Components-first rule.

## Implementation References Used

- Guided tour motion and scene behavior:
	https://developers.arcgis.com/javascript/latest/components/
	https://developers.arcgis.com/javascript/latest/scenes-3d/
- Slide-driven scene state restoration and Web Scene workflows:
	https://developers.arcgis.com/javascript/latest/
	https://developers.arcgis.com/javascript/latest/get-started/
- Map Components integration surface:
	https://developers.arcgis.com/javascript/latest/components/
	https://developers.arcgis.com/javascript/latest/references/map-components/
