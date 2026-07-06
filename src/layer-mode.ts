import type { LayerLike, LayerTargets, RuntimeCollectionLike, WebSceneLike } from "./scene-runtime-types";

const GAUSSIAN_SPLAT_LAYER_TITLE = "Malbork_GUGiK_GaussianSplat";
const INTEGRATED_MESH_LAYER_TITLE = "Malbork_GUGiK_3Dmesh";

export type LayerMode = "mesh" | "splat";

function toArray<T>(collection: RuntimeCollectionLike<T> | readonly T[] | null | undefined): T[] {
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

function normalizeLayerIdentity(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase();
}

function layerMatches(layer: LayerLike, title: string, allowedTypes: string[]): boolean {
  const normalizedTitle = normalizeLayerIdentity(layer.title);
  const normalizedType = normalizeLayerIdentity(layer.type || layer.declaredClass);

  return normalizedTitle === normalizeLayerIdentity(title) && allowedTypes.some((type) => normalizedType.includes(type));
}

export function resolveLayerTargets(map: WebSceneLike | null | undefined): LayerTargets | null {
  const allLayers = toArray(map?.allLayers);
  const splatLayer = allLayers.find((layer) => layerMatches(layer, GAUSSIAN_SPLAT_LAYER_TITLE, ["gaussian-splat", "gaussiansplat"]));
  const meshLayer = allLayers.find((layer) =>
    layerMatches(layer, INTEGRATED_MESH_LAYER_TITLE, ["integrated-mesh", "integratedmesh", "mesh"]),
  );

  if (!splatLayer || !meshLayer) {
    return null;
  }

  return {
    mesh: meshLayer,
    splat: splatLayer,
  };
}

export function applyLayerModeToTargets(targets: LayerTargets, layerMode: LayerMode): void {
  targets.mesh.visible = layerMode === "mesh";
  targets.splat.visible = layerMode === "splat";
}