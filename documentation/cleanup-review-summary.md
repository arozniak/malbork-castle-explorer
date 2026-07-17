# Cleanup Review Summary

Date: 2026-07-06

Scope reviewed:

- [src/App.tsx](src/App.tsx)
- [src/scene-overlay.tsx](src/scene-overlay.tsx)
- [src/slide-model.ts](src/slide-model.ts)
- [src/tour-motion.ts](src/tour-motion.ts)
- [src/index.css](src/index.css)
- [src/scene-runtime-types.ts](src/scene-runtime-types.ts)
- [README.md](README.md)
- [documentation/implementation-plan.md](documentation/implementation-plan.md)

This review focuses only on cleanup opportunities that were not already covered in the earlier engineering review.

## Findings

### 1. README and review notes should track the current mesh-only product surface

- Category: Obsolete documentation
- Evidence: Earlier review artifacts and README drafts described a representation switch that is no longer in the shipped experience.
- Recommended action: Keep historical prompt history intact, but update current-state docs whenever product scope removes experimental controls.

### 2. The README is still scaffold text, not project documentation

- Category: Obsolete experiments, cleanup opportunities
- Evidence: [README.md](README.md) still describes the generic ArcGIS template, includes the scaffold command, and references `@arcgis/charts-components`, which is not part of the current app.
- Recommended action: Replace [README.md](README.md) with project-specific setup, architecture, and run instructions.

### 3. `toArray` is duplicated across runtime modules

- Category: Duplicate logic
- Evidence: Equivalent `toArray` helpers exist in [src/scene-runtime-utils.ts](src/scene-runtime-utils.ts) and [src/tour-motion.ts](src/tour-motion.ts), and earlier versions also duplicated it inside the app runtime.
- Recommended action: Move this helper into one shared utility module or into [src/scene-runtime-types.ts](src/scene-runtime-types.ts) if that remains the common runtime boundary.

### 4. Slide-application orchestration should stay narrow as features are removed

- Category: Cleanup opportunities
- Evidence: The app has already become simpler after removing representation switching, which is a good signal that slide application concerns should remain focused on scene state and tour orchestration only.
- Recommended action: Continue resisting feature-specific state in [src/App.tsx](src/App.tsx) unless it is part of the durable product surface.

### 5. App still carries a local runtime helper that no longer fits the extracted structure

- Category: Cleanup opportunities
- Evidence: [src/App.tsx](src/App.tsx) still owns `toArray`, `waitForAnimationFrame`, and `applySlideToSceneView` even after most domain logic has been extracted.
- Recommended action: Consider moving these into a small scene-orchestration utility module if App should remain strictly orchestration plus state.

### 6. Progress-ring updates currently have two synchronization paths

- Category: Duplicate logic, cleanup opportunities
- Evidence: [src/App.tsx](src/App.tsx) updates tour progress both through React state (`tourProgress`) and through imperative DOM mutation with `progressRingRef.setAttribute(...)`.
- Recommended action: Decide whether the progress ring should be driven entirely imperatively for animation performance or entirely declaratively through state, then document or simplify that choice.

## No Current Finding

- Unused imports: none found in the current `npm run build` result.
- Unused TypeScript files under `src/`: none found. The extracted modules are all referenced.
- Generated `dist/` output: present locally but not tracked by git, so it is not currently a repository cleanup issue.

## Suggested Order

1. Remove the dead CSS selectors in [src/index.css](src/index.css).
Fixes finding 1.
2. Rewrite [README.md](README.md).
Fixes finding 2.
3. Extract shared helpers to remove the remaining duplication in [src/scene-runtime-utils.ts](src/scene-runtime-utils.ts) and [src/tour-motion.ts](src/tour-motion.ts).
Fixes findings 3, 4, 5, and 6.