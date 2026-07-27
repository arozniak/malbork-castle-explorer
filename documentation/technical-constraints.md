# Technical Constraints

## Historical Bootstrap Constraints

- Initialize the project with the official `npx @arcgis/create` CLI.
- Use the latest stable ArcGIS Maps SDK for JavaScript available from the official CLI template.
- Keep the generated source code unchanged during the initial scaffold step.

These constraints apply only to project bootstrap history and are retained for reference.

## Active Constraints

- The application must remain a 3D scene-based experience built around the public Malbork Castle ArcGIS Web Scene.
- Prefer ArcGIS Map Components as the primary integration surface.
- Use `@arcgis/core` only where Map Components do not provide the required geometry, spatial-reference, or tour-motion capabilities, and document that usage.
- Calcite components may be used for both layout and interactive UI.
- Prefer official ArcGIS documentation, samples, and showcases as implementation references.
- Do not add authentication, OAuth, or sign-in dialogs.
- Keep local setup straightforward: `npm install`, `npm run dev`, and `npm run build` should remain sufficient for standard development and verification.
- Keep the castle scene full-screen and keep UI overlays minimal and unobtrusive.
- User-triggered interactions must override automation state.
- Slide selection must stop the guided tour, and expanded descriptive text must pause or block guided tour playback.
- Descriptive text should remain readable directly over the scene with soft overlay treatment rather than a separate card or side panel.
- Desktop navigation should remain a single-row segmented control near the top of the scene.
- Mobile behavior should use touch-friendly previous and next navigation instead of horizontally scrolling tabs.
- Slide changes must preserve saved slide state, including focus areas and any other state carried by the source slide.
