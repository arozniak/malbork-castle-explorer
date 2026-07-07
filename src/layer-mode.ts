import type { LayerLike, LayerTargets, WebSceneLike } from "./scene-runtime-types";
import { toArray } from "./scene-runtime-utils";

const GAUSSIAN_SPLAT_LAYER_TITLE = "Malbork_GUGiK_GaussianSplat";
const INTEGRATED_MESH_LAYER_TITLE = "Malbork_GUGiK_3Dmesh";

export type LayerMode = "mesh" | "splat";

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