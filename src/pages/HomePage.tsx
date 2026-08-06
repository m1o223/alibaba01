import {
  PackageCheck,
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
    </div>
  );
}
