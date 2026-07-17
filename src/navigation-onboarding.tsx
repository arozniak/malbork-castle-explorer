import type { JSX } from "react";

interface NavigationOnboardingProps {
  onClose: () => void;
  open: boolean;
}

function DragGestureIllustration({ button, reverse = false }: { button: "left" | "right"; reverse?: boolean }): JSX.Element {
  return (
    <div
      className={`gesture-figure gesture-figure--drag gesture-figure--${button}${reverse ? " gesture-figure--reverse" : ""}`}
    >
      <span className="gesture-figure__path" />
      <span className="gesture-figure__path-shadow" />
      <span className="gesture-mouse">
        <span className="gesture-mouse__button gesture-mouse__button--left" />
        <span className="gesture-mouse__button gesture-mouse__button--right" />
        <span className="gesture-mouse__wheel" />
      </span>
    </div>
  );
}

function ZoomGestureIllustration(): JSX.Element {
  return (
    <div className="gesture-figure gesture-figure--zoom">
      <span className="gesture-mouse">
        <span className="gesture-mouse__button gesture-mouse__button--left" />
        <span className="gesture-mouse__button gesture-mouse__button--right" />
        <span className="gesture-mouse__wheel" />
      </span>
    </div>
  );
}

export function NavigationOnboarding({ onClose, open }: NavigationOnboardingProps): JSX.Element | null {
  if (!open) {
    return null;
  }

  return (
    <section aria-labelledby="navigation-onboarding-title" aria-modal="true" className="navigation-onboarding" role="dialog">
      <div className="navigation-onboarding__scrim" />
      <div className="navigation-onboarding__panel">
        <h2 className="navigation-onboarding__title" id="navigation-onboarding-title">How to Navigate</h2>
        <div className="navigation-onboarding__tips">
          <article className="navigation-tip">
            <div aria-hidden="true" className="navigation-tip__figure">
              <DragGestureIllustration button="left" />
            </div>
            <h3 className="navigation-tip__title">Pan</h3>
            <p className="navigation-tip__hint">Left-click + drag</p>
          </article>
          <article className="navigation-tip">
            <div aria-hidden="true" className="navigation-tip__figure">
              <ZoomGestureIllustration />
            </div>
            <h3 className="navigation-tip__title">Zoom</h3>
            <p className="navigation-tip__hint">Scroll wheel or wheel drag</p>
          </article>
          <article className="navigation-tip">
            <div aria-hidden="true" className="navigation-tip__figure">
              <DragGestureIllustration button="right" reverse />
            </div>
            <h3 className="navigation-tip__title">Rotate</h3>
            <p className="navigation-tip__hint">Right-click + drag</p>
          </article>
        </div>
        <button autoFocus className="navigation-onboarding__button" onClick={onClose} type="button">
          OK
        </button>
      </div>
    </section>
  );
}