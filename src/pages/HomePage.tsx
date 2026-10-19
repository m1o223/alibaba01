export function HomePage() {
  function chooseOrderType(orderType: "dine-in" | "takeaway") {
    try {
      sessionStorage.setItem("alibaba.orderType", orderType);
    } catch {
      // The URL retains the choice when browser storage is unavailable.
    }
    window.location.href = `/menu?orderType=${orderType}`;
  }

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

      <section className="home-order-actions" aria-label="Välj beställningstyp">
        <p>
          <button className="home-order-primary" type="button" onClick={() => chooseOrderType("dine-in")}>
            <span>Äta här</span>
          </button>
        </p>
        <p>
          <button className="home-order-secondary" type="button" onClick={() => chooseOrderType("takeaway")}>
            <span>Ta med</span>
          </button>
        </p>
      </section>
    </div>
  );
}
