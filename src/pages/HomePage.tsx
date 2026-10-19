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
    <div aria-label="Alibaba restaurang, startsida">
      <section aria-labelledby="home-title">
        <div>
          <h1 id="home-title">Alibaba</h1>
          <p>Utsökt shawarma med en smak du aldrig glömmer.</p>
        </div>
      </section>

      <section aria-label="Välj beställningstyp">
        <p>
          <button type="button" onClick={() => chooseOrderType("dine-in")}>
            <span>Äta här</span>
          </button>
        </p>
        <p>
          <button type="button" onClick={() => chooseOrderType("takeaway")}>
            <span>Ta med</span>
          </button>
        </p>
      </section>
    </div>
  );
}
