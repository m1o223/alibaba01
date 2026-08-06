import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Home, Menu, MessageCircle, ShoppingCart, X } from "lucide-react";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  return (
    <div className="app-shell">
      <header className="app-header" aria-label="Site header">
        <button
          className="icon-button"
          type="button"
          aria-label="Open menu"
          aria-expanded={isMenuOpen}
          aria-controls="site-menu"
          onClick={() => setIsMenuOpen(true)}
        >
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

      <div
        className={`menu-overlay ${isMenuOpen ? "is-open" : ""}`}
        aria-hidden="true"
        onClick={() => setIsMenuOpen(false)}
      />

      <aside
        id="site-menu"
        className={`side-menu ${isMenuOpen ? "is-open" : ""}`}
        aria-hidden={!isMenuOpen}
      >
        <div className="side-menu-header">
          <span className="side-menu-brand">Alibaba</span>
          <button
            className="side-menu-close"
            type="button"
            aria-label="Close menu"
            onClick={() => setIsMenuOpen(false)}
          >
            <X aria-hidden="true" size={24} strokeWidth={2.6} />
          </button>
        </div>

        <nav className="side-menu-nav" aria-label="Main menu">
          <a href="/" onClick={() => setIsMenuOpen(false)}>
            <Home aria-hidden="true" size={22} strokeWidth={2.3} />
            <span>الرئيسية</span>
          </a>
          <a href="#contact" onClick={() => setIsMenuOpen(false)}>
            <MessageCircle aria-hidden="true" size={22} strokeWidth={2.3} />
            <span>تواصل معنا</span>
          </a>
        </nav>
      </aside>

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
