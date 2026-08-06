import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  ExternalLink,
  Home,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  ShoppingCart,
  X,
} from "lucide-react";

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
      <footer id="contact" className="app-footer">
        <div className="footer-content">
          <section className="footer-brand" aria-label="About Alibaba">
            <a className="footer-logo" href="/">
              Alibaba
            </a>
            <p>
              نقدم أشهى الشاورما والوجبات الطازجة بجودة عالية وخدمة سريعة،
              للاستمتاع بالوجبة داخل المطعم أو أخذها معك.
            </p>
          </section>

          <nav className="footer-links" aria-label="Quick links">
            <h2>روابط سريعة</h2>
            <a href="/">الرئيسية</a>
            <a href="#menu">المنيو</a>
            <a href="#about">من نحن</a>
            <a href="#contact">تواصل معنا</a>
          </nav>

          <section className="footer-contact" aria-labelledby="footer-contact-title">
            <h2 id="footer-contact-title">تواصل معنا</h2>
            <a href="tel:011103358">
              <Phone aria-hidden="true" size={18} strokeWidth={2.3} />
              <span>الهاتف</span>
              <bdi dir="ltr">011103358</bdi>
            </a>
            <a href="mailto:Blodan17@gmail.com">
              <Mail aria-hidden="true" size={18} strokeWidth={2.3} />
              <span>البريد</span>
              <bdi dir="ltr">Blodan17@gmail.com</bdi>
            </a>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Stockholmsv%C3%A4gen%2018"
              target="_blank"
              rel="noreferrer"
            >
              <MapPin aria-hidden="true" size={18} strokeWidth={2.3} />
              <span>العنوان</span>
              <bdi dir="ltr">Stockholmsvägen 18</bdi>
            </a>
          </section>

          <section className="footer-map" aria-label="Alibaba location map">
            <div className="footer-map-preview" aria-hidden="true">
              <span className="map-road map-road-one" />
              <span className="map-road map-road-two" />
              <span className="map-road map-road-three" />
              <span className="map-pin-dot">
                <MapPin aria-hidden="true" size={30} strokeWidth={2.4} />
              </span>
            </div>
            <div className="map-meta">
              <span>
                <MapPin aria-hidden="true" size={17} strokeWidth={2.3} />
                <bdi dir="ltr">Stockholmsvägen 18</bdi>
              </span>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Stockholmsv%C3%A4gen%2018"
                target="_blank"
                rel="noreferrer"
              >
                <span>
                  فتح في <bdi dir="ltr">Google Maps</bdi>
                </span>
                <ExternalLink aria-hidden="true" size={15} strokeWidth={2.3} />
              </a>
            </div>
          </section>
        </div>

        <div className="footer-bottom">
          <p dir="ltr">
            © 2026 <span>Alibaba</span> Restaurant
          </p>
          <p>All Rights Reserved</p>
        </div>
      </footer>
    </div>
  );
}
