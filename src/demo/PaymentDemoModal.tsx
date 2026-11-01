import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, LoaderCircle, Printer, X } from "lucide-react";
import { formatDemoPrice } from "./menuData";
import { paymentLabels, type OrderType, type PaymentMethod, type ReceiptLine } from "./orderModel";
import { OrderLines } from "./DemoUi";
import "./payment-demo.css";

// A memory-only display snapshot, deliberately separate from persisted demo orders.
export type PaymentPreview = {
  reference: string;
  createdAt: string;
  orderType: OrderType | "delivery";
  paymentMethod: PaymentMethod;
  lines: ReceiptLine[];
  totalOre: number;
};

const orderTypeLabels = { "dine-in": "Äta på plats", takeaway: "Hämta själv", delivery: "Hemleverans" };

export function PaymentDemoModal({ receipt, onClose }: { receipt: PaymentPreview; onClose: () => void }) {
  const [phase, setPhase] = useState<"processing" | "confirmed" | "receipt">("processing");
  const panel = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const confirmation = window.setTimeout(() => setPhase("confirmed"), 3000);
    const showReceipt = window.setTimeout(() => setPhase("receipt"), 3900);
    return () => { clearTimeout(confirmation); clearTimeout(showReceipt); };
  }, []);

  useEffect(() => {
    const root = document.getElementById("root");
    const trigger = document.activeElement as HTMLElement | null;
    const wasInert = root?.inert ?? false;
    const previousFilter = root?.style.filter ?? "";
    const scrollY = window.scrollY;
    const { position, top, width, overflow } = document.body.style;
    Object.assign(document.body.style, { position: "fixed", top: `-${scrollY}px`, width: "100%", overflow: "hidden" });
    if (root) { root.inert = true; root.style.filter = "blur(4px)"; }
    const modal = panel.current!;
    modal.querySelector<HTMLButtonElement>(".payment-demo-close")?.focus({ preventScroll: true });
    function keys(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const controls = [...modal.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === title.current)) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    modal.addEventListener("keydown", keys);
    return () => {
      modal.removeEventListener("keydown", keys);
      if (root) { root.inert = wasInert; root.style.filter = previousFilter; }
      Object.assign(document.body.style, { position, top, width, overflow });
      window.scrollTo(0, scrollY);
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [onClose]);

  useEffect(() => {
    if (phase === "receipt") title.current?.focus({ preventScroll: true });
  }, [phase]);

  return createPortal(<div className="payment-demo-layer" lang="sv" dir="ltr" data-phase={phase}>
    <div className="payment-demo-backdrop" aria-hidden="true" />
    <section ref={panel} className="payment-demo-modal demo-ordering" role="dialog" aria-modal="true" aria-labelledby="payment-demo-title" aria-describedby="payment-demo-safety">
      <div className="payment-demo-top"><span className="payment-demo-badge">Demo</span>
        <button type="button" className="payment-demo-close" aria-label="Stäng betalningsdemo" onClick={onClose}><X size={22} aria-hidden="true" /></button>
      </div>
      {phase !== "receipt" ? <div className="payment-demo-progress" role="status" aria-live="polite">
        <div className="payment-demo-symbol" aria-hidden="true">
          {phase === "processing" ? <LoaderCircle className="payment-demo-spinner" size={64} strokeWidth={2} /> : <Check className="payment-demo-check" size={64} strokeWidth={2} />}
        </div>
        <h2 id="payment-demo-title">{phase === "processing" ? "Kontrollerar betalningen…" : "Demobetalning bekräftad"}</h2>
        <p>{phase === "processing" ? "Enbart en simulering." : "Ingen riktig betalning har genomförts."}</p>
      </div> : <div className="payment-demo-receipt">
        <header className="payment-demo-receipt-heading"><h2 id="payment-demo-title" ref={title} tabIndex={-1}>Ali Baba</h2><p>Demokvitto</p></header>
        <dl className="payment-demo-meta">
          <div><dt>Tillfälligt demonummer</dt><dd>{receipt.reference}</dd></div>
          <div><dt>Datum och tid</dt><dd><time dateTime={receipt.createdAt}>{new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeStyle: "short" }).format(new Date(receipt.createdAt))}</time></dd></div>
          <div><dt>Beställningstyp</dt><dd>{orderTypeLabels[receipt.orderType]}</dd></div>
          <div><dt>Betalsätt (demo)</dt><dd>{paymentLabels[receipt.paymentMethod]}</dd></div>
        </dl>
        <OrderLines lines={receipt.lines} />
        <dl className="payment-demo-totals">
          <div><dt>Delsumma</dt><dd>{formatDemoPrice(receipt.totalOre)}</dd></div>
          <div className="payment-demo-grand-total"><dt>Totalt</dt><dd>{formatDemoPrice(receipt.totalOre)}</dd></div>
        </dl>
        {receipt.orderType === "delivery" ? <p>Hemleverans är ännu inte tillgänglig. Leveransavgift är inte fastställd och ingår inte i beloppet.</p> : null}
      </div>}
      <p className="payment-demo-safety" id="payment-demo-safety">Demo – ingen riktig betalning eller beställning genomförs. Detta är inte ett betalningsbevis eller ett giltigt kvitto.</p>
      {phase === "receipt" ? <div className="payment-demo-actions">
        <button type="button" className="payment-demo-secondary" onClick={onClose}>Stäng</button>
        <button type="button" className="demo-primary" onClick={() => window.print()}><Printer size={18} aria-hidden="true" />Skriv ut</button>
      </div> : null}
    </section>
  </div>, document.body);
}
