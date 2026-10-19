import { useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import { X } from "lucide-react";

type AuthMode = "login" | "signup";

type AuthBottomSheetProps = {
  isOpen: boolean;
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

export function AuthBottomSheet({ isOpen, mode, onModeChange, onClose, returnFocusRef }: AuthBottomSheetProps) {
  const sheetRef = useRef<HTMLElement>(null);
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const sheet = sheetRef.current;
    const returnTarget = returnFocusRef.current;
    const scrollY = window.scrollY;
    const { position, top, width } = document.body.style;
    // Fixed-body locking also prevents background rubber-banding on mobile Safari.
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    sheet?.querySelector<HTMLButtonElement>(".auth-sheet-close")?.focus({ preventScroll: true });

    function trapFocus(event: KeyboardEvent) {
      if (event.key !== "Tab" || !sheet) return;
      const controls = sheet.querySelectorAll<HTMLElement>('button:not(:disabled):not([tabindex="-1"]), input:not(:disabled), a[href]');
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    // VisualViewport accounts for keyboards that overlay the CSS viewport on iOS.
    const viewport = window.visualViewport;
    function fitVisibleViewport() {
      if (!viewport || viewport.scale !== 1) return;
      sheet?.style.setProperty("--auth-visible-height", `${viewport.height * 0.9}px`);
      sheet?.style.setProperty("--auth-keyboard-offset", `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`);
    }
    fitVisibleViewport();
    viewport?.addEventListener("resize", fitVisibleViewport);
    viewport?.addEventListener("scroll", fitVisibleViewport);
    sheet?.addEventListener("keydown", trapFocus);
    return () => {
      viewport?.removeEventListener("resize", fitVisibleViewport);
      viewport?.removeEventListener("scroll", fitVisibleViewport);
      sheet?.removeEventListener("keydown", trapFocus);
      document.body.style.position = position;
      document.body.style.top = top;
      document.body.style.width = width;
      window.scrollTo(0, scrollY);
      returnTarget?.focus({ preventScroll: true });
    };
  }, [isOpen, returnFocusRef]);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    const distance = event.clientY - start.y;
    setDragY(distance > Math.abs(event.clientX - start.x) ? Math.max(0, distance) : 0);
  }

  function endDrag(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    const distance = event.clientY - start.y;
    const threshold = Math.min(96, (sheetRef.current?.clientHeight ?? 480) * 0.2);
    gesture.current = null;
    setIsDragging(false);
    setDragY(0);
    if (!cancelled && distance > threshold && distance > Math.abs(event.clientX - start.x)) onClose();
  }

  return (
    <>
      <div className={`auth-overlay ${isOpen ? "is-open" : ""}`} aria-hidden="true" onClick={onClose} />
      <aside
        ref={sheetRef}
        className={`auth-sheet ${isOpen ? "is-open" : ""} ${isDragging ? "is-dragging" : ""}`}
        style={{ transform: isOpen && isDragging ? `translateY(${dragY}px)` : undefined }}
        role="dialog"
        aria-modal={isOpen || undefined}
        aria-hidden={!isOpen}
        inert={!isOpen}
        aria-labelledby="auth-sheet-title"
      >
        <div
          className="auth-sheet-handle"
          aria-hidden="true"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={event => endDrag(event)}
          onPointerCancel={event => endDrag(event, true)}
          onLostPointerCapture={event => endDrag(event, true)}
        ><span /></div>
        <div className="auth-sheet-heading">
          <h2 id="auth-sheet-title">{mode === "login" ? "Logga in" : "Skapa konto"}</h2>
          <button className="auth-sheet-close" type="button" aria-label="Stäng inloggning" onClick={onClose}>
            <X aria-hidden="true" size={24} strokeWidth={2.6} />
          </button>
        </div>
        <div className="auth-sheet-body">
          <div className="auth-tabs" role="tablist" aria-label="Inloggning och registrering">
            {(["login", "signup"] as const).map(tab => (
              <button
                key={tab}
                id={`auth-tab-${tab}`}
                type="button"
                role="tab"
                aria-selected={mode === tab}
                aria-controls="auth-panel"
                tabIndex={mode === tab ? 0 : -1}
                onClick={() => onModeChange(tab)}
                onKeyDown={event => {
                  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                  event.preventDefault();
                  const next = event.key === "Home" ? "login" : event.key === "End" ? "signup" : mode === "login" ? "signup" : "login";
                  onModeChange(next);
                  document.getElementById(`auth-tab-${next}`)?.focus();
                }}
              >{tab === "login" ? "Logga in" : "Skapa konto"}</button>
            ))}
          </div>
          <div id="auth-panel" role="tabpanel" aria-labelledby={`auth-tab-${mode}`}>
            <form className="auth-form">
              <label>
                <span>E-post</span>
                <input type="email" autoComplete="email" />
              </label>
              <label>
                <span>Lösenord</span>
                <input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} />
              </label>
              {mode === "signup" ? (
                <label>
                  <span>Bekräfta lösenord</span>
                  <input type="password" autoComplete="new-password" />
                </label>
              ) : null}
              <button className="auth-primary" type="button">{mode === "login" ? "Logga in" : "Skapa konto"}</button>
            </form>
            <div className="auth-separator"><span>eller</span></div>
            {/* No Google authentication handler exists in this UI prototype yet. */}
            <button className="auth-google" type="button" disabled title="Google-inloggning är inte tillgänglig ännu">
              Fortsätt med Google
            </button>
            <p className="auth-mode-switch">
              {mode === "login" ? "Har du inget konto?" : "Har du redan ett konto?"}
              <button type="button" onClick={() => onModeChange(mode === "login" ? "signup" : "login")}>
                {mode === "login" ? "Skapa konto" : "Logga in"}
              </button>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
