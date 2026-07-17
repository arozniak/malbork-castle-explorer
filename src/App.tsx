import { useEffect, useRef, useState, type JSX } from "react";
import { flushSync } from "react-dom";

import {
  getSceneViewFromElement,
  type SceneElement,
  type WebSceneLike,
} from "./scene-runtime-types";
import { SceneOverlay } from "./scene-overlay";
import {
  applySlideToSceneView,
  toArray,
} from "./scene-runtime-utils";
import { buildSlideModel, type SlideModel } from "./slide-model.ts";
import {
  TOUR_PROGRESS_CIRCUMFERENCE,
  applyOrbitFrame,
  buildTourStopState,
  getProgressDashOffset,
  getTourMotionConfig,
  type TourStopState,
} from "./tour-motion";
import { NavigationOnboarding } from "./navigation-onboarding";

import "@arcgis/map-components/components/arcgis-compass";
import "@arcgis/map-components/components/arcgis-scene";
import "@arcgis/map-components/components/arcgis-zoom";
import "@esri/calcite-components/components/calcite-shell";

const MALBORK_WEB_SCENE_ID = "a032056172494a81a2105ef9232ea9a9";
const NAVIGATION_ONBOARDING_STORAGE_KEY = "malbork-navigation-onboarding-dismissed";
const SCENE_ELEMENT_ID = "malbork-scene";
const MAP_CONTROL_ICON_STYLE_ATTRIBUTE = "data-malbork-map-control-icon-style";
const MAP_CONTROL_BUTTON_STYLE_ATTRIBUTE = "data-malbork-map-control-button-style";
const MAP_CONTROL_STYLE_ATTRIBUTE = "data-malbork-map-control-style";
const MAP_CONTROL_ICON_SHADOW_CSS = `
  :host {
    color: inherit;
  }

  svg {
    fill: currentColor;
  }
`;
const MAP_CONTROL_BUTTON_SHADOW_CSS = `
  button {
    align-items: center;
    -webkit-tap-highlight-color: transparent;
    background-color: rgb(244 239 227 / 96%) !important;
    block-size: 2.55rem;
    border-color: rgb(111 95 58 / 38%) !important;
    box-shadow: 0 1px 4px rgb(62 46 19 / 10%) !important;
    color: #6a5931 !important;
    inline-size: 2.55rem;
    justify-content: center;
    min-block-size: 2.55rem;
    min-inline-size: 2.55rem;
    outline: none;
    padding: 0;
    text-decoration: none;
    transition:
      transform 180ms ease,
      background-color 180ms ease,
      border-color 180ms ease,
      box-shadow 180ms ease,
      color 180ms ease;
  }

  :host(:hover) button,
  :host(:focus-visible) button,
  :host(:focus-within) button,
  button:hover,
  button:focus-visible {
    background-color: rgb(249 245 235 / 98%) !important;
    border-color: rgb(111 95 58 / 42%) !important;
    box-shadow: 0 3px 10px rgb(62 46 19 / 15%) !important;
    color: #4f4329 !important;
    transform: translateY(-1px);
  }

  button:focus,
  button:focus-visible,
  button:active {
    outline: none;
    text-decoration: none;
  }

  .icon {
    color: inherit !important;
    margin: 0;
  }

  calcite-icon,
  .icon-container {
    block-size: 1.05rem;
    color: inherit !important;
    fill: currentColor !important;
    inline-size: 1.05rem;
  }
`;
const MAP_CONTROL_SHADOW_CSS = `
  :host {
    display: block;
    -webkit-tap-highlight-color: transparent;
  }

  .arcgis-button,
  .root.arcgis-button {
    background: transparent;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  calcite-button {
    --calcite-button-corner-radius: 999px;
    block-size: 2.55rem;
    inline-size: 2.55rem;
  }
`;

const applyMapControlIconStyle = (iconElement: Element): void => {
  const shadowRoot = iconElement.shadowRoot;

  if (!shadowRoot || shadowRoot.querySelector(`style[${MAP_CONTROL_ICON_STYLE_ATTRIBUTE}]`)) {
    return;
  }

  const styleElement = document.createElement("style");

  styleElement.setAttribute(MAP_CONTROL_ICON_STYLE_ATTRIBUTE, "true");
  styleElement.textContent = MAP_CONTROL_ICON_SHADOW_CSS;
  shadowRoot.append(styleElement);
};

const applyMapControlButtonStyle = (buttonElement: Element): void => {
  const shadowRoot = buttonElement.shadowRoot;

  if (!shadowRoot || shadowRoot.querySelector(`style[${MAP_CONTROL_BUTTON_STYLE_ATTRIBUTE}]`)) {
    return;
  }

  const styleElement = document.createElement("style");

  styleElement.setAttribute(MAP_CONTROL_BUTTON_STYLE_ATTRIBUTE, "true");
  styleElement.textContent = MAP_CONTROL_BUTTON_SHADOW_CSS;
  shadowRoot.append(styleElement);
  shadowRoot.querySelectorAll("calcite-icon").forEach((iconElement) => {
    applyMapControlIconStyle(iconElement);
  });

  const nativeButton = shadowRoot.querySelector<HTMLButtonElement>("button");

  if (nativeButton && nativeButton.dataset.malborkBlurOnPointerUp !== "true") {
    nativeButton.dataset.malborkBlurOnPointerUp = "true";
    nativeButton.addEventListener("pointerup", () => {
      nativeButton.blur();
      if (buttonElement instanceof HTMLElement) {
        buttonElement.blur();
      }
    });
  }
};

const applyMapControlStyle = (element: HTMLElement | null): boolean => {
  const shadowRoot = element?.shadowRoot;

  if (!shadowRoot) {
    return false;
  }

  const existingStyle = shadowRoot.querySelector(`style[${MAP_CONTROL_STYLE_ATTRIBUTE}]`);

  if (existingStyle) {
    return true;
  }

  const styleElement = document.createElement("style");

  styleElement.setAttribute(MAP_CONTROL_STYLE_ATTRIBUTE, "true");
  styleElement.textContent = MAP_CONTROL_SHADOW_CSS;
  shadowRoot.append(styleElement);
  shadowRoot.querySelectorAll<HTMLElement>(".arcgis-button, .root.arcgis-button").forEach((wrapperElement) => {
    wrapperElement.style.background = "transparent";
  });
  shadowRoot.querySelectorAll("calcite-button").forEach((buttonElement) => {
    applyMapControlButtonStyle(buttonElement);
  });

  return true;
};

export function App(): JSX.Element {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(NAVIGATION_ONBOARDING_STORAGE_KEY) !== "true";
  });
  const lastTourProgressRef = useRef(0);
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

  const syncTourProgress = (progress: number): void => {
    const normalizedProgress = Math.max(0, Math.min(1, progress));

    if (Math.abs(lastTourProgressRef.current - normalizedProgress) < 0.0001) {
      return;
    }

    lastTourProgressRef.current = normalizedProgress;
    flushSync(() => {
      setTourProgress(normalizedProgress);
    });
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
    syncTourProgress(tourStateRef.current ? tourStateRef.current.elapsedMs / tourStateRef.current.durationMs : 0);
    setIsTourPlaying(false);
  };

  const stopTour = (): void => {
    cancelTourFrame();
    tourStateRef.current = null;
    setIsTourPlaying(false);
    syncTourProgress(0);
  };

  useEffect(() => {
    let frameId: number | null = null;

    const styleControls = (): void => {
      const controlElements = [
        document.querySelector(".scene-controls arcgis-zoom"),
        document.querySelector(".scene-controls arcgis-compass"),
      ] as Array<HTMLElement | null>;
      const hasPendingControl = controlElements.some((controlElement) => !applyMapControlStyle(controlElement));

      if (hasPendingControl) {
        frameId = requestAnimationFrame(styleControls);
      }
    };

    styleControls();

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []);

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
      syncTourProgress(0);
    }

    setAppliedSlideId(null);

    let isCancelled = false;

    const applySlide = applySlideToSceneView(sceneView, activeSlide, true);

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
    if (!isInfoOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsInfoOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isInfoOpen]);

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
      syncTourProgress(0);
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
          syncTourProgress(1);
          return;
        }

        cancelTourFrame();
        tourStateRef.current = null;
        syncTourProgress(0);
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
  const statusMessage = loadError;
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

    const existingStopState = tourStateRef.current;

    if (
      existingStopState &&
      existingStopState.slideId === currentSlide.id &&
      existingStopState.elapsedMs < existingStopState.durationMs
    ) {
      setLoadError(null);
      setIsTourPlaying(true);
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
      syncTourProgress(0);
      setAppliedSlideId(null);
      setLoadError(null);

      try {
        await applySlideToSceneView(sceneView, currentSlide, true);

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

  const handleOnboardingClose = (): void => {
    setIsOnboardingOpen(false);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(NAVIGATION_ONBOARDING_STORAGE_KEY, "true");
    }
  };

  return (
    <calcite-shell content-behind>
      <div
        aria-hidden={isOnboardingOpen}
        className={`app-shell${isOnboardingOpen ? " is-locked" : ""}`}
        inert={isOnboardingOpen ? true : undefined}
      >
        <arcgis-scene
          aria-label={sceneLabel}
          id={SCENE_ELEMENT_ID}
          itemId={MALBORK_WEB_SCENE_ID}
          popupDisabled
          ref={sceneRef}
        />
        <div
          aria-disabled={isTextExpanded}
          aria-label="Map controls"
          className={`scene-controls${isTextExpanded ? " is-disabled" : ""}`}
          inert={isTextExpanded ? true : undefined}
        >
          <arcgis-zoom referenceElement={SCENE_ELEMENT_ID} visualScale="s" />
          <arcgis-compass referenceElement={SCENE_ELEMENT_ID} visualScale="s" />
        </div>
        {sceneReady && slides.length > 0 ? (
          <SceneOverlay
            activeSlideId={activeSlideId}
            currentSlide={currentSlide}
            introParagraph={introParagraph}
            isInfoOpen={isInfoOpen}
            isTextExpanded={isTextExpanded}
            isTourPlaying={isTourPlaying}
            onInfoOpenChange={setIsInfoOpen}
            onSlideSelect={handleSlideSelect}
            onTextExpandedChange={setIsTextExpanded}
            onTourToggle={handleTourToggle}
            progressOffset={progressOffset}
            slides={slides}
            tourProgressCircumference={TOUR_PROGRESS_CIRCUMFERENCE}
          />
        ) : null}
        {statusMessage ? <div className="scene-status">{statusMessage}</div> : null}
      </div>
      <NavigationOnboarding open={isOnboardingOpen} onClose={handleOnboardingClose} />
    </calcite-shell>
  );
}
