import { useEffect, useState } from "react";
import { Check, CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import { useDemoFlow } from "./DemoFlowContext";
import { formatDemoPrice } from "./menuData";
import { DemoLink, withOrderType } from "./navigation";
import { paymentLabels, statusLabels, type OrderStatus } from "./orderModel";
import { OrderLines } from "./DemoUi";

const steps: OrderStatus[] = ["received", "waiting", "accepted", "preparing", "ready"];
export function DemoOrderPage({ reference }: { reference: string }) {
  const flow = useDemoFlow()!;
  const dispatch = flow.dispatch;
  const order = flow.order?.reference === reference ? flow.order : null;
  const [estimate, setEstimate] = useState(10);
  useEffect(() => { if (order && !order.cartConsumed) flow.consumeReceipt(); }, [order, flow]);
  useEffect(() => {
    if (order?.status !== "received") return;
    const timer = setTimeout(() => dispatch({ type: "order_created" }), 1500);
    return () => clearTimeout(timer);
  }, [order?.status, dispatch]);
  if (!order) return <section className="demo-ordering"><h1>Demobeställningen hittades inte</h1><p>Kvittot finns bara i den här webbläsarsessionen.</p><DemoLink href={withOrderType("/menu")}>Tillbaka till menyn</DemoLink></section>;
  const currentIndex = steps.indexOf(order.status);
  return <section className="demo-ordering demo-confirmation">
    <div className="demo-confirmation-heading"><CheckCircle2 size={32} aria-hidden="true" /><h1 tabIndex={-1}>Din beställning har tagits emot</h1><p>Detta är en demonstration. Ingen riktig beställning har skickats till restaurangen.</p></div>
    <div className="demo-checkout-grid">
      <section className="demo-receipt" aria-labelledby="receipt-title">
        <h2 id="receipt-title">Alibaba Restaurant</h2>
        <p className="demo-muted">Demokvitto · Inte ett giltigt kassakvitto</p>
        <dl className="demo-receipt-meta">
          <div><dt>Ordernummer</dt><dd>{order.reference}</dd></div>
          <div><dt>Datum och tid</dt><dd><time dateTime={order.createdAt}>{new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Stockholm" }).format(new Date(order.createdAt))}</time></dd></div>
          <div><dt>Beställningstyp</dt><dd>{order.orderType === "dine-in" ? "Äta här" : "Ta med"}</dd></div>
          <div><dt>Demobetalning</dt><dd>{paymentLabels[order.paymentMethod]}</dd></div>
        </dl>
        <OrderLines lines={order.lines} />
        <div className="demo-total"><span>Totalt</span><strong>{formatDemoPrice(order.totalOre)}</strong></div>
        <p className="demo-muted">Betalning simulerad. Inga pengar har dragits.</p>
        <p>Demostatus: <strong>{statusLabels[order.status]}</strong></p>
      </section>
      <section className="demo-status-section" aria-labelledby="status-title">
        <h2 id="status-title">Följ din demobeställning</h2>
        <p role="status" className="demo-current-status">{order.status === "rejected" ? <XCircle size={20} /> : <Clock size={20} />}{statusLabels[order.status]}</p>
        <ol className="demo-timeline">
          {steps.map((status, index) => <li key={status} className={index <= currentIndex ? "is-complete" : ""} aria-current={order.status === status ? "step" : undefined}>
            <span className="demo-timeline-icon">{index < currentIndex ? <Check size={17} /> : <Circle size={16} />}</span><span>{statusLabels[status]}</span>
          </li>)}
        </ol>
        {order.estimateMinutes && order.status !== "ready" ? <p className="demo-estimate">Simulerad beräknad tillagningstid: {order.estimateMinutes} minuter. Detta är ingen verklig tidsuppskattning.</p> : null}
        <fieldset className="demo-simulator">
          <legend>Demokontroller · utveckling</legend>
          <p>Restaurangen är inte ansluten. Ändra status manuellt för att testa flödet.</p>
          {order.status === "waiting" ? <><label className="demo-estimate-input">Simulerad tid (minuter)<input type="number" min="1" max="120" value={Number.isNaN(estimate) ? "" : estimate} onChange={event => setEstimate(event.target.valueAsNumber)} /></label><button className="demo-primary" disabled={!Number.isInteger(estimate) || estimate < 1 || estimate > 120} onClick={() => flow.dispatch({ type: "order_accepted", estimateMinutes: estimate })}>Simulera godkännande</button></> : null}
          {order.status === "accepted" ? <button className="demo-primary" onClick={() => flow.dispatch({ type: "order_preparing" })}>Simulera tillagning</button> : null}
          {order.status === "preparing" ? <button className="demo-primary" onClick={() => flow.dispatch({ type: "order_ready" })}>Markera som redo i demo</button> : null}
          {["waiting", "accepted", "preparing"].includes(order.status) ? <button className="demo-secondary" onClick={() => flow.dispatch({ type: "order_rejected" })}>Simulera avvisning</button> : null}
          {order.status === "ready" || order.status === "rejected" ? <p>Demoflödet är avslutat.</p> : null}
        </fieldset>
      </section>
    </div>
    <div className="demo-receipt-actions"><DemoLink className="demo-secondary" href={withOrderType("/menu")}>Tillbaka till menyn</DemoLink><button className="demo-primary" onClick={flow.newOrder}>Starta en ny demobeställning</button></div>
  </section>;
}
