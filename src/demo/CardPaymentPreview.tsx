import { LockKeyhole } from "lucide-react";

export function CardPaymentPreview() {
  return <section className="checkout-card-preview" aria-labelledby="card-payment-title">
    <div className="checkout-card-heading">
      <h2 id="card-payment-title">Kortbetalning</h2>
      <span className="checkout-payment-marks" aria-hidden="true">
        <img className="checkout-payment-mark checkout-payment-mark--visa" src="/assets/payments/visa.svg" alt="" />
        <img className="checkout-payment-mark checkout-payment-mark--mastercard" src="/assets/payments/mastercard.png" alt="" />
      </span>
    </div>
    {/* No form, field names, mutable values, or payment handler in this prototype. */}
    <fieldset disabled aria-describedby="card-payment-unavailable" className="checkout-card-fields">
      <label><span>Kortnummer</span><input type="text" inputMode="numeric" autoComplete="off" placeholder="•••• •••• •••• ••••" value="" readOnly disabled /></label>
      <div className="checkout-card-field-row">
        <label><span>Utgångsdatum</span><input type="text" inputMode="numeric" autoComplete="off" placeholder="MM/ÅÅ" value="" readOnly disabled /></label>
        <label><span>CVC/CVV</span><input type="text" inputMode="numeric" autoComplete="off" placeholder="•••" value="" readOnly disabled /></label>
      </div>
      <label><span>Namn på kortet</span><input type="text" autoComplete="off" value="" readOnly disabled /></label>
    </fieldset>
    <p id="card-payment-unavailable" className="demo-muted" role="status">Kortbetalning är ännu inte tillgänglig.</p>
    <button className="demo-primary" type="button" disabled aria-describedby="card-payment-unavailable"><LockKeyhole size={18} aria-hidden="true" />Betala säkert</button>
  </section>;
}
