import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, LoaderCircle, X } from "lucide-react";
import type { TrackedOrder } from "./trackingModel";

type Props = { order: TrackedOrder; onAccept: () => void; onReject: () => void; onHome: () => void };
export function OrderConfirmation({ order, onAccept, onReject, onHome }: Props) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = document.getElementById("root");
    const trigger = document.activeElement as HTMLElement | null;
    const wasInert = root?.inert ?? false;
    const filter = root?.style.filter ?? "";
    const scrollY = window.scrollY;
    const { position, top, width, overflow } = document.body.style;
    Object.assign(document.body.style, { position: "fixed", top: `-${scrollY}px`, width: "100%", overflow: "hidden" });
    if (root) { root.inert = true; root.style.filter = "blur(4px)"; }
    const modal = panel.current!;
    function keys(event: KeyboardEvent) {
      if (event.key !== "Tab") return;
      const buttons = [...modal.querySelectorAll<HTMLButtonElement>("button")];
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement?.tagName === "H2")) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    modal.addEventListener("keydown", keys);
    return () => {
      modal.removeEventListener("keydown", keys);
      if (root) { root.inert = wasInert; root.style.filter = filter; }
      Object.assign(document.body.style, { position, top, width, overflow });
      window.scrollTo(0, scrollY);
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => { panel.current?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true }); }, [order.status]);
  return createPortal(<div className="order-confirmation-layer" lang="sv">
    <div className="order-confirmation-backdrop" aria-hidden="true" />
    <section ref={panel} className="order-confirmation" role="dialog" aria-modal="true" aria-labelledby="order-confirmation-title" aria-describedby="order-confirmation-demo" data-status={order.status}>
      <span className="order-demo-label">Demo</span>
      <p className="order-confirmation-brand">Ali Baba</p>
      <p className="order-confirmation-reference">Ordernummer #{order.summary.reference}</p>
      <div className="order-confirmation-state" key={order.status}>
        {order.status === "pending" ? <>
          <LoaderCircle className="order-waiting-icon" size={42} aria-hidden="true" />
          <h2 id="order-confirmation-title" tabIndex={-1}>Väntar på restaurangens bekräftelse…</h2>
          <p>Din beställning väntar på bekräftelse från restaurangen.</p>
          <div className="order-test-controls"><p>Testkontroller · Endast demo</p><div>
            <button type="button" className="order-test-accept" onClick={onAccept} aria-label="Simulera godkännande" title="Simulera godkännande"><Check size={23} aria-hidden="true" /></button>
            <button type="button" className="order-test-reject" onClick={onReject} aria-label="Simulera avvisning" title="Simulera avvisning"><X size={23} aria-hidden="true" /></button>
          </div></div>
        </> : order.status === "accepted" ? <>
          <Check className="order-accepted-icon" size={64} aria-hidden="true" />
          <h2 id="order-confirmation-title" tabIndex={-1}>Beställningen är bekräftad!</h2>
          <p>Din beställning beräknas vara klar om 25 minuter.</p>
          <p className="order-demo-note">Simulerat godkännande och tillagningstid. Restaurangen har inte bekräftat någon beställning.</p>
          <button type="button" className="order-confirmation-primary" onClick={onHome}>OK</button>
        </> : <>
          <X className="order-rejected-icon" size={48} aria-hidden="true" />
          <h2 id="order-confirmation-title" tabIndex={-1}>Beställningen kunde inte accepteras.</h2>
          <p>Produkten är tyvärr slut.</p>
          <p className="order-demo-note">Simulerad avvisning. Orsaken är ett tillfälligt testexempel.</p>
          <button type="button" className="order-confirmation-primary" onClick={onHome}>Till startsidan</button>
        </>}
      </div>
      <p className="order-demo-note" id="order-confirmation-demo">Frontend-demo – ingen riktig betalning eller beställning skickas till restaurangen.</p>
    </section>
  </div>, document.body);
}
