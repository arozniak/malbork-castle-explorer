import { useEffect, useRef, useState, type JSX } from "react";

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

type SceneElement = HTMLElementTagNameMap["arcgis-scene"];

interface SlideLike {
  id?: string;
  title?: string | { text?: string | null } | null;
  description?: string | { text?: string | null } | null;
  viewpoint?: unknown;
}

interface SlideModel {
  id: string;
  title: string;
  description: string;
  fullText: string;
  introParagraph: string;
  extraParagraphs: string[];
  slide: SlideLike;
  viewpoint: unknown;
}

interface SceneViewLike {
  goTo: (target: unknown, options?: { animate?: boolean }) => Promise<unknown>;
}

interface SceneSlideLike extends SlideLike {
  applyTo?: (view: SceneViewLike) => Promise<unknown>;
}

interface SlidesCollectionLike<T> {
  toArray?: () => T[];
  [Symbol.iterator]?: () => Iterator<T>;
}

interface WebSceneLike {
  load?: () => Promise<unknown>;
  presentation?: {
    slides?: SlidesCollectionLike<SlideLike> | null;
  } | null;
}

function toArray<T>(collection: SlidesCollectionLike<T> | null | undefined): T[] {
  if (!collection) {
    return [];
  }

  if (typeof collection.toArray === "function") {
    return collection.toArray();
  }

  if (collection[Symbol.iterator]) {
    return Array.from(collection as Iterable<T>);
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
  introParagraph: string;
  extraParagraphs: string[];
} {
  const introParagraph = buildIntroText(description);

  if (!description) {
    return {
      introParagraph: "",
      extraParagraphs: [],
    };
  }

  const sourceParagraphs = splitSourceParagraphs(description);

  if (sourceParagraphs.length > 1) {
    const [firstParagraph, ...remainingParagraphs] = sourceParagraphs;

    if (firstParagraph.startsWith(introParagraph)) {
      const firstParagraphRemainder = firstParagraph.slice(introParagraph.length).trim();

      return {
        introParagraph,
        extraParagraphs: [firstParagraphRemainder, ...remainingParagraphs].filter(Boolean),
      };
    }

    return {
      introParagraph,
      extraParagraphs: sourceParagraphs.filter((paragraph) => paragraph !== introParagraph),
    };
  }

  const sentences = splitSentences(description);
  const introSentenceCount = splitSentences(introParagraph).length;

  return {
    introParagraph,
    extraParagraphs: groupSentencesIntoParagraphs(sentences.slice(introSentenceCount)),
  };
}

function buildSlideModel(slide: SlideLike, index: number): SlideModel {
  const title = readText(slide.title) || `Stop ${index + 1}`;
  const description = readText(slide.description);
  const { introParagraph, extraParagraphs } = buildTextParagraphs(description);

  return {
    id: slide.id || `slide-${index + 1}`,
    title,
    description,
    fullText: description,
    introParagraph,
    extraParagraphs,
    slide,
    viewpoint: slide.viewpoint ?? null,
  };
}

export function App(): JSX.Element {
  const sceneRef = useRef<SceneElement | null>(null);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [slides, setSlides] = useState<SlideModel[]>([]);

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

        setSlides(slideModels);
        setActiveSlideId(slideModels[0].id);
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

    const applySlide =
      typeof sourceSlide?.applyTo === "function"
        ? sourceSlide.applyTo(sceneView)
        : activeSlide.viewpoint
          ? sceneView.goTo(activeSlide.viewpoint, { animate: true })
          : Promise.resolve();

    void applySlide.catch(() => {
      setLoadError(`Unable to move to ${activeSlide.title}.`);
    });
  }, [activeSlideId, sceneReady, slides]);

  const handleSlideSelect = (slideId: string): void => {
    setIsTextExpanded(false);
    setActiveSlideId(slideId);
    setLoadError(null);
  };

  const currentSlide = slides.find((slide) => slide.id === activeSlideId) ?? null;
  const statusMessage = loadError || (!sceneReady ? "Loading Malbork Web Scene..." : null);
  const sceneLabel = currentSlide
    ? `Malbork Castle 3D scene. Active stop: ${currentSlide.title}.`
    : "Malbork Castle 3D scene.";
  const introParagraph =
    currentSlide?.introParagraph || currentSlide?.fullText || "Description unavailable for this stop.";
  const extraParagraphs = currentSlide?.extraParagraphs ?? [];

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
        </div>
      ) : null}
      {statusMessage ? <div className="scene-status">{statusMessage}</div> : null}
    </calcite-shell>
  );
}
