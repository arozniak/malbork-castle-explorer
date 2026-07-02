# Technical Constraints

- Initialize the project with the official `npx @arcgis/create` CLI.
- Use the latest stable ArcGIS Maps SDK for JavaScript available from the official CLI template.
- Keep the generated source code unchanged for this step.
- Target a 3D scene-based application that will use 3D data in later steps.
- Prefer ArcGIS Map Components first.
- Use `@arcgis/core` only when Map Components are not sufficient, and document the reason when that happens.
- Calcite components may be used for both layout and interactive UI.
- Prefer official ArcGIS documentation, samples, and showcases as references.
- Do not add authentication, OAuth, or sign-in dialogs.
- Keep the first version minimal and easy to test locally.
- Keep the castle scene full-screen and make UI overlays minimal and unobtrusive.
- User-triggered interactions must override automation state; phase 2 tab selection collapses expanded text and leaves auto-tour paused.
- Expanded descriptive text should remain readable over the scene with a soft overlay treatment instead of a separate panel.
- Phase 2 navigation should present as one continuous single-row segmented control centered near the top of the scene.
- Phase 2 slide changes must preserve saved slide focus areas and other slide state, not only camera position.
