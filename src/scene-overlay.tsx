import type { SlideModel } from "./slide-model";

type ViewportMode = "mobile" | "tablet" | "desktop";

interface SceneOverlayProps {
  activeSlideId: string | null;
  currentSlide: SlideModel | null;
  extraParagraphs: string[];
  introParagraph: string;
  isInfoOpen: boolean;
  isMobileLandscape: boolean;
  isTextExpanded: boolean;
  isTourPlaying: boolean;
  onInfoOpenChange: (open: boolean) => void;
  onSlideSelect: (slideId: string) => void;
  onTextExpandedChange: (expanded: boolean) => void;
  onTourToggle: () => void;
  progressOffset: number;
  slides: SlideModel[];
  tourProgressCircumference: number;
  viewportMode: ViewportMode;
}

export function SceneOverlay({
  activeSlideId,
  currentSlide,
  extraParagraphs,
  introParagraph,
  isInfoOpen,
  isMobileLandscape,
  isTextExpanded,
  isTourPlaying,
  onInfoOpenChange,
  onSlideSelect,
  onTextExpandedChange,
  onTourToggle,
  progressOffset,
  slides,
  tourProgressCircumference,
  viewportMode,
}: SceneOverlayProps) {
  const activeSlideIndex = slides.findIndex((slide) => slide.id === activeSlideId);
  const isMobile = viewportMode === "mobile";
  const hasPreviousSlide = activeSlideIndex > 0;
  const hasNextSlide = activeSlideIndex >= 0 && activeSlideIndex < slides.length - 1;

  return (
    <div
      className={[
        "scene-overlay",
        isTextExpanded ? "is-text-expanded" : "",
        `is-${viewportMode}`,
        isMobileLandscape ? "is-mobile-landscape" : "",
      ].filter(Boolean).join(" ")}
    >
      {isTextExpanded ? <div aria-hidden="true" className="scene-text-veil" /> : null}
      <div className="scene-info-panel">
        <button
          aria-controls="scene-about-popup"
          aria-expanded={isInfoOpen}
          aria-haspopup="dialog"
          aria-label={isInfoOpen ? "Close information" : "Open information"}
          className={`scene-info-button${isInfoOpen ? " is-open" : ""}`}
          onClick={() => onInfoOpenChange(!isInfoOpen)}
          type="button"
        >
          <span aria-hidden="true" className="scene-info-button-glyph">i</span>
        </button>
        {isInfoOpen ? (
          <section aria-label="About" className="scene-about-popup" id="scene-about-popup">
            <div className="scene-about-popup-header">
              <h2 className="scene-about-title">About</h2>
            </div>
            <div className="scene-about-section">
              <h3 className="scene-about-section-title">Code repository</h3>
              <a
                className="scene-about-link"
                href="https://github.com/arozniak/malbork-castle-explorer"
                rel="noreferrer"
                target="_blank"
              >
                Malbork Castle Explorer on GitHub
              </a>
            </div>
            <div className="scene-about-section">
              <h3 className="scene-about-section-title">Data</h3>
              <p className="scene-about-copy">
                Malbork Castle 3D mesh based on{" "}
                <a
                  className="scene-about-link"
                  href="https://www.gov.pl/web/gugik/dane-ukosne-i-modele-siatkowe-3d-mesh-dla-malborka-dostepne-w-pzgik"
                  rel="noreferrer"
                  target="_blank"
                >
                  aerial imagery published by the Polish Head Office of Geodesy and Cartography (GUGiK)
                </a>
                . The source data is available under the Polish Act on Open Data and Re-use of Public Sector Information. The imagery was processed using ArcGIS Reality Studio.
              </p>
            </div>
            <div className="scene-about-section">
              <h3 className="scene-about-section-title">Acknowledgements</h3>
              <p className="scene-about-copy">
                The source imagery was processed into a 3D mesh by <strong>Ashleigh Sier (Esri)</strong> using ArcGIS Reality Studio. This application was vibe coded with Microsoft Copilot by <strong>Agnieszka Rozniak</strong> as part of work carried out at <strong>Esri R&amp;D Center Zurich</strong>.
              </p>
            </div>
          </section>
        ) : null}
      </div>
      {isMobileLandscape ? (
        <section aria-live="polite" className="mobile-rotation-notice">
          <h2 className="mobile-rotation-notice__title">Rotate device</h2>
          <p className="mobile-rotation-notice__copy">Use portrait mode to explore the castle on mobile.</p>
        </section>
      ) : null}
      {!isMobileLandscape ? (
        <>
          <div className="slide-ui-stack">
            {isMobile ? (
              <nav aria-label="Castle areas" className="mobile-location-nav">
                <button
                  aria-label="Previous location"
                  className="mobile-location-nav__arrow"
                  disabled={!hasPreviousSlide}
                  onClick={() => {
                    if (hasPreviousSlide) {
                      onSlideSelect(slides[activeSlideIndex - 1].id);
                    }
                  }}
                  type="button"
                >
                  <span aria-hidden="true">&larr;</span>
                </button>
                <div aria-live="polite" className="mobile-location-nav__label">
                  {currentSlide?.title ?? "Loading"}
                </div>
                <button
                  aria-label="Next location"
                  className="mobile-location-nav__arrow"
                  disabled={!hasNextSlide}
                  onClick={() => {
                    if (hasNextSlide) {
                      onSlideSelect(slides[activeSlideIndex + 1].id);
                    }
                  }}
                  type="button"
                >
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </nav>
            ) : (
              <nav aria-label="Castle areas" className="slide-tab-rail">
                {slides.map((slide) => {
                  const isActive = slide.id === activeSlideId;

                  return (
                    <button
                      aria-pressed={isActive}
                      className={`slide-tab${isActive ? " is-active" : ""}`}
                      key={slide.id}
                      onClick={() => onSlideSelect(slide.id)}
                      type="button"
                    >
                      {slide.title}
                    </button>
                  );
                })}
              </nav>
            )}

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
                      onTextExpandedChange(!isTextExpanded);
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
              disabled={!currentSlide || isTextExpanded}
              onClick={onTourToggle}
              type="button"
            >
              <svg aria-hidden="true" className="tour-progress" viewBox="0 0 44 44">
                <circle className="tour-progress-track" cx="22" cy="22" r="18" />
                <circle
                  className="tour-progress-value"
                  cx="22"
                  cy="22"
                  r="18"
                  strokeDasharray={`${tourProgressCircumference}`}
                  strokeDashoffset={progressOffset}
                />
              </svg>
              <span className="tour-toggle-icon" />
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}