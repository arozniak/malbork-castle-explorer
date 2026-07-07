import type { LayerMode } from "./layer-mode";
import { resolveLayerTargets } from "./layer-mode";
import type { SlideModel } from "./slide-model";
import type { LayerTargets, RuntimeCollectionLike, SceneViewLike, WebSceneLike } from "./scene-runtime-types";

export type ReapplyLayerMode = () => void;

export function toArray<T>(collection: RuntimeCollectionLike<T> | readonly T[] | null | undefined): T[] {
  if (!collection) {
    return [];
  }

  if (Array.isArray(collection)) {
    return [...collection];
  }

  const runtimeCollection = collection as RuntimeCollectionLike<T>;

  if (typeof runtimeCollection.toArray === "function") {
    return runtimeCollection.toArray();
  }

  if (runtimeCollection[Symbol.iterator]) {
    return Array.from(runtimeCollection as Iterable<T>);
  }

  return [];
}

export function waitForAnimationFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

export async function applySlideToSceneView(
  sceneView: SceneViewLike,
  activeSlide: SlideModel,
  reapplyLayerMode: ReapplyLayerMode,
  animate: boolean,
): Promise<void> {
  const sourceSlide = activeSlide.slide;
  const applySlideToView = typeof sourceSlide?.applyTo === "function" ? sourceSlide.applyTo.bind(sourceSlide) : null;

  if (applySlideToView) {
    const slideApplyPromise = applySlideToView(sceneView);

    reapplyLayerMode();
    await waitForAnimationFrame();
    reapplyLayerMode();

    await slideApplyPromise;
    return;
  }

  if (activeSlide.viewpoint) {
    await sceneView.goTo(activeSlide.viewpoint, { animate });
  }
}

export function refreshLayerTargetsAfterSlide(
  scene: WebSceneLike | null | undefined,
  currentLayerMode: LayerMode,
): { nextTargets: LayerTargets | null; showLayerSwitch: boolean } {
  const nextTargets = resolveLayerTargets(scene ?? null);

  if (nextTargets) {
    nextTargets.mesh.visible = currentLayerMode === "mesh";
    nextTargets.splat.visible = currentLayerMode === "splat";
  }

  return {
    nextTargets,
    showLayerSwitch: Boolean(nextTargets),
  };
}