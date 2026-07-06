export type SceneElement = HTMLElementTagNameMap["arcgis-scene"];
export type TextValueLike = string | { text?: string | null } | null | undefined;

export interface RuntimeCollectionLike<T> {
	toArray?: () => T[];
	[Symbol.iterator]?: () => Iterator<T>;
}

export interface PointAdapter {
	clone?: () => PointLike;
	latitude?: number | null;
	longitude?: number | null;
	spatialReference?: unknown;
	type?: string;
	x: number;
	y: number;
	z?: number | null;
}

export type PointLike = PointAdapter;

export interface ExtentAdapter {
	center?: PointLike | null;
	spatialReference?: unknown;
	type?: string;
	xmax: number;
	xmin: number;
	ymax: number;
	ymin: number;
	zmax?: number | null;
	zmin?: number | null;
}

export type ExtentLike = ExtentAdapter;

export interface GeometryAdapter {
	center?: PointLike | null;
	extent?: ExtentLike | null;
	spatialReference?: unknown;
	type?: string;
	x?: number;
	y?: number;
	z?: number | null;
	xmax?: number;
	xmin?: number;
	ymax?: number;
	ymin?: number;
}

export type GeometryLike = GeometryAdapter;

export interface CameraAdapter {
	clone?: () => CameraLike;
	fov?: number;
	heading: number;
	position: PointLike;
	tilt: number;
}

export type CameraLike = CameraAdapter;

export interface ViewpointAdapter {
	camera?: CameraLike | null;
	targetGeometry?: GeometryLike | null;
}

export type ViewpointLike = ViewpointAdapter;

export interface FocusAreaLike {
	geometries?: RuntimeCollectionLike<GeometryLike> | null;
	id?: string;
}

export interface FocusAreasLike {
	areas?: RuntimeCollectionLike<FocusAreaLike> | null;
}

export interface SpatialReferenceLike {
	isGeographic?: boolean;
	isWebMercator?: boolean;
	latestWkid?: number;
	wkid?: number;
}

export interface SceneSlideLike {
	applyTo?: (view: SceneViewLike) => Promise<unknown>;
	description?: TextValueLike;
	enabledFocusAreas?: RuntimeCollectionLike<string> | string[] | null;
	id?: string;
	title?: TextValueLike;
	viewpoint?: unknown;
}

export interface LayerLike {
	declaredClass?: string;
	id?: string;
	title?: string;
	type?: string;
	visible?: boolean;
}

export interface LayerTargets {
	mesh: LayerLike;
	splat: LayerLike;
}

export interface WebSceneLike {
	allLayers?: RuntimeCollectionLike<LayerLike> | null;
	focusAreas?: FocusAreasLike | null;
	load?: () => Promise<unknown>;
	presentation?: {
		slides?: RuntimeCollectionLike<SceneSlideLike> | null;
	} | null;
}

export interface SceneViewLike {
	camera: CameraLike;
	goTo: (target: unknown, options?: { animate?: boolean }) => Promise<unknown>;
	height?: number;
	map?: WebSceneLike | null;
	toMap?: (screenPoint: { x: number; y: number }) => PointLike | null | undefined;
	width?: number;
}

type SceneElementWithView = SceneElement & {
	view?: SceneViewLike | null;
};

export function getSceneViewFromElement(sceneElement: SceneElement | null | undefined): SceneViewLike | null {
	return (sceneElement as SceneElementWithView | null)?.view ?? null;
}
