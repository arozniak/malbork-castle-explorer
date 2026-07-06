import Point from "@arcgis/core/geometry/Point";
import * as geodesicUtils from "@arcgis/core/geometry/support/geodesicUtils";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";

import type { SlideModel } from "./slide-model";
import type {
	CameraLike,
	ExtentLike,
	GeometryLike,
	PointLike,
	RuntimeCollectionLike,
	SceneSlideLike,
	SceneViewLike,
	SpatialReferenceLike,
	ViewpointLike,
} from "./scene-runtime-types";

const TOUR_STOP_DURATION_MS = 10000;
const TOUR_FULL_ROTATION_DURATION_MS = 36000;
const ORBIT_SWEEP_DEGREES = 55;
const FULL_ORBIT_SWEEP_DEGREES = 360;
const MIN_ORBIT_RADIUS = 25;
const TOUR_PROGRESS_CIRCUMFERENCE = 113.1;

export { TOUR_PROGRESS_CIRCUMFERENCE };

export interface TourStopState {
	baseCamera: CameraLike;
	center: PointLike;
	durationMs: number;
	elapsedMs: number;
	geographicCenter: Point;
	heightOffset: number;
	radiusMeters: number;
	slideId: string;
	startedAtMs: number | null;
	startAngle: number;
	sweepDegrees: number;
	tilt: number;
}

export interface TourMotionConfig {
	durationMs: number;
	radiusMultiplier: number;
	sweepDegrees: number;
}

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

function clonePoint(point: PointLike): PointLike {
	if (typeof point.clone === "function") {
		return point.clone();
	}

	return {
		latitude: point.latitude,
		longitude: point.longitude,
		spatialReference: point.spatialReference,
		type: point.type,
		x: point.x,
		y: point.y,
		z: point.z,
	};
}

function isGeographicSpatialReference(spatialReference: SpatialReferenceLike | null | undefined): boolean {
	if (!spatialReference) {
		return false;
	}

	return spatialReference.isGeographic === true || spatialReference.wkid === 4326 || spatialReference.latestWkid === 4326;
}

function isWebMercatorSpatialReference(spatialReference: SpatialReferenceLike | null | undefined): boolean {
	if (!spatialReference) {
		return false;
	}

	const wkid = spatialReference.latestWkid ?? spatialReference.wkid;

	return spatialReference.isWebMercator === true || wkid === 3857 || wkid === 102100 || wkid === 102113;
}

function toPointInstance(point: PointLike): Point {
	if (point instanceof Point) {
		return point;
	}

	return new Point({
		spatialReference: point.spatialReference as SpatialReferenceLike | undefined,
		x: point.x,
		y: point.y,
		z: point.z ?? undefined,
	});
}

function toGeographicPoint(point: PointLike | null | undefined): Point | null {
	if (!point) {
		return null;
	}

	const runtimePoint = toPointInstance(point);
	const spatialReference = runtimePoint.spatialReference as SpatialReferenceLike | null | undefined;

	if (isGeographicSpatialReference(spatialReference)) {
		return runtimePoint;
	}

	if (isWebMercatorSpatialReference(spatialReference)) {
		return webMercatorUtils.webMercatorToGeographic(runtimePoint) as Point;
	}

	return null;
}

function fromGeographicPoint(point: Point, targetSpatialReference: SpatialReferenceLike | null | undefined): Point | null {
	if (isGeographicSpatialReference(targetSpatialReference)) {
		return point;
	}

	if (isWebMercatorSpatialReference(targetSpatialReference)) {
		return webMercatorUtils.geographicToWebMercator(point) as Point;
	}

	return null;
}

function cloneCamera(camera: CameraLike): CameraLike {
	if (typeof camera.clone === "function") {
		return camera.clone();
	}

	return {
		fov: camera.fov,
		heading: camera.heading,
		position: clonePoint(camera.position),
		tilt: camera.tilt,
	};
}

function normalizeHeading(heading: number): number {
	return ((heading % 360) + 360) % 360;
}

function easeInOutSine(progress: number): number {
	return -(Math.cos(Math.PI * progress) - 1) / 2;
}

function getPointFromExtent(extent: ExtentLike | null | undefined): PointLike | null {
	if (!extent) {
		return null;
	}

	if (extent.center && Number.isFinite(extent.center.x) && Number.isFinite(extent.center.y)) {
		return clonePoint(extent.center);
	}

	if (
		!Number.isFinite(extent.xmin) ||
		!Number.isFinite(extent.xmax) ||
		!Number.isFinite(extent.ymin) ||
		!Number.isFinite(extent.ymax)
	) {
		return null;
	}

	const zCandidates = [extent.zmin, extent.zmax].filter(
		(value): value is number => typeof value === "number" && Number.isFinite(value),
	);

	return {
		spatialReference: extent.spatialReference,
		type: "point",
		x: (extent.xmin + extent.xmax) / 2,
		y: (extent.ymin + extent.ymax) / 2,
		z: zCandidates.length > 0 ? zCandidates.reduce((sum, value) => sum + value, 0) / zCandidates.length : null,
	};
}

function getPointFromGeometry(geometry: GeometryLike | null | undefined): PointLike | null {
	if (!geometry) {
		return null;
	}

	if (typeof geometry.x === "number" && typeof geometry.y === "number") {
		return clonePoint(geometry as PointLike);
	}

	if (geometry.center && Number.isFinite(geometry.center.x) && Number.isFinite(geometry.center.y)) {
		return clonePoint(geometry.center);
	}

	if (
		typeof geometry.xmin === "number" &&
		typeof geometry.xmax === "number" &&
		typeof geometry.ymin === "number" &&
		typeof geometry.ymax === "number"
	) {
		return getPointFromExtent(geometry as ExtentLike);
	}

	return getPointFromExtent(geometry.extent);
}

function getGeometryBounds(geometry: GeometryLike | null | undefined): ExtentLike | null {
	if (!geometry) {
		return null;
	}

	if (
		typeof geometry.xmin === "number" &&
		typeof geometry.xmax === "number" &&
		typeof geometry.ymin === "number" &&
		typeof geometry.ymax === "number"
	) {
		return geometry as ExtentLike;
	}

	if (geometry.extent) {
		return geometry.extent;
	}

	if (typeof geometry.x === "number" && typeof geometry.y === "number") {
		return {
			spatialReference: geometry.spatialReference,
			type: "extent",
			xmax: geometry.x,
			xmin: geometry.x,
			ymax: geometry.y,
			ymin: geometry.y,
			zmax: geometry.z,
			zmin: geometry.z,
		};
	}

	return null;
}

function getCombinedGeometryCenter(geometries: GeometryLike[]): PointLike | null {
	if (geometries.length === 0) {
		return null;
	}

	const bounds = geometries
		.map((geometry) => getGeometryBounds(geometry))
		.filter((extent): extent is ExtentLike => extent !== null);

	if (bounds.length > 0) {
		const first = bounds[0];
		const merged = bounds.slice(1).reduce<ExtentLike>(
			(current, extent) => ({
				spatialReference: current.spatialReference ?? extent.spatialReference,
				type: "extent",
				xmax: Math.max(current.xmax, extent.xmax),
				xmin: Math.min(current.xmin, extent.xmin),
				ymax: Math.max(current.ymax, extent.ymax),
				ymin: Math.min(current.ymin, extent.ymin),
				zmax:
					typeof current.zmax === "number" && typeof extent.zmax === "number"
						? Math.max(current.zmax, extent.zmax)
						: current.zmax ?? extent.zmax,
				zmin:
					typeof current.zmin === "number" && typeof extent.zmin === "number"
						? Math.min(current.zmin, extent.zmin)
						: current.zmin ?? extent.zmin,
			}),
			{ ...first },
		);

		return getPointFromExtent(merged);
	}

	const points = geometries
		.map((geometry) => getPointFromGeometry(geometry))
		.filter((point): point is PointLike => point !== null);

	if (points.length === 0) {
		return null;
	}

	const zValues = points
		.map((point) => point.z)
		.filter((value): value is number => typeof value === "number" && Number.isFinite(value));

	return {
		spatialReference: points[0].spatialReference,
		type: "point",
		x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
		y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
		z: zValues.length > 0 ? zValues.reduce((sum, value) => sum + value, 0) / zValues.length : null,
	};
}

function resolveFocusAreaCenter(slide: SceneSlideLike, view: SceneViewLike): PointLike | null {
	const focusAreaIds = toArray(slide.enabledFocusAreas).filter(
		(focusAreaId): focusAreaId is string => typeof focusAreaId === "string" && focusAreaId.length > 0,
	);

	if (focusAreaIds.length === 0) {
		return null;
	}

	const focusAreas = toArray(view.map?.focusAreas?.areas);
	const geometries = focusAreas
		.filter((focusArea) => focusArea.id && focusAreaIds.includes(focusArea.id))
		.flatMap((focusArea) => toArray(focusArea.geometries))
		.filter((geometry): geometry is GeometryLike => geometry !== null && geometry !== undefined);

	return getCombinedGeometryCenter(geometries);
}

function resolveOrbitCenter(slide: SceneSlideLike, view: SceneViewLike): PointLike | null {
	const focusAreaCenter = resolveFocusAreaCenter(slide, view);

	if (focusAreaCenter) {
		return focusAreaCenter;
	}

	const viewpoint = slide.viewpoint as ViewpointLike | null | undefined;
	const targetCenter = getPointFromGeometry(viewpoint?.targetGeometry);

	if (targetCenter) {
		return targetCenter;
	}

	if (typeof view.toMap === "function" && typeof view.width === "number" && typeof view.height === "number") {
		const fallbackCenter = view.toMap({ x: view.width / 2, y: view.height / 2 });

		if (fallbackCenter) {
			return clonePoint(fallbackCenter);
		}
	}

	return view.camera?.position ? clonePoint(view.camera.position) : null;
}

export function getTourMotionConfig(slide: SlideModel): TourMotionConfig {
	const normalizedTitle = slide.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

	if (normalizedTitle === "overview") {
		return {
			durationMs: TOUR_FULL_ROTATION_DURATION_MS,
			radiusMultiplier: 1,
			sweepDegrees: FULL_ORBIT_SWEEP_DEGREES,
		};
	}

	if (normalizedTitle === "high castle") {
		return {
			durationMs: TOUR_FULL_ROTATION_DURATION_MS,
			radiusMultiplier: 1,
			sweepDegrees: FULL_ORBIT_SWEEP_DEGREES,
		};
	}

	return {
		durationMs: TOUR_STOP_DURATION_MS,
		radiusMultiplier: 1,
		sweepDegrees: ORBIT_SWEEP_DEGREES,
	};
}

export function buildTourStopState(
	slide: SceneSlideLike,
	slideId: string,
	motionConfig: TourMotionConfig,
	view: SceneViewLike,
): TourStopState | null {
	const orbitCenter = resolveOrbitCenter(slide, view);
	const currentCamera = view.camera;

	if (!orbitCenter || !currentCamera?.position) {
		return null;
	}

	const geographicCenter = toGeographicPoint(orbitCenter);
	const geographicCameraPosition = toGeographicPoint(currentCamera.position);

	if (!geographicCenter || !geographicCameraPosition) {
		return null;
	}

	const distanceAndAzimuth = geodesicUtils.geodesicDistance(geographicCenter, geographicCameraPosition, "meters");

	const centerZ = orbitCenter.z ?? currentCamera.position.z ?? 0;
	const currentZ = currentCamera.position.z ?? centerZ;
	const derivedRadiusMeters = distanceAndAzimuth.distance;
	const derivedAzimuth = distanceAndAzimuth.azimuth;

	if (!Number.isFinite(derivedRadiusMeters) || typeof derivedAzimuth !== "number" || !Number.isFinite(derivedAzimuth)) {
		return null;
	}

	const startAngle = normalizeHeading(derivedAzimuth);

	return {
		baseCamera: cloneCamera(currentCamera),
		center: orbitCenter,
		durationMs: motionConfig.durationMs,
		elapsedMs: 0,
		geographicCenter,
		heightOffset: currentZ - centerZ,
		radiusMeters: Math.max(derivedRadiusMeters * motionConfig.radiusMultiplier, MIN_ORBIT_RADIUS),
		slideId,
		startedAtMs: null,
		startAngle,
		sweepDegrees: motionConfig.sweepDegrees,
		tilt: currentCamera.tilt,
	};
}

export function getProgressDashOffset(progress: number): number {
	return TOUR_PROGRESS_CIRCUMFERENCE * (1 - progress);
}

export function applyOrbitFrame(view: SceneViewLike, stopState: TourStopState, progress: number): void {
	const easedProgress = easeInOutSine(progress);
	const orbitAngle = normalizeHeading(stopState.startAngle + stopState.sweepDegrees * easedProgress);
	const nextCamera = cloneCamera(stopState.baseCamera);
	const centerZ = stopState.center.z ?? nextCamera.position.z ?? 0;
	const destination = geodesicUtils.pointFromDistance(stopState.geographicCenter, stopState.radiusMeters, orbitAngle);
	const projectedDestination = fromGeographicPoint(
		destination,
		nextCamera.position.spatialReference as SpatialReferenceLike | null | undefined,
	);

	if (!projectedDestination) {
		return;
	}

	nextCamera.position = new Point({
		spatialReference: projectedDestination.spatialReference,
		x: projectedDestination.x,
		y: projectedDestination.y,
		z: centerZ + stopState.heightOffset,
	});
	nextCamera.heading = normalizeHeading(orbitAngle + 180);
	nextCamera.tilt = stopState.tilt;
	view.camera = nextCamera;
}
