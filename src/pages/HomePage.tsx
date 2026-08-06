import { PackageCheck, Utensils } from "lucide-react";

export function HomePage() {
  return (
    <div className="home-page" aria-label="Alibaba restaurant home page">
      <section className="hero-section" aria-labelledby="home-title">
        <div className="hero-content">
          <h1 id="home-title">Alibaba</h1>
          <p>ألذ شاورما... بطعم لا ينسى.</p>
        </div>
        <div className="hero-wave" aria-hidden="true" />
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
