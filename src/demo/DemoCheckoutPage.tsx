import { useEffect, useRef, useState } from "react";
import { CreditCard, LoaderCircle, Smartphone, Wallet } from "lucide-react";
import { useDemoCart } from "./DemoCartContext";
import { useDemoFlow } from "./DemoFlowContext";
import { demoProducts } from "./menuData";
import { DemoLink, getOrderType, withOrderType } from "./navigation";
import { paymentLabels, receiptLines, type OrderType, type PaymentMethod } from "./orderModel";
import { DemoNotice, OrderLines } from "./DemoUi";

const methods = Object.keys(paymentLabels) as PaymentMethod[];
export function DemoCheckoutPage() {
  const cart = useDemoCart()!;
  const flow = useDemoFlow()!;
  const [orderType, setOrderType] = useState<OrderType | null>(getOrderType);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locked = useRef(false);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  if (!cart.count) return <section className="demo-ordering"><h1>Din varukorg är tom</h1><DemoNotice /><DemoLink className="demo-primary" href={withOrderType("/menu")}>Gå till menyn</DemoLink></section>;
  if (!flow.session) return <section className="demo-ordering"><h1>Fortsätt till kassan</h1><DemoNotice /><p>Öppna inloggningen och välj demoläget. Inget riktigt konto skapas.</p><button className="demo-primary" onClick={flow.requestLogin}>Logga in</button></section>;

  function simulatePayment() {
    if (!method || !orderType || locked.current) return;
    locked.current = true;
    setProcessing(true);
    timer.current = setTimeout(() => flow.pay(method, orderType), 900);
  }
  return <section className="demo-ordering demo-checkout" aria-labelledby="checkout-heading" aria-busy={processing}>
    <h1 id="checkout-heading" tabIndex={-1}>Kassan</h1>
    <DemoNotice />
    <div className="demo-checkout-grid">
      <section className="demo-summary-panel">
        <h2>Din beställning</h2>
        <OrderLines lines={receiptLines(cart.lines, demoProducts)} />
        <div className="demo-total"><span>Delsumma</span><strong>{cart.totalLabel}</strong></div>
        <div className="demo-total"><span>Totalt</span><strong>{cart.totalLabel}</strong></div>
        <fieldset className="demo-option-group" disabled={processing}>
          <legend>Beställningstyp</legend>
          {(["dine-in", "takeaway"] as const).map(type => <label className="demo-option" key={type}><input type="radio" name="order-type" checked={orderType === type} onChange={() => {
            setOrderType(type);
            try { sessionStorage.setItem("alibaba.orderType", type); } catch { /* URL also retains the selection. */ }
            const url = new URL(window.location.href); url.searchParams.set("orderType", type); history.replaceState(history.state, "", url);
          }} /><span>{type === "dine-in" ? "Äta här" : "Ta med"}</span></label>)}
        </fieldset>
      </section>
      <section className="demo-payment-section">
        <fieldset className="demo-option-group" disabled={processing}>
          <legend>Välj demobetalning</legend>
          {methods.map(value => <label className="demo-option demo-payment-option" key={value}>
            <input type="radio" name="payment-method" value={value} checked={method === value} onChange={() => setMethod(value)} />
            {value === "card" ? <CreditCard size={20} /> : value === "swish" ? <Smartphone size={20} /> : <Wallet size={20} />}
            <span>{paymentLabels[value]}</span>
          </label>)}
        </fieldset>
        {method ? <div className="demo-payment-preview" key={method}>
          <h2>{paymentLabels[method]} · Demo</h2>
          {method === "card" ? <div className="demo-card-visual"><CreditCard size={26} /><strong>DEMO · TESTKORT</strong><span>Inga kortuppgifter behövs</span></div> : <p>{method === "swish" ? "Swish öppnas inte. Ingen QR-kod eller betalningsbegäran skapas." : "Ingen plånbok öppnas och inget konto debiteras."}</p>}
          <p>Ingen betalningsleverantör är ansluten.</p>
          <div className="demo-total"><span>Demobelopp</span><strong>{cart.totalLabel}</strong></div>
        </div> : null}
        <button className="demo-primary" type="button" disabled={!method || !orderType || processing} onClick={simulatePayment}>
          {processing ? <LoaderCircle className="demo-spinner" size={19} /> : <Wallet size={19} />}{processing ? "Simulerar betalning…" : "Simulera betalning"}
        </button>
        <p className="demo-muted" role="status">{processing ? "Skapar ett demokvitto. Ingen riktig betalning genomförs." : "Demo – ingen riktig betalning genomförs"}</p>
      </section>
    </div>
  </section>;
}
