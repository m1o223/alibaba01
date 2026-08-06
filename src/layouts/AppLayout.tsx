import type { ReactNode } from "react";
import { Menu, ShoppingCart } from "lucide-react";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <header className="app-header" aria-label="Site header">
        <button className="icon-button" type="button" aria-label="Open menu">
          <Menu aria-hidden="true" size={30} strokeWidth={2.7} />
        </button>

        <a className="brand-mark" href="/" aria-label="Alibaba home">
          Alibaba
        </a>

        <button className="cart-button" type="button" aria-label="Open cart">
          <ShoppingCart aria-hidden="true" size={26} strokeWidth={2.5} />
          <span className="cart-count" aria-label="Cart items">
            0
          </span>
        </button>
      </header>
      <main className="app-main">
        {children}
      </main>
      <footer className="app-footer">
        <p>© Alibaba Restaurant</p>
        <p>All Rights Reserved</p>
      </footer>
    </div>
  );
}
