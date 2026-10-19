import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  ExternalLink,
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const isHomePage = currentPath === "/";
  const isContactPage = currentPath === "/contact";
  const pageClass = (className: string, homeClass?: string) => isHomePage ? homeClass : className;
  const facebookUrl = "https://www.facebook.com/share/1Bkx4G3fua/?mibextid=wwXIfr";
  const googleMapsUrl = "https://maps.app.goo.gl/zz8XnzbbCyZCgfGe7?g_st=it";
  const googleMapsEmbedUrl = "https://www.google.com/maps?q=Ali%20Baba%20resturang%20%26%20Pizzaria%2C%20Stockholmsv%C3%A4gen%2018%2C%20602%2017%20Norrk%C3%B6ping&ftid=0x46593a33e8b252b1:0x3363eb694b6ccaf5&output=embed";

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
    <div className={isHomePage ? "home-foundation" : "app-shell"} lang="sv">
      <header className={pageClass("app-header")} aria-label="Sidhuvud">
        <button
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
            0
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
        className={`side-menu ${isMenuOpen ? "is-open" : ""}`}
        aria-hidden={!isMenuOpen}
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

          <span className="side-menu-brand alibaba-logo">Alibaba</span>
        </div>

        <nav className="side-menu-nav" aria-label="Huvudmeny">
          <a href="/" onClick={() => setIsMenuOpen(false)}>
            <Home aria-hidden="true" size={22} strokeWidth={2.3} />
            <span>Startsida</span>
            <span className="menu-item-arrow" aria-hidden="true">›</span>
          </a>
          <a href="/menu" onClick={() => setIsMenuOpen(false)}>
            <ClipboardList aria-hidden="true" size={22} strokeWidth={2.3} />
            <span>Meny</span>
            <span className="menu-item-arrow" aria-hidden="true">›</span>
          </a>
          <button type="button" onClick={() => openAuthSheet("login")}>
            <LogIn aria-hidden="true" size={22} strokeWidth={2.3} />
            <span>Logga in</span>
            <span className="menu-item-arrow" aria-hidden="true">›</span>
          </button>
          <a href="/about" onClick={() => setIsMenuOpen(false)}>
            <Info aria-hidden="true" size={22} strokeWidth={2.3} />
            <span>Om oss</span>
            <span className="menu-item-arrow" aria-hidden="true">›</span>
          </a>
          <a href="/contact" onClick={() => setIsMenuOpen(false)}>
            <MessageCircle aria-hidden="true" size={22} strokeWidth={2.3} />
            <span>Kontakta oss</span>
            <span className="menu-item-arrow" aria-hidden="true">›</span>
          </a>
        </nav>

        <div className="side-menu-footer">
          <p>Alibaba Restaurant</p>
          <span>Utsökt shawarma med en smak du aldrig glömmer.</span>
        </div>
      </aside>

      <aside
        id="cart-drawer"
        className={`cart-drawer ${isCartOpen ? "is-open" : ""}`}
        aria-hidden={!isCartOpen}
        aria-labelledby="cart-drawer-title"
      >
        <div className="cart-drawer-hero">
          <button
            className="cart-drawer-close"
            type="button"
            aria-label="Stäng varukorg"
            onClick={() => setIsCartOpen(false)}
          >
            <X aria-hidden="true" size={24} strokeWidth={2.6} />
          </button>

          <span className="cart-drawer-brand alibaba-logo">Alibaba</span>
        </div>

        <div className="cart-drawer-body">
          <section className="cart-drawer-empty" aria-labelledby="cart-drawer-title">
            <div className="cart-drawer-empty-icon" aria-hidden="true">
              <ShoppingCart size={52} strokeWidth={2.1} />
            </div>
            <h2 id="cart-drawer-title">Din varukorg är tom</h2>
            <p>Lägg till rätter från menyn så visas de här.</p>
            <button
              type="button"
              onClick={() => {
                setIsCartOpen(false);
                window.location.href = "/menu";
              }}
            >
              {"Gå till menyn"}
            </button>
          </section>
        </div>

        <section className="cart-drawer-summary cart-drawer-summary-disabled" aria-label="Beställningsöversikt">
          <div>
            <span>Totalt</span>
            <strong>0 kr</strong>
          </div>
          <button type="button" disabled>
            {"Fortsätt beställningen"}
          </button>
        </section>
      </aside>

      <div
        className={`auth-overlay ${isAuthOpen ? "is-open" : ""}`}
        aria-hidden="true"
        onClick={() => setIsAuthOpen(false)}
      />

      <aside
        className={`auth-sheet ${isAuthOpen ? "is-open" : ""}`}
        aria-hidden={!isAuthOpen}
        aria-labelledby="auth-sheet-title"
      >
        <div className="auth-sheet-hero">
          <button
            className="auth-sheet-close"
            type="button"
            aria-label="Stäng inloggning"
            onClick={() => setIsAuthOpen(false)}
          >
            <X aria-hidden="true" size={23} strokeWidth={2.6} />
          </button>

          <span className="auth-sheet-brand alibaba-logo">Alibaba</span>
        </div>

        <div className="auth-sheet-body">
          <h2 id="auth-sheet-title">
            {authMode === "login" ? "Logga in" : "Skapa konto"}
          </h2>

          <form className="auth-form">
            <label>
              <span>E-post</span>
              <input type="email" autoComplete="email" />
            </label>

            <label>
              <span>Lösenord</span>
              <input
                type="password"
                autoComplete={authMode === "login" ? "current-password" : "new-password"}
              />
            </label>

            {authMode === "signup" ? (
              <label>
                <span>Bekräfta lösenord</span>
                <input type="password" autoComplete="new-password" />
              </label>
            ) : null}

            <button type="button">
              {authMode === "login" ? "Logga in" : "Skapa konto"}
            </button>
          </form>

          <p className="auth-mode-switch">
            {authMode === "login" ? "Har du inget konto?" : "Har du redan ett konto?"}
            <button
              type="button"
              onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
            >
              {authMode === "login" ? "Skapa konto" : "Logga in"}
            </button>
          </p>
        </div>
      </aside>

      <main className={pageClass("app-main")}>
        {children}
      </main>
      <footer id="contact" className={pageClass(`app-footer ${isContactPage ? "app-footer-contact-page" : ""}`, "home-info")}>
        <div className={pageClass("footer-content", "home-info-grid")}>
          <section className={pageClass("footer-brand", "home-info-about")} aria-label="Om Alibaba">
            {!isHomePage ? (
              <a className="footer-logo alibaba-logo" href="/">
                Alibaba
              </a>
            ) : null}
            <p>
              {"Vi serverar utsökt shawarma och nylagade rätter med hög kvalitet och snabb service. Ät hos oss eller ta med maten."}
            </p>
          </section>

          <nav className={pageClass("footer-links", "home-links")} aria-label="Snabblänkar">
            <h2>Snabblänkar</h2>
            <a href="/">Startsida</a>
            <a href="/menu">Meny</a>
            <a href="/about">Om oss</a>
            <a href="/contact">Kontakta oss</a>
          </nav>

          <section className={pageClass("footer-contact", "home-contact")} aria-labelledby="footer-contact-title">
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
          </section>

          <section className={pageClass("footer-map", "home-map")} aria-label="Karta till Alibaba">
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
          </section>
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
