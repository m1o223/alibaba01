import { navigate } from "../navigation";

export function HomePage() {
  return (
    <div className="home-intro" aria-label="Alibaba restaurang, startsida">
      <section aria-labelledby="home-title">
        <div>
          <h1 id="home-title">
            <img className="home-logo" src="/assets/alibaba-logo-transparent.png" alt="" width="1280" height="1280" />
            <span className="home-restaurant-name">Alibaba</span>
          </h1>
          <p className="home-description">Utsökt shawarma med en smak du aldrig glömmer.</p>
        </div>
      </section>

      <section className="home-order-actions" aria-label="Meny och beställning">
        <p>
          <button className="home-order-primary" type="button" onClick={() => navigate("/menu")}>
            <span>Se menyn &amp; beställ</span>
          </button>
        </p>
      </section>
    </div>
  );
}
