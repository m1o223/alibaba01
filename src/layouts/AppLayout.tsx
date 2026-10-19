import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { CartDrawerContent } from "../components/CartDrawerContent";
import { AuthBottomSheet } from "../components/AuthBottomSheet";
import { useDemoCart } from "../demo/DemoCartContext";
import { useDrawerFocus } from "../hooks/useDrawerFocus";
import {
  ExternalLink,
  ChevronRight,
  ClipboardList,
  Info,
  Home,
  LogIn,
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
  currentPath?: string;
};

export function AppLayout({ children, currentPath = "/" }: AppLayoutProps) {
  const demoCart = useDemoCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const menuRef = useRef<HTMLElement>(null);
  const cartRef = useRef<HTMLElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  useDrawerFocus(menuRef, isMenuOpen);
  useDrawerFocus(cartRef, isCartOpen);
  const menuPath = currentPath.replace(/\/+$/, "") || "/";
  const isHomePage = currentPath === "/";
  const isContactPage = currentPath === "/contact";
  const isMenuPage = currentPath === "/menu";
  const pageClass = (className: string, homeClass?: string) => isHomePage ? homeClass : className;
  const facebookUrl = "https://www.facebook.com/share/1Bkx4G3fua/?mibextid=wwXIfr";
  const googleMapsUrl = "https://maps.app.goo.gl/zz8XnzbbCyZCgfGe7?g_st=it";
  const googleMapsEmbedUrl = "https://www.google.com/maps?q=Ali%20Baba%20resturang%20%26%20Pizzaria%2C%20Stockholmsv%C3%A4gen%2018%2C%20602%2017%20Norrk%C3%B6ping&ftid=0x46593a33e8b252b1:0x3363eb694b6ccaf5&output=embed";
  const facebookLink = (
    <a
      className={pageClass("footer-social-link")}
      href={facebookUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Öppna Alibabas Facebook-sida"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
        <path
          fill="currentColor"
          d="M22 12A10 10 0 1 0 10.4 21.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.7-1.6 1.5v2h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z"
        />
      </svg>
    </a>
  );

  useEffect(() => {
    let themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

    if (!themeColor) {
      themeColor = document.createElement("meta");
      themeColor.name = "theme-color";
      document.head.appendChild(themeColor);
    }

    themeColor.content = currentPath === "/" ? "#29180F" : "#ffffff";
  }, [currentPath]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen || isCartOpen || isAuthOpen ? "hidden" : "";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsCartOpen(false);
        setIsAuthOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen, isCartOpen, isAuthOpen]);

  function openAuthSheet(mode: "login" | "signup" = "login") {
    setAuthMode(mode);
    setIsMenuOpen(false);
    setIsAuthOpen(true);
  }

  return (
    <div className={isHomePage ? "home-foundation" : `app-shell${isContactPage ? " contact-shell" : ""}${isMenuPage ? " menu-shell" : ""}`} lang="sv">
      <header className={pageClass("app-header")} aria-label="Sidhuvud" inert={isAuthOpen}>
        <button
          ref={menuTriggerRef}
          className={pageClass("icon-button")}
          type="button"
          aria-label="Öppna meny"
          aria-expanded={isMenuOpen}
          aria-controls="site-menu"
          onClick={() => {
            setIsCartOpen(false);
            setIsMenuOpen(true);
          }}
        >
          <Menu aria-hidden="true" size={30} strokeWidth={2.7} />
        </button>

        {!isHomePage ? (
          <a className="brand-mark alibaba-logo" href="/" aria-label="Alibaba startsida">
            Alibaba
          </a>
        ) : null}

        <button
          className={pageClass("cart-button")}
          type="button"
          aria-label="Öppna varukorg"
          aria-expanded={isCartOpen}
          aria-controls="cart-drawer"
          onClick={() => {
            setIsMenuOpen(false);
            setIsCartOpen(true);
          }}
        >
          <ShoppingCart aria-hidden="true" size={26} strokeWidth={2.5} />
          <span className={pageClass("cart-count")} aria-label="Varor i varukorgen">
            {demoCart?.count ?? 0}
          </span>
        </button>
      </header>

      <div
        className={`menu-overlay ${isMenuOpen || isCartOpen ? "is-open" : ""}`}
        aria-hidden="true"
        onClick={() => {
          setIsMenuOpen(false);
          setIsCartOpen(false);
        }}
      />

      <aside
        id="site-menu"
        ref={menuRef}
        className={`side-menu ${isMenuOpen ? "is-open" : ""}`}
        aria-hidden={!isMenuOpen}
        inert={!isMenuOpen || isAuthOpen}
        role="dialog"
        aria-modal={isMenuOpen || undefined}
        aria-label="Navigationsmeny"
      >
        <div className="side-menu-hero">
          <button
            className="side-menu-close"
            type="button"
            aria-label="Stäng meny"
            onClick={() => setIsMenuOpen(false)}
          >
            <X aria-hidden="true" size={24} strokeWidth={2.6} />
          </button>
        </div>

        <nav className="side-menu-nav" aria-label="Huvudmeny">
          {menuPath !== "/" ? (
            <a href="/" onClick={() => setIsMenuOpen(false)}>
              <span className="side-menu-icon"><Home aria-hidden="true" size={21} strokeWidth={1.8} /></span>
              <span>Startsida</span>
              <ChevronRight className="menu-item-arrow" aria-hidden="true" size={18} strokeWidth={1.8} />
            </a>
          ) : null}
          {menuPath !== "/menu" ? (
            <a href="/menu" onClick={() => setIsMenuOpen(false)}>
              <span className="side-menu-icon"><ClipboardList aria-hidden="true" size={21} strokeWidth={1.8} /></span>
              <span>Meny</span>
              <ChevronRight className="menu-item-arrow" aria-hidden="true" size={18} strokeWidth={1.8} />
            </a>
          ) : null}
          <button type="button" onClick={() => openAuthSheet("login")}>
            <span className="side-menu-icon"><LogIn aria-hidden="true" size={21} strokeWidth={1.8} /></span>
            <span>Logga in</span>
            <ChevronRight className="menu-item-arrow" aria-hidden="true" size={18} strokeWidth={1.8} />
          </button>
          {menuPath !== "/about" ? (
            <a href="/about" onClick={() => setIsMenuOpen(false)}>
              <span className="side-menu-icon"><Info aria-hidden="true" size={21} strokeWidth={1.8} /></span>
              <span>Om oss</span>
              <ChevronRight className="menu-item-arrow" aria-hidden="true" size={18} strokeWidth={1.8} />
            </a>
          ) : null}
          {menuPath !== "/contact" ? (
            <a href="/contact" onClick={() => setIsMenuOpen(false)}>
              <span className="side-menu-icon"><MessageCircle aria-hidden="true" size={21} strokeWidth={1.8} /></span>
              <span>Kontakta oss</span>
              <ChevronRight className="menu-item-arrow" aria-hidden="true" size={18} strokeWidth={1.8} />
            </a>
          ) : null}
        </nav>

        <div className="side-menu-footer">
          <img src="/assets/alibaba-logo-transparent.png" alt="Alibaba" width="1280" height="1280" />
        </div>
      </aside>

      <aside
        id="cart-drawer"
        ref={cartRef}
        className={`cart-drawer ${isCartOpen ? "is-open" : ""}`}
        aria-hidden={!isCartOpen}
        inert={!isCartOpen || isAuthOpen}
        role="dialog"
        aria-modal={isCartOpen || undefined}
        aria-labelledby="cart-drawer-title"
      >
        <div className="cart-drawer-hero">
          <h2 id="cart-drawer-title">Din varukorg</h2>
          <button
            className="cart-drawer-close"
            type="button"
            aria-label="Stäng varukorg"
            onClick={() => setIsCartOpen(false)}
          >
            <X aria-hidden="true" size={24} strokeWidth={2.6} />
          </button>
        </div>

        {demoCart && demoCart.count > 0 ? <p className="demo-cart-notice">Demovarukorg. Tillfälliga priser. Beställning och betalning är avstängda.</p> : null}
        <CartDrawerContent
          items={demoCart?.items ?? []}
          totalLabel={demoCart?.totalLabel ?? "0 kr"}
          onQuantityChange={demoCart?.changeQuantity}
          onRemove={demoCart?.remove}
          onGoToMenu={() => {
            setIsCartOpen(false);
            window.location.href = __DEMO_MENU__ ? `/menu${window.location.search}` : "/menu";
          }}
        />
      </aside>

      <AuthBottomSheet
        isOpen={isAuthOpen}
        mode={authMode}
        onModeChange={setAuthMode}
        onClose={() => setIsAuthOpen(false)}
        returnFocusRef={menuTriggerRef}
      />

      <main className={pageClass("app-main")} inert={isAuthOpen}>
        {children}
      </main>
      <footer id="contact" className={pageClass(`app-footer ${isContactPage ? "app-footer-contact-page" : ""}`, "home-info")} inert={isAuthOpen}>
        <div className={pageClass("footer-content", "home-info-grid")}>
          {!isContactPage ? <section className={pageClass("footer-brand", "home-info-about")} aria-label="Om Alibaba">
            {!isHomePage ? (
              <a className="footer-logo alibaba-logo" href="/">
                Alibaba
              </a>
            ) : null}
            <p>
              {"Vi serverar utsökt shawarma och nylagade rätter med hög kvalitet och snabb service. Ät hos oss eller ta med maten."}
            </p>
          </section> : null}

          <nav className={pageClass("footer-links", "home-links")} aria-label="Snabblänkar">
            <h2>Snabblänkar</h2>
            <a href="/">Startsida</a>
            <a href="/menu">Meny</a>
            <a href="/about">Om oss</a>
            <a href="/contact">Kontakta oss</a>
          </nav>

          {isContactPage ? facebookLink : <section className={pageClass("footer-contact", "home-contact")} aria-labelledby="footer-contact-title">
            <h2 id="footer-contact-title">Kontakta oss</h2>
            <a href="tel:011103358">
              <Phone aria-hidden="true" size={18} strokeWidth={2.3} />
              <span>{"Telefon: "}</span>
              <bdi dir="ltr">011103358</bdi>
            </a>
            <a href="mailto:Blodan17@gmail.com">
              <Mail aria-hidden="true" size={18} strokeWidth={2.3} />
              <span>{"E-post: "}</span>
              <bdi dir="ltr">Blodan17@gmail.com</bdi>
            </a>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              <MapPin aria-hidden="true" size={18} strokeWidth={2.3} />
              <span>{"Adress: "}</span>
              <bdi dir="ltr">Stockholmsvägen 18</bdi>
            </a>
            {facebookLink}
          </section>}

          {!isContactPage ? <section className={pageClass("footer-map", "home-map")} aria-label="Karta till Alibaba">
            <iframe
              className={pageClass("footer-map-preview")}
              title="Alibaba restaurang på Google Maps"
              src={googleMapsEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className={pageClass("map-meta", "home-map-meta")}>
              <span>
                <MapPin aria-hidden="true" size={17} strokeWidth={2.3} />
                <bdi dir="ltr">Stockholmsvägen 18</bdi>
              </span>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                <span>
                  {"Öppna i"} <bdi dir="ltr">Google Maps</bdi>
                </span>
                <ExternalLink aria-hidden="true" size={15} strokeWidth={2.3} />
              </a>
            </div>
          </section> : null}
        </div>

        <div className={pageClass("footer-bottom", "home-copyright")}>
          <p dir="ltr">
            © 2017 <span className={pageClass("alibaba-logo")}>Alibaba</span> Restaurant
          </p>
          <p>Alla rättigheter förbehållna</p>
        </div>
      </footer>
    </div>
  );
}
