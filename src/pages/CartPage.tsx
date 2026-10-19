import {
  ShoppingCart,
  X,
} from "lucide-react";

export function CartPage() {
  return (
    <div className="cart-page" aria-labelledby="cart-page-title">
      <header className="cart-page-header">
        <a className="cart-close-button" href="/" aria-label="Stäng varukorg">
          <X aria-hidden="true" size={24} strokeWidth={2.5} />
        </a>
        <h1 id="cart-page-title">Varukorg</h1>
      </header>

      <section className="cart-brand-panel" aria-label="Om din beställning">
        <div className="cart-brand-content">
          <span className="alibaba-logo">Alibaba</span>
          <p>Se över din beställning innan du fortsätter.</p>
        </div>
      </section>

      <section className="cart-empty-state" aria-label="Tom varukorg">
        <div className="cart-empty-icon" aria-hidden="true">
          <ShoppingCart size={52} strokeWidth={2.1} />
        </div>
        <h2>Din varukorg är tom</h2>
        <p>Lägg till rätter från menyn så visas de här.</p>
        <a className="cart-menu-link" href="/#menu">Gå till menyn</a>
      </section>

      <section className="cart-summary cart-summary-disabled" aria-label="Beställningsöversikt">
        <div>
          <span>Totalt</span>
          <strong>0 kr</strong>
        </div>
        <button type="button" disabled>
          Fortsätt beställningen
        </button>
      </section>
    </div>
  );
}
