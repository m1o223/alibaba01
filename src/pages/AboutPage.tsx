import { ArrowLeft, ArrowRight, BadgeDollarSign, Heart, History, Route, Utensils, Zap } from "lucide-react";
import { useCircularCarousel } from "../hooks/useCircularCarousel";
import "../styles/about.css";

const highlights = [
  { icon: Zap, title: "Snabb service", text: "Din mat blir snabbt klar." },
  { icon: Utensils, title: "Unik smak", text: "Våra egna recept." },
  { icon: BadgeDollarSign, title: "Prisvärt", text: "Kvalitet till ett bra pris." },
  { icon: Heart, title: "Lagat med kärlek", text: "Vi bryr oss om varje måltid." },
];

const timeline = [
  { title: "2017", text: "Starten i en liten restaurang." },
  { title: "Vi växte", text: "Våra gästers förtroende växte." },
  { title: "Alibaba idag", text: "Större lokaler och fortsatt utveckling." },
];

const cards = [
  {
    title: "Vår historia", icon: History,
    content: <>
      <img className="about-logo" src="/assets/alibaba-logo-transparent.png" alt="Alibaba" width="140" height="140" />
      <h3>Sedan 2017</h3>
      <p>Vi började med en liten restaurang 2017. Tack vare våra gästers förtroende och Alibabas framgång flyttade vi till större lokaler, och vi fortsätter att utvecklas varje dag.</p>
    </>,
  },
  {
    title: "Varför välja Alibaba?", icon: Heart,
    content: <ul className="about-reasons">
      {highlights.map(({ icon: Icon, title, text }) => <li key={title}>
        <span className="about-icon" aria-hidden="true"><Icon size={20} /></span>
        <div><h3>{title}</h3><p>{text}</p></div>
      </li>)}
    </ul>,
  },
  {
    title: "Alibabas resa", icon: Route,
    content: <ol className="about-journey">
      {timeline.map(({ title, text }, index) => <li key={title}>
        <span className="about-milestone" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <div><h3>{title}</h3><p>{text}</p></div>
      </li>)}
    </ol>,
  },
  {
    title: "Vår mat", icon: Utensils,
    content: <>
      <img className="about-food" src="/assets/hero-shawarma.webp" alt="Shawarma" width="240" height="160" />
      <p>Vi serverar utsökt shawarma och nylagade rätter med hög kvalitet och snabb service. Ät hos oss eller ta med maten.</p>
    </>,
  },
  {
    title: "Upptäck vår meny", icon: Utensils,
    content: <div className="about-invitation">
      <img className="about-logo" src="/assets/alibaba-logo-transparent.png" alt="Alibaba" width="140" height="140" />
      <p>Sedan 2017… och vår historia fortsätter.</p>
      <a className="about-menu-link" href="/menu">Upptäck menyn <ArrowRight size={18} aria-hidden="true" /></a>
    </div>,
  },
];

export function AboutPage() {
  const carousel = useCircularCarousel(cards.length);

  return <div className="about-page" aria-labelledby="about-title">
    <div className="about-intro">
      <h1 id="about-title">Om oss</h1>
      <p>Från en liten början 2017… till Alibaba idag.</p>
    </div>
    <div className="about-carousel" role="region" aria-roledescription="karusell" aria-label="Om Alibaba">
      <div className="about-stage" ref={carousel.stageRef} {...carousel.gestureHandlers}>
        {cards.map(({ title, icon: Icon, content }, index) => {
          const active = index === carousel.active;
          const offset = (index - carousel.active + cards.length) % cards.length;
          const direction = offset === 1 ? 1 : offset === cards.length - 1 ? -1 : 0;
          return <article className="about-card" key={title} data-active={active} data-index={index}
            role="group" aria-roledescription="bild" aria-label={`${index + 1} av ${cards.length}: ${title}`}>
            <div className="about-card-body" inert={!active} aria-hidden={!active}>
              <div className="about-card-heading">
                <span className="about-icon" aria-hidden="true"><Icon size={22} /></span>
                <h2 tabIndex={-1}>{title}</h2>
              </div>
              {content}
            </div>
            {!active && direction !== 0 && <button className="about-side-target" type="button"
              aria-label={`Visa ${title}`} disabled={carousel.moving}
              onClick={() => carousel.rotate(direction, true)} />}
          </article>;
        })}
      </div>
      <div className="about-controls">
        <button type="button" aria-label="Föregående kort" title="Föregående kort" disabled={carousel.moving} onClick={() => carousel.rotate(-1)}>
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <output aria-live="polite" aria-atomic="true" aria-label="Aktuellt kort">
          {String(carousel.active + 1).padStart(2, "0")} <span>/ {String(cards.length).padStart(2, "0")}</span>
        </output>
        <button type="button" aria-label="Nästa kort" title="Nästa kort" disabled={carousel.moving} onClick={() => carousel.rotate(1)}>
          <ArrowRight size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>;
}
