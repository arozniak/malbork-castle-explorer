import type { SlideModel } from "./slide-model";
import type { RuntimeCollectionLike, SceneViewLike } from "./scene-runtime-types";

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
  animate: boolean,
): Promise<void> {
  const sourceSlide = activeSlide.slide;
  const applySlideToView = typeof sourceSlide?.applyTo === "function" ? sourceSlide.applyTo.bind(sourceSlide) : null;

  if (applySlideToView) {
    await applySlideToView(sceneView);
    return;
  }

  if (activeSlide.viewpoint) {
    await sceneView.goTo(activeSlide.viewpoint, { animate });
  }
}
