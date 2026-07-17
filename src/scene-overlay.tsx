import type { SlideModel } from "./slide-model";

interface SceneOverlayProps {
  activeSlideId: string | null;
  currentSlide: SlideModel | null;
  introParagraph: string;
  isTextExpanded: boolean;
  isTourPlaying: boolean;
  onSlideSelect: (slideId: string) => void;
  onTextExpandedChange: (expanded: boolean) => void;
  onTourToggle: () => void;
  progressOffset: number;
  slides: SlideModel[];
  tourProgressCircumference: number;
}

export function SceneOverlay({
  activeSlideId,
  currentSlide,
  introParagraph,
  isTextExpanded,
  isTourPlaying,
  onSlideSelect,
  onTextExpandedChange,
  onTourToggle,
  progressOffset,
  slides,
  tourProgressCircumference,
}: SceneOverlayProps) {
  return (
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
                onClick={() => onSlideSelect(slide.id)}
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
                {currentSlide.extraParagraphs.map((paragraph, index) => (
                  <p className="slide-text-paragraph" key={`${currentSlide.id}-paragraph-${index + 1}`}>
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}
            {currentSlide.fullText && currentSlide.extraParagraphs.length > 0 ? (
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
    </div>
  );
}