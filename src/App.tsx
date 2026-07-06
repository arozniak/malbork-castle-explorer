import { useEffect, useRef, useState, type JSX } from "react";

import {
  getSceneViewFromElement,
  type LayerTargets,
  type RuntimeCollectionLike,
  type SceneElement,
  type SceneViewLike,
  type WebSceneLike,
} from "./scene-runtime-types";
import { applyLayerModeToTargets, resolveLayerTargets, type LayerMode } from "./layer-mode";
import { SceneOverlay } from "./scene-overlay";
import { buildSlideModel, type SlideModel } from "./slide-model";
import {
  TOUR_PROGRESS_CIRCUMFERENCE,
  applyOrbitFrame,
  buildTourStopState,
  getProgressDashOffset,
  getTourMotionConfig,
  type TourStopState,
} from "./tour-motion";

import "@arcgis/map-components/components/arcgis-compass";
import "@arcgis/map-components/components/arcgis-home";
import "@arcgis/map-components/components/arcgis-scene";
import "@arcgis/map-components/components/arcgis-zoom";
import "@esri/calcite-components/components/calcite-shell";

const MALBORK_WEB_SCENE_ID = "a032056172494a81a2105ef9232ea9a9";
const SCENE_ELEMENT_ID = "malbork-scene";

type ReapplyLayerMode = () => void;

function toArray<T>(collection: RuntimeCollectionLike<T> | readonly T[] | null | undefined): T[] {
  if (!collection) {
    return [];
  }

  if (Array.isArray(collection)) {
    return [...collection];
  }

  const iterableCollection = collection as RuntimeCollectionLike<T>;

  if (typeof iterableCollection.toArray === "function") {
    return iterableCollection.toArray();
  }

  if (iterableCollection[Symbol.iterator]) {
    return Array.from(iterableCollection as Iterable<T>);
  }

  return [];
}

async function applySlideToSceneView(
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

function waitForAnimationFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

export function App(): JSX.Element {
  const layerModeRef = useRef<LayerMode>("mesh");
  const layerTargetsRef = useRef<LayerTargets | null>(null);
  const progressRingRef = useRef<SVGCircleElement | null>(null);
  const sceneRef = useRef<SceneElement | null>(null);
  const tourFrameRef = useRef<number | null>(null);
  const tourStateRef = useRef<TourStopState | null>(null);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [appliedSlideId, setAppliedSlideId] = useState<string | null>(null);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [isTourPlaying, setIsTourPlaying] = useState(false);
  const [layerMode, setLayerMode] = useState<LayerMode>("mesh");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [showLayerSwitch, setShowLayerSwitch] = useState(false);
  const [slides, setSlides] = useState<SlideModel[]>([]);
  const [tourProgress, setTourProgress] = useState(0);

  const applyPersistedLayerMode = (nextMode = layerModeRef.current): void => {
    if (layerTargetsRef.current) {
      applyLayerModeToTargets(layerTargetsRef.current, nextMode);
    }
  };

  const setPersistentLayerMode = (nextMode: LayerMode, syncState = true): void => {
    layerModeRef.current = nextMode;
    applyPersistedLayerMode(nextMode);

    if (syncState) {
      setLayerMode(nextMode);
    }
  };

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
        const initialSourceSlide = initialSlide.slide;
        const sceneView = getSceneViewFromElement(sceneElement);

        if (sceneView) {
          if (initialSlide.viewpoint) {
            await sceneView.goTo(initialSlide.viewpoint, { animate: false });
          } else if (typeof initialSourceSlide?.applyTo === "function") {
            await initialSourceSlide.applyTo(sceneView);
          }
        }

        layerTargetsRef.current = resolveLayerTargets(sceneView?.map ?? webScene);
        setShowLayerSwitch(Boolean(layerTargetsRef.current));
        setPersistentLayerMode("mesh", false);
        setLayerMode("mesh");

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

    const sceneElement = sceneRef.current;
    const sceneView = getSceneViewFromElement(sceneElement);
    const activeSlide = slides.find((slide) => slide.id === activeSlideId);

    if (!sceneView || !activeSlide) {
      return;
    }

    if (tourStateRef.current?.slideId !== activeSlide.id) {
      tourStateRef.current = null;
      syncTourProgress(0, true);
    }

    setAppliedSlideId(null);

    let isCancelled = false;

    const applySlide = applySlideToSceneView(sceneView, activeSlide, applyPersistedLayerMode, true);

    void applySlide
      .then(() => {
        if (isCancelled) {
          return;
        }

        layerTargetsRef.current = resolveLayerTargets(sceneView.map ?? null);
        setShowLayerSwitch(Boolean(layerTargetsRef.current));
        applyPersistedLayerMode();

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

    const sceneElement = sceneRef.current;
    const sceneView = getSceneViewFromElement(sceneElement);
    const activeSlide = slides.find((slide) => slide.id === activeSlideId);
    const sourceSlide = activeSlide?.slide;
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

    const startTour = async (): Promise<void> => {
      const sceneElement = sceneRef.current;
      const sceneView = getSceneViewFromElement(sceneElement);

      if (!sceneView) {
        return;
      }

      cancelTourFrame();
      tourStateRef.current = null;
      syncTourProgress(0, true);
      setAppliedSlideId(null);
      setLoadError(null);

      try {
        await applySlideToSceneView(sceneView, currentSlide, applyPersistedLayerMode, true);

        layerTargetsRef.current = resolveLayerTargets(sceneView.map ?? null);
        setShowLayerSwitch(Boolean(layerTargetsRef.current));
        applyPersistedLayerMode();

        setAppliedSlideId(currentSlide.id);
        setIsTourPlaying(true);
      } catch {
        setLoadError(`Unable to move to ${currentSlide.title}.`);
        setAppliedSlideId(null);
        stopTour();
      }
    };

    void startTour();
  };

  const handleLayerModeSelect = (): void => {
    if (!showLayerSwitch) {
      return;
    }

    const nextMode: LayerMode = layerMode === "mesh" ? "splat" : "mesh";

    setPersistentLayerMode(nextMode);
    setLoadError(null);
  };

  const nextLayerMode: LayerMode = layerMode === "mesh" ? "splat" : "mesh";
  const nextLayerLabel = nextLayerMode === "mesh" ? "Mesh" : "Gaussian Splat";

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
        <SceneOverlay
          activeSlideId={activeSlideId}
          currentSlide={currentSlide}
          introParagraph={introParagraph}
          isTextExpanded={isTextExpanded}
          isTourPlaying={isTourPlaying}
          nextLayerLabel={nextLayerLabel}
          onLayerModeSelect={handleLayerModeSelect}
          onSlideSelect={handleSlideSelect}
          onTextExpandedChange={setIsTextExpanded}
          onTourToggle={handleTourToggle}
          progressOffset={progressOffset}
          progressRingRef={progressRingRef}
          showLayerSwitch={showLayerSwitch}
          slides={slides}
          tourProgressCircumference={TOUR_PROGRESS_CIRCUMFERENCE}
        />
      ) : null}
      {statusMessage ? <div className="scene-status">{statusMessage}</div> : null}
    </calcite-shell>
  );
}
