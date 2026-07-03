import { useEffect, useRef, useState, type JSX } from "react";
import Point from "@arcgis/core/geometry/Point";
import * as geodesicUtils from "@arcgis/core/geometry/support/geodesicUtils";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";

import "@arcgis/map-components/components/arcgis-compass";
import "@arcgis/map-components/components/arcgis-home";
import "@arcgis/map-components/components/arcgis-scene";
import "@arcgis/map-components/components/arcgis-zoom";
import "@esri/calcite-components/components/calcite-shell";

const MALBORK_WEB_SCENE_ID = "a032056172494a81a2105ef9232ea9a9";
const SCENE_ELEMENT_ID = "malbork-scene";
const LONG_DESCRIPTION_THRESHOLD = 220;
const LONG_DESCRIPTION_SENTENCE_COUNT = 2;
const SHORT_DESCRIPTION_SENTENCE_COUNT = 1;
const TOUR_STOP_DURATION_MS = 10000;
const TOUR_FULL_ROTATION_DURATION_MS = 36000;
const ORBIT_SWEEP_DEGREES = 55;
const FULL_ORBIT_SWEEP_DEGREES = 360;
const MIN_ORBIT_RADIUS = 25;
const TOUR_PROGRESS_CIRCUMFERENCE = 113.1;

type SceneElement = HTMLElementTagNameMap["arcgis-scene"];

interface SlidesCollectionLike<T> {
  toArray?: () => T[];
  [Symbol.iterator]?: () => Iterator<T>;
}

interface PointLike {
  clone?: () => PointLike;
  latitude?: number | null;
  longitude?: number | null;
  spatialReference?: unknown;
  type?: string;
  x: number;
  y: number;
  z?: number | null;
}

interface ExtentLike {
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

interface GeometryLike {
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

interface CameraLike {
  clone?: () => CameraLike;
  fov?: number;
  heading: number;
  position: PointLike;
  tilt: number;
}

interface ViewpointLike {
  camera?: CameraLike | null;
  targetGeometry?: GeometryLike | null;
}

interface FocusAreaLike {
  geometries?: SlidesCollectionLike<GeometryLike> | null;
  id?: string;
}

interface FocusAreasLike {
  areas?: SlidesCollectionLike<FocusAreaLike> | null;
}

interface SpatialReferenceLike {
  isGeographic?: boolean;
  isWebMercator?: boolean;
  latestWkid?: number;
  wkid?: number;
}

interface SlideLike {
  description?: string | { text?: string | null } | null;
  enabledFocusAreas?: SlidesCollectionLike<string> | string[] | null;
  id?: string;
  title?: string | { text?: string | null } | null;
  viewpoint?: unknown;
}

interface SlideModel {
  description: string;
  extraParagraphs: string[];
  fullText: string;
  id: string;
  introParagraph: string;
  slide: SlideLike;
  title: string;
  viewpoint: unknown;
}

interface WebSceneLike {
  focusAreas?: FocusAreasLike | null;
  load?: () => Promise<unknown>;
  presentation?: {
    slides?: SlidesCollectionLike<SlideLike> | null;
  } | null;
}

interface SceneViewLike {
  camera: CameraLike;
  goTo: (target: unknown, options?: { animate?: boolean }) => Promise<unknown>;
  height?: number;
  map?: WebSceneLike | null;
  toMap?: (screenPoint: { x: number; y: number }) => PointLike | null | undefined;
  width?: number;
}

interface SceneSlideLike extends SlideLike {
  applyTo?: (view: SceneViewLike) => Promise<unknown>;
}

interface TourStopState {
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

interface TourMotionConfig {
  durationMs: number;
  radiusMultiplier: number;
  sweepDegrees: number;
}

function toArray<T>(collection: SlidesCollectionLike<T> | readonly T[] | null | undefined): T[] {
  if (!collection) {
    return [];
  }

  if (Array.isArray(collection)) {
    return [...collection];
  }

  const iterableCollection = collection as SlidesCollectionLike<T>;

  if (typeof iterableCollection.toArray === "function") {
    return iterableCollection.toArray();
  }

  if (iterableCollection[Symbol.iterator]) {
    return Array.from(iterableCollection as Iterable<T>);
  }

  return [];
}

function readText(value: string | { text?: string | null } | null | undefined): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value && typeof value.text === "string") {
    return value.text.trim();
  }

  return "";
}

function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g);

  return matches?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];
}

function buildIntroText(description: string): string {
  const sentences = splitSentences(description);

  if (sentences.length === 0) {
    return "";
  }

  const sentenceCount =
    description.length >= LONG_DESCRIPTION_THRESHOLD
      ? LONG_DESCRIPTION_SENTENCE_COUNT
      : SHORT_DESCRIPTION_SENTENCE_COUNT;

  return sentences.slice(0, sentenceCount).join(" ");
}

function splitSourceParagraphs(description: string): string[] {
  return description
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function groupSentencesIntoParagraphs(sentences: string[]): string[] {
  if (sentences.length === 0) {
    return [];
  }

  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];

  sentences.forEach((sentence, index) => {
    currentParagraph.push(sentence);

    const isLastSentence = index === sentences.length - 1;
    const nextSentence = sentences[index + 1] ?? "";
    const shouldBreak =
      currentParagraph.length >= 2 &&
      (sentence.length >= 120 || nextSentence.length >= 140 || isLastSentence);

    if (shouldBreak || currentParagraph.length >= 3 || isLastSentence) {
      paragraphs.push(currentParagraph.join(" "));
      currentParagraph = [];
    }
  });

  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(" "));
  }

  return paragraphs;
}

function buildTextParagraphs(description: string): {
  extraParagraphs: string[];
  introParagraph: string;
} {
  const introParagraph = buildIntroText(description);

  if (!description) {
    return {
      extraParagraphs: [],
      introParagraph: "",
    };
  }

  const sourceParagraphs = splitSourceParagraphs(description);

  if (sourceParagraphs.length > 1) {
    const [firstParagraph, ...remainingParagraphs] = sourceParagraphs;

    if (firstParagraph.startsWith(introParagraph)) {
      const firstParagraphRemainder = firstParagraph.slice(introParagraph.length).trim();

      return {
        extraParagraphs: [firstParagraphRemainder, ...remainingParagraphs].filter(Boolean),
        introParagraph,
      };
    }

    return {
      extraParagraphs: sourceParagraphs.filter((paragraph) => paragraph !== introParagraph),
      introParagraph,
    };
  }

  const sentences = splitSentences(description);
  const introSentenceCount = splitSentences(introParagraph).length;

  return {
    extraParagraphs: groupSentencesIntoParagraphs(sentences.slice(introSentenceCount)),
    introParagraph,
  };
}

function buildSlideModel(slide: SlideLike, index: number): SlideModel {
  const title = readText(slide.title) || `Stop ${index + 1}`;
  const description = readText(slide.description);
  const { introParagraph, extraParagraphs } = buildTextParagraphs(description);

  return {
    description,
    extraParagraphs,
    fullText: description,
    id: slide.id || `slide-${index + 1}`,
    introParagraph,
    slide,
    title,
    viewpoint: slide.viewpoint ?? null,
  };
}

function getTourMotionConfig(slide: SlideModel): TourMotionConfig {
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

function buildTourStopState(
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

function getProgressDashOffset(progress: number): number {
  return TOUR_PROGRESS_CIRCUMFERENCE * (1 - progress);
}

function applyOrbitFrame(view: SceneViewLike, stopState: TourStopState, progress: number): void {
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

export function App(): JSX.Element {
  const progressRingRef = useRef<SVGCircleElement | null>(null);
  const sceneRef = useRef<SceneElement | null>(null);
  const tourFrameRef = useRef<number | null>(null);
  const tourStateRef = useRef<TourStopState | null>(null);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [appliedSlideId, setAppliedSlideId] = useState<string | null>(null);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [isTourPlaying, setIsTourPlaying] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [slides, setSlides] = useState<SlideModel[]>([]);
  const [tourProgress, setTourProgress] = useState(0);

  const syncTourProgress = (progress: number, syncState = false): void => {
    const normalizedProgress = Math.max(0, Math.min(1, progress));

    if (progressRingRef.current) {
      progressRingRef.current.setAttribute("stroke-dashoffset", `${getProgressDashOffset(normalizedProgress)}`);
    }

    if (syncState) {
      setTourProgress(normalizedProgress);
    }
  };

  const cancelTourFrame = (): void => {
    if (tourFrameRef.current !== null) {
      cancelAnimationFrame(tourFrameRef.current);
      tourFrameRef.current = null;
    }
  };

  const pauseTour = (): void => {
    cancelTourFrame();
    if (tourStateRef.current) {
      tourStateRef.current.startedAtMs = null;
    }
    syncTourProgress(tourStateRef.current ? tourStateRef.current.elapsedMs / tourStateRef.current.durationMs : 0, true);
    setIsTourPlaying(false);
  };

  const stopTour = (): void => {
    cancelTourFrame();
    tourStateRef.current = null;
    setIsTourPlaying(false);
    syncTourProgress(0, true);
  };

  useEffect(() => {
    const sceneElement = sceneRef.current;

    if (!sceneElement) {
      return;
    }

    let isCancelled = false;

    const initializeScene = async (): Promise<void> => {
      try {
        await sceneElement.viewOnReady();

        const webScene = sceneElement.map as WebSceneLike | null | undefined;

        if (typeof webScene?.load === "function") {
          await webScene.load();
        }

        const slideModels = toArray(webScene?.presentation?.slides).map(buildSlideModel);

        if (isCancelled) {
          return;
        }

        if (slideModels.length === 0) {
          setLoadError("The Malbork Web Scene loaded, but no presentation slides were found.");
          return;
        }

        const initialSlide = slideModels[0];
        const initialSourceSlide = initialSlide.slide as SceneSlideLike | undefined;
        const sceneView = (sceneElement as SceneElement & { view?: SceneViewLike | null }).view;

        if (sceneView) {
          if (initialSlide.viewpoint) {
            await sceneView.goTo(initialSlide.viewpoint, { animate: false });
          } else if (typeof initialSourceSlide?.applyTo === "function") {
            await initialSourceSlide.applyTo(sceneView);
          }
        }

        setSlides(slideModels);
        setActiveSlideId(initialSlide.id);
        setAppliedSlideId(null);
        setLoadError(null);
        setSceneReady(true);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : "Unknown scene loading error.";
        setLoadError(`Unable to load the Malbork Web Scene: ${message}`);
      }
    };

    void initializeScene();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sceneReady || !activeSlideId) {
      return;
    }

    const sceneElement = sceneRef.current as (SceneElement & { view?: SceneViewLike | null }) | null;
    const sceneView = sceneElement?.view;
    const activeSlide = slides.find((slide) => slide.id === activeSlideId);
    const sourceSlide = activeSlide?.slide as SceneSlideLike | undefined;

    if (!sceneView || !activeSlide) {
      return;
    }

    if (tourStateRef.current?.slideId !== activeSlide.id) {
      tourStateRef.current = null;
      syncTourProgress(0, true);
    }

    setAppliedSlideId(null);

    let isCancelled = false;

    const applySlide =
      typeof sourceSlide?.applyTo === "function"
        ? sourceSlide.applyTo(sceneView)
        : activeSlide.viewpoint
          ? sceneView.goTo(activeSlide.viewpoint, { animate: true })
          : Promise.resolve();

    void applySlide
      .then(() => {
        if (isCancelled) {
          return;
        }

        setAppliedSlideId(activeSlide.id);
        setLoadError(null);
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        setLoadError(`Unable to move to ${activeSlide.title}.`);
        setAppliedSlideId(null);
        pauseTour();
      });

    return () => {
      isCancelled = true;
    };
  }, [activeSlideId, sceneReady, slides]);

  useEffect(() => {
    if (!isTextExpanded) {
      return;
    }

    pauseTour();
  }, [isTextExpanded]);

  useEffect(() => {
    if (!isTourPlaying) {
      return;
    }

    const handleInteraction = (event: Event): void => {
      const target = event.target;

      if (target instanceof Element && target.closest(".tour-toggle")) {
        return;
      }

      pauseTour();
    };

    window.addEventListener("pointerdown", handleInteraction, true);
    window.addEventListener("wheel", handleInteraction, { capture: true, passive: true });
    window.addEventListener("keydown", handleInteraction, true);

    return () => {
      window.removeEventListener("pointerdown", handleInteraction, true);
      window.removeEventListener("wheel", handleInteraction, true);
      window.removeEventListener("keydown", handleInteraction, true);
    };
  }, [isTourPlaying]);

  useEffect(() => {
    if (!isTourPlaying || isTextExpanded || !sceneReady || !activeSlideId || appliedSlideId !== activeSlideId) {
      cancelTourFrame();
      return;
    }

    const sceneElement = sceneRef.current as (SceneElement & { view?: SceneViewLike | null }) | null;
    const sceneView = sceneElement?.view;
    const activeSlide = slides.find((slide) => slide.id === activeSlideId);
    const sourceSlide = activeSlide?.slide as SceneSlideLike | undefined;
    const motionConfig = activeSlide ? getTourMotionConfig(activeSlide) : null;

    if (!sceneView || !activeSlide || !sourceSlide || !motionConfig) {
      return;
    }

    const existingStopState = tourStateRef.current;

    if (!existingStopState || existingStopState.slideId !== activeSlide.id || existingStopState.elapsedMs >= existingStopState.durationMs) {
      const nextStopState = buildTourStopState(sourceSlide, activeSlide.id, motionConfig, sceneView);

      if (!nextStopState) {
        setLoadError(`Unable to start the guided tour at ${activeSlide.title}.`);
        stopTour();
        return;
      }

      tourStateRef.current = nextStopState;
      syncTourProgress(0, true);
      applyOrbitFrame(sceneView, nextStopState, 0);
    }

    const stepTour = (timestamp: number): void => {
      const stopState = tourStateRef.current;

      if (!stopState || stopState.slideId !== activeSlide.id) {
        cancelTourFrame();
        return;
      }

      if (stopState.startedAtMs === null) {
        stopState.startedAtMs = timestamp - stopState.elapsedMs;
      }

      stopState.elapsedMs = Math.min(stopState.durationMs, Math.max(0, timestamp - stopState.startedAtMs));

      const progress = stopState.elapsedMs / stopState.durationMs;

      applyOrbitFrame(sceneView, stopState, progress);
      syncTourProgress(progress);

      if (progress >= 1) {
        stopState.startedAtMs = null;
        const activeSlideIndex = slides.findIndex((slide) => slide.id === activeSlide.id);

        if (activeSlideIndex < 0 || activeSlideIndex >= slides.length - 1) {
          cancelTourFrame();
          setIsTourPlaying(false);
          syncTourProgress(1, true);
          return;
        }

        cancelTourFrame();
        tourStateRef.current = null;
        syncTourProgress(0, true);
        setActiveSlideId(slides[activeSlideIndex + 1].id);
        return;
      }

      tourFrameRef.current = requestAnimationFrame(stepTour);
    };

    tourFrameRef.current = requestAnimationFrame(stepTour);

    return () => {
      cancelTourFrame();
      if (tourStateRef.current) {
        tourStateRef.current.startedAtMs = null;
      }
    };
  }, [activeSlideId, appliedSlideId, isTextExpanded, isTourPlaying, sceneReady, slides]);

  useEffect(() => {
    return () => {
      cancelTourFrame();
    };
  }, []);

  const currentSlide = slides.find((slide) => slide.id === activeSlideId) ?? null;
  const statusMessage = loadError || (!sceneReady ? "Loading Malbork Web Scene..." : null);
  const sceneLabel = currentSlide
    ? `Malbork Castle 3D scene. Active stop: ${currentSlide.title}.`
    : "Malbork Castle 3D scene.";
  const introParagraph =
    currentSlide?.introParagraph || currentSlide?.fullText || "Description unavailable for this stop.";
  const extraParagraphs = currentSlide?.extraParagraphs ?? [];
  const progressOffset = getProgressDashOffset(tourProgress);

  const handleSlideSelect = (slideId: string): void => {
    stopTour();
    setIsTextExpanded(false);
    setActiveSlideId(slideId);
    setLoadError(null);
  };

  const handleTourToggle = (): void => {
    if (!sceneReady || !currentSlide || isTextExpanded) {
      return;
    }

    if (isTourPlaying) {
      pauseTour();
      return;
    }

    if (
      !tourStateRef.current ||
      tourStateRef.current.slideId !== currentSlide.id ||
      tourStateRef.current.elapsedMs >= tourStateRef.current.durationMs
    ) {
      tourStateRef.current = null;
      syncTourProgress(0, true);
    }

    setLoadError(null);
    setIsTourPlaying(true);
  };

  return (
    <calcite-shell content-behind>
      <arcgis-scene
        aria-label={sceneLabel}
        id={SCENE_ELEMENT_ID}
        itemId={MALBORK_WEB_SCENE_ID}
        popupDisabled
        ref={sceneRef}
      />
      <div aria-label="Map controls" className="scene-controls">
        <arcgis-home referenceElement={SCENE_ELEMENT_ID} />
        <arcgis-zoom referenceElement={SCENE_ELEMENT_ID} />
        <arcgis-compass referenceElement={SCENE_ELEMENT_ID} />
      </div>
      {sceneReady && slides.length > 0 ? (
        <div className={`scene-overlay${isTextExpanded ? " is-text-expanded" : ""}`}>
          {isTextExpanded ? <div aria-hidden="true" className="scene-text-veil" /> : null}
          <div className="slide-ui-stack">
            <nav aria-label="Castle areas" className="slide-tab-rail">
              {slides.map((slide) => {
                const isActive = slide.id === activeSlideId;

                return (
                  <button
                    aria-pressed={isActive}
                    className={`slide-tab${isActive ? " is-active" : ""}`}
                    key={slide.id}
                    onClick={() => handleSlideSelect(slide.id)}
                    type="button"
                  >
                    {slide.title}
                  </button>
                );
              })}
            </nav>

            {currentSlide ? (
              <section
                aria-live="polite"
                className={`slide-text${isTextExpanded ? " is-expanded" : ""}`}
              >
                <div className="slide-text-intro">
                  <p className="slide-text-paragraph is-intro">{introParagraph}</p>
                </div>
                {isTextExpanded ? (
                  <div className="slide-text-expanded">
                    {extraParagraphs.map((paragraph, index) => (
                      <p className="slide-text-paragraph" key={`${currentSlide.id}-paragraph-${index + 1}`}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : null}
                {currentSlide.fullText && extraParagraphs.length > 0 ? (
                  <button
                    aria-expanded={isTextExpanded}
                    className="slide-text-toggle"
                    onClick={() => {
                      setIsTextExpanded((expanded) => !expanded);
                    }}
                    type="button"
                  >
                    {isTextExpanded ? "Read less" : "Read more"}
                  </button>
                ) : null}
              </section>
            ) : null}
          </div>
          <div className="tour-control">
            <button
              aria-label={isTourPlaying ? "Pause guided tour" : "Play guided tour"}
              className={`tour-toggle${isTourPlaying ? " is-playing" : ""}`}
              disabled={!sceneReady || !currentSlide || isTextExpanded}
              onClick={handleTourToggle}
              type="button"
            >
              <svg aria-hidden="true" className="tour-progress" viewBox="0 0 44 44">
                <circle className="tour-progress-track" cx="22" cy="22" r="18" />
                <circle
                  ref={progressRingRef}
                  className="tour-progress-value"
                  cx="22"
                  cy="22"
                  r="18"
                  strokeDasharray={`${TOUR_PROGRESS_CIRCUMFERENCE}`}
                  strokeDashoffset={progressOffset}
                />
              </svg>
              <span className="tour-toggle-icon" />
            </button>
          </div>
        </div>
      ) : null}
      {statusMessage ? <div className="scene-status">{statusMessage}</div> : null}
    </calcite-shell>
  );
}
