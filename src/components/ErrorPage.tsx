import { useEffect, useRef } from "react";
import { ArrowLeft, House, RotateCcw } from "lucide-react";
import { TakeawayBagIcon } from "./TakeawayBagIcon";
import { goBackFromError, navigate } from "../navigation";
import type { PageErrorKind } from "../errors/errorModel";
import "../styles/errors.css";

const messages = {
  "not-found": { title: "Sidan kunde inte hittas", description: "Sidan du söker finns inte eller har flyttats." },
  server: { title: "Hoppsan! Något gick fel.", description: "Vi kunde inte öppna sidan just nu. Försök igen om en stund." },
  network: { title: "Ingen internetanslutning", description: "Kontrollera din internetanslutning och försök igen." },
};

export function ErrorPage({ kind, onRetry, onHome }: { kind: PageErrorKind; onRetry?: () => void; onHome?: () => void }) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { title.current?.focus({ preventScroll: true }); }, [kind]);
  const copy = messages[kind];
  return <section className="app-error" data-error-kind={kind} aria-labelledby="error-title">
    <div className="error-illustration" aria-hidden="true">
      <div className="error-bag"><TakeawayBagIcon size={120} /></div>
      <span className="error-exclamation">!</span>
    </div>
    <h1 id="error-title" ref={title} tabIndex={-1}>{copy.title}</h1>
    <p>{copy.description}</p>
    <div className="error-actions">
      {kind !== "not-found" ? <button type="button" className="error-primary" onClick={onRetry}>
        <RotateCcw size={18} aria-hidden="true" />Försök igen
      </button> : null}
      {kind !== "network" ? <button type="button" className={kind === "not-found" ? "error-primary" : "error-secondary"} onClick={onHome ?? (() => navigate("/"))}>
        <House size={18} aria-hidden="true" />Till startsidan
      </button> : null}
      {kind === "not-found" ? <button type="button" className="error-secondary" onClick={goBackFromError}>
        <ArrowLeft size={18} aria-hidden="true" />Gå tillbaka
      </button> : null}
    </div>
  </section>;
}
