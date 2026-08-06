import {
  ExternalLink,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  Utensils,
} from "lucide-react";

export function HomePage() {
  return (
    <div className="home-page" aria-label="Alibaba restaurant home page">
      <section className="hero-section" aria-labelledby="home-title">
        <div className="hero-content">
          <h1 id="home-title">Alibaba</h1>
          <p>ألذ شاورما... بطعم لا ينسى.</p>
        </div>
        <svg
          className="hero-wave"
          viewBox="0 0 1440 140"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 90C72 116 148 123 220 88C298 51 374 50 452 76C536 104 604 122 692 98C786 72 846 42 934 62C1028 83 1090 122 1196 96C1300 70 1368 70 1440 94V140H0V90Z" />
        </svg>
      </section>

      <section className="order-type-section" aria-label="Choose order type">
        <button className="order-type-button" type="button">
          <Utensils aria-hidden="true" size={26} strokeWidth={2.4} />
          <span>تناول داخل المطعم</span>
        </button>

        <button className="order-type-button order-type-button-outline" type="button">
          <PackageCheck aria-hidden="true" size={26} strokeWidth={2.4} />
          <span>طلب سفري</span>
        </button>
      </section>

      <section id="contact" className="contact-section" aria-labelledby="contact-title">
        <div className="contact-card">
          <h2 id="contact-title">تواصل معنا</h2>

          <div className="contact-list">
            <a className="contact-row" href="tel:011103358">
              <Phone aria-hidden="true" size={22} strokeWidth={2.3} />
              <span className="contact-text">
                <span>الهاتف:</span>
                <bdi dir="ltr">011103358</bdi>
              </span>
            </a>

            <a className="contact-row" href="mailto:Blodan17@gmail.com">
              <Mail aria-hidden="true" size={22} strokeWidth={2.3} />
              <span className="contact-text">
                <span>البريد:</span>
                <bdi dir="ltr">Blodan17@gmail.com</bdi>
              </span>
            </a>

            <div className="contact-row">
              <MapPin aria-hidden="true" size={22} strokeWidth={2.3} />
              <span className="contact-text">
                <span>العنوان:</span>
                <bdi dir="ltr">Stockholmsvägen 18</bdi>
              </span>
            </div>
          </div>

          <a
            className="maps-link"
            href="https://www.google.com/maps/search/?api=1&query=Stockholmsv%C3%A4gen%2018"
            target="_blank"
            rel="noreferrer"
          >
            <MapPin aria-hidden="true" size={20} strokeWidth={2.3} />
            <span>
              فتح في <bdi dir="ltr">Google Maps</bdi>
            </span>
            <ExternalLink aria-hidden="true" size={18} strokeWidth={2.3} />
          </a>
        </div>
      </section>
    </div>
  );
}
