import {
  ShoppingCart,
  X,
} from "lucide-react";

export function CartPage() {
  return (
    <div className="cart-page" aria-labelledby="cart-page-title">
      <header className="cart-page-header">
        <a className="cart-close-button" href="/" aria-label="Close cart">
          <X aria-hidden="true" size={24} strokeWidth={2.5} />
        </a>
        <h1 id="cart-page-title">سلة المشتريات</h1>
      </header>

      <section className="cart-brand-panel" aria-label="Alibaba cart intro">
        <div className="cart-brand-content">
          <span className="alibaba-logo">Alibaba</span>
          <p>راجع طلبك قبل المتابعة.</p>
        </div>
        <svg
          className="cart-brand-wave"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 70C98 96 158 98 248 66C342 34 430 34 520 62C626 95 702 110 812 76C912 44 1000 25 1102 58C1212 94 1308 94 1440 62V120H0V70Z" />
        </svg>
      </section>

      <section className="cart-empty-state" aria-label="Empty shopping cart">
        <div className="cart-empty-icon" aria-hidden="true">
          <ShoppingCart size={52} strokeWidth={2.1} />
        </div>
        <h2>سلة المشتريات فارغة</h2>
        <p>ابدأ بإضافة منتجات من المنيو لتظهر هنا.</p>
        <a className="cart-menu-link" href="/#menu">الذهاب إلى المنيو</a>
      </section>

      <section className="cart-summary cart-summary-disabled" aria-label="Order summary">
        <div>
          <span>إجمالي الطلب</span>
          <strong>0 kr</strong>
        </div>
        <button type="button" disabled>
          متابعة الطلب
        </button>
      </section>
    </div>
  );
}
