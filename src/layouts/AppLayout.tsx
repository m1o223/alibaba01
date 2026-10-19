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
  const pageClass = (className: string) => isHomePage ? undefined : className;
  const text = (swedish: string, original: string) => isHomePage ? swedish : original;
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

    themeColor.content = "#ffffff";
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
    <div className={isHomePage ? "home-foundation" : "app-shell"} lang={isHomePage ? "sv" : undefined}>
      <header className={pageClass("app-header")} aria-label={text("Sidhuvud", "Site header")}>
        <button
          className={pageClass("icon-button")}
          type="button"
          aria-label={text("Öppna meny", "Open menu")}
          aria-expanded={isMenuOpen}
          aria-controls="site-menu"
          onClick={() => {
            setIsCartOpen(false);
            setIsMenuOpen(true);
          }}
        >
          <Menu aria-hidden="true" size={30} strokeWidth={2.7} />
        </button>

        <a className={pageClass("brand-mark alibaba-logo")} href="/" aria-label={text("Alibaba startsida", "Alibaba home")}>
          Alibaba
        </a>

        <button
          className={pageClass("cart-button")}
          type="button"
          aria-label={text("Öppna varukorg", "Open cart")}
          aria-expanded={isCartOpen}
          aria-controls="cart-drawer"
          onClick={() => {
            setIsMenuOpen(false);
            setIsCartOpen(true);
          }}
        >
          <ShoppingCart aria-hidden="true" size={26} strokeWidth={2.5} />
          <span className={pageClass("cart-count")} aria-label={text("Varor i varukorgen", "Cart items")}>
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
            aria-label={text("Stäng meny", "Close menu")}
            onClick={() => setIsMenuOpen(false)}
          >
            <X aria-hidden="true" size={24} strokeWidth={2.6} />
          </button>

          <span className="side-menu-brand alibaba-logo">Alibaba</span>

          <svg
            className="side-menu-wave"
            viewBox="0 0 430 86"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0 38C40 58 74 70 122 50C172 30 203 18 252 38C302 59 346 68 430 42V86H0V38Z" />
          </svg>
        </div>

        <nav className="side-menu-nav" aria-label={text("Huvudmeny", "Main menu")}>
          <a href="/" onClick={() => setIsMenuOpen(false)}>
            <Home aria-hidden="true" size={22} strokeWidth={2.3} />
            <span>{text("Startsida", "الرئيسية")}</span>
            <span className="menu-item-arrow" aria-hidden="true">›</span>
          </a>
          <a href="/menu" onClick={() => setIsMenuOpen(false)}>
            <ClipboardList aria-hidden="true" size={22} strokeWidth={2.3} />
            <span>{text("Meny", "المنيو")}</span>
            <span className="menu-item-arrow" aria-hidden="true">›</span>
          </a>
          <button type="button" onClick={() => openAuthSheet("login")}>
            <LogIn aria-hidden="true" size={22} strokeWidth={2.3} />
            <span>{text("Logga in", "تسجيل الدخول")}</span>
            <span className="menu-item-arrow" aria-hidden="true">›</span>
          </button>
          <a href="/about" onClick={() => setIsMenuOpen(false)}>
            <Info aria-hidden="true" size={22} strokeWidth={2.3} />
            <span>{text("Om oss", "من نحن")}</span>
            <span className="menu-item-arrow" aria-hidden="true">›</span>
          </a>
          <a href="/contact" onClick={() => setIsMenuOpen(false)}>
            <MessageCircle aria-hidden="true" size={22} strokeWidth={2.3} />
            <span>{text("Kontakta oss", "تواصل معنا")}</span>
            <span className="menu-item-arrow" aria-hidden="true">›</span>
          </a>
        </nav>

        <div className="side-menu-footer">
          <p>Alibaba Restaurant</p>
          <span>{text("Utsökt shawarma med en smak du aldrig glömmer.", "ألذ شاورما... بطعم لا ينسى.")}</span>
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
            aria-label={text("Stäng varukorg", "Close cart")}
            onClick={() => setIsCartOpen(false)}
          >
            <X aria-hidden="true" size={24} strokeWidth={2.6} />
          </button>

          <span className="cart-drawer-brand alibaba-logo">Alibaba</span>

          <svg
            className="cart-drawer-wave"
            viewBox="0 0 430 86"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0 38C40 58 74 70 122 50C172 30 203 18 252 38C302 59 346 68 430 42V86H0V38Z" />
          </svg>
        </div>

        <div className="cart-drawer-body">
          <section className="cart-drawer-empty" aria-labelledby="cart-drawer-title">
            <div className="cart-drawer-empty-icon" aria-hidden="true">
              <ShoppingCart size={52} strokeWidth={2.1} />
            </div>
            <h2 id="cart-drawer-title">{text("Din varukorg är tom", "سلة المشتريات فارغة")}</h2>
            <p>{text("Lägg till rätter från menyn så visas de här.", "ابدأ بإضافة منتجات من المنيو لتظهر هنا.")}</p>
            <button
              type="button"
              onClick={() => {
                setIsCartOpen(false);
                window.location.href = "/menu";
              }}
            >
              {text("Gå till menyn", "الذهاب إلى المنيو")}
            </button>
          </section>
        </div>

        <section className="cart-drawer-summary cart-drawer-summary-disabled" aria-label={text("Beställningsöversikt", "Order summary")}>
          <div>
            <span>{text("Totalt", "إجمالي الطلب")}</span>
            <strong>0 kr</strong>
          </div>
          <button type="button" disabled>
            {text("Fortsätt beställningen", "متابعة الطلب")}
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
            aria-label={text("Stäng inloggning", "Close login")}
            onClick={() => setIsAuthOpen(false)}
          >
            <X aria-hidden="true" size={23} strokeWidth={2.6} />
          </button>

          <span className="auth-sheet-brand alibaba-logo">Alibaba</span>

          <svg
            className="auth-sheet-wave"
            viewBox="0 0 430 86"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0 38C40 58 74 70 122 50C172 30 203 18 252 38C302 59 346 68 430 42V86H0V38Z" />
          </svg>
        </div>

        <div className="auth-sheet-body">
          <h2 id="auth-sheet-title">
            {authMode === "login" ? text("Logga in", "تسجيل الدخول") : text("Skapa konto", "إنشاء حساب")}
          </h2>

          <form className="auth-form">
            <label>
              <span>{text("E-post", "البريد الإلكتروني")}</span>
              <input type="email" autoComplete="email" />
            </label>

            <label>
              <span>{text("Lösenord", "كلمة المرور")}</span>
              <input
                type="password"
                autoComplete={authMode === "login" ? "current-password" : "new-password"}
              />
            </label>

            {authMode === "signup" ? (
              <label>
                <span>{text("Bekräfta lösenord", "تأكيد كلمة المرور")}</span>
                <input type="password" autoComplete="new-password" />
              </label>
            ) : null}

            <button type="button">
              {authMode === "login" ? text("Logga in", "تسجيل الدخول") : text("Skapa konto", "إنشاء حساب")}
            </button>
          </form>

          <p className="auth-mode-switch">
            {authMode === "login" ? text("Har du inget konto?", "ليس لديك حساب؟") : text("Har du redan ett konto?", "لديك حساب بالفعل؟")}
            <button
              type="button"
              onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
            >
              {authMode === "login" ? text("Skapa konto", "إنشاء حساب") : text("Logga in", "تسجيل الدخول")}
            </button>
          </p>
        </div>
      </aside>

      <main className={pageClass("app-main")}>
        {children}
      </main>
      <footer id="contact" className={pageClass(`app-footer ${isContactPage ? "app-footer-contact-page" : ""}`)}>
        <div className={pageClass("footer-content")}>
          <section className={pageClass("footer-brand")} aria-label={text("Om Alibaba", "About Alibaba")}>
            <a className={pageClass("footer-logo alibaba-logo")} href="/">
              Alibaba
            </a>
            <p>
              {text("Vi serverar utsökt shawarma och nylagade rätter med hög kvalitet och snabb service. Ät hos oss eller ta med maten.", "نقدم أشهى الشاورما والوجبات الطازجة بجودة عالية وخدمة سريعة، للاستمتاع بالوجبة داخل المطعم أو أخذها معك.")}
            </p>
          </section>

          <nav className={pageClass("footer-links")} aria-label={text("Snabblänkar", "Quick links")}>
            <h2>{text("Snabblänkar", "روابط سريعة")}</h2>
            <a href="/">{text("Startsida", "الصفحة الرئيسية")}</a>
            <a href="/menu">{text("Meny", "المنيو")}</a>
            <a href="/about">{text("Om oss", "من نحن")}</a>
            <a href="/contact">{text("Kontakta oss", "تواصل معنا")}</a>
          </nav>

          <section className={pageClass("footer-contact")} aria-labelledby="footer-contact-title">
            <h2 id="footer-contact-title">{text("Kontakta oss", "تواصل معنا")}</h2>
            <a href="tel:011103358">
              <Phone aria-hidden="true" size={18} strokeWidth={2.3} />
              <span>{text("Telefon: ", "الهاتف")}</span>
              <bdi dir="ltr">011103358</bdi>
            </a>
            <a href="mailto:Blodan17@gmail.com">
              <Mail aria-hidden="true" size={18} strokeWidth={2.3} />
              <span>{text("E-post: ", "البريد")}</span>
              <bdi dir="ltr">Blodan17@gmail.com</bdi>
            </a>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              <MapPin aria-hidden="true" size={18} strokeWidth={2.3} />
              <span>{text("Adress: ", "العنوان")}</span>
              <bdi dir="ltr">Stockholmsvägen 18</bdi>
            </a>
            <a
              className={pageClass("footer-social-link")}
              href={facebookUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={text("Öppna Alibabas Facebook-sida", "Open Alibaba Facebook page")}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
                <path
                  fill="currentColor"
                  d="M22 12A10 10 0 1 0 10.4 21.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.7-1.6 1.5v2h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z"
                />
              </svg>
            </a>
          </section>

          <section className={pageClass("footer-map")} aria-label={text("Karta till Alibaba", "Alibaba location map")}>
            <iframe
              className={pageClass("footer-map-preview")}
              title={text("Alibaba restaurang på Google Maps", "Alibaba Restaurant location on Google Maps")}
              src={googleMapsEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className={pageClass("map-meta")}>
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
                  {text("Öppna i", "فتح في")} <bdi dir="ltr">Google Maps</bdi>
                </span>
                <ExternalLink aria-hidden="true" size={15} strokeWidth={2.3} />
              </a>
            </div>
          </section>
        </div>

        <div className={pageClass("footer-bottom")}>
          <p dir="ltr">
            © 2017 <span className={pageClass("alibaba-logo")}>Alibaba</span> Restaurant
          </p>
          <p>{text("Alla rättigheter förbehållna", "All Rights Reserved")}</p>
        </div>
      </footer>
    </div>
  );
}
