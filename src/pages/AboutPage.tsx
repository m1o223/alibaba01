import {
  BadgeDollarSign,
  Heart,
  Sparkles,
  Utensils,
  Zap,
} from "lucide-react";

const highlights = [
  {
    icon: Zap,
    title: "Snabb service",
    text: "Din mat blir snabbt klar.",
  },
  {
    icon: Utensils,
    title: "Unik smak",
    text: "Våra egna recept.",
  },
  {
    icon: BadgeDollarSign,
    title: "Prisvärt",
    text: "Kvalitet till ett bra pris.",
  },
  {
    icon: Heart,
    title: "Lagat med kärlek",
    text: "Vi bryr oss om varje måltid.",
  },
];

const timeline = [
  {
    title: "2017",
    text: "Starten i en liten restaurang.",
  },
  {
    title: "Vi växte",
    text: "Våra gästers förtroende växte.",
  },
  {
    title: "Alibaba idag",
    text: "Större lokaler och fortsatt utveckling.",
  },
];

export function AboutPage() {
  return (
    <div className="about-page" aria-labelledby="about-title">
      <section className="about-hero">
        <div className="about-hero-copy">
          <p>Vår historia</p>
          <h1 id="about-title">Från en liten början 2017… till Alibaba idag.</h1>
        </div>
      </section>

      <section className="about-story" aria-labelledby="about-story-title">
        <span className="about-kicker">Vår historia</span>
        <h2 id="about-story-title">Sedan 2017</h2>
        <p>
          Vi började med en liten restaurang 2017. Tack vare våra gästers förtroende och Alibabas framgång flyttade vi till större lokaler, och vi fortsätter att utvecklas varje dag.
        </p>
      </section>

      <section className="about-highlights" aria-labelledby="about-highlights-title">
        <h2 id="about-highlights-title">Varför välja Alibaba?</h2>
        <div className="about-highlight-grid">
          {highlights.map((highlight) => {
            const Icon = highlight.icon;

            return (
              <article className="about-highlight" key={highlight.title}>
                <span aria-hidden="true">
                  <Icon size={24} strokeWidth={2.4} />
                </span>
                <h3>{highlight.title}</h3>
                <p>{highlight.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="about-timeline" aria-labelledby="about-timeline-title">
        <h2 id="about-timeline-title">Alibabas resa</h2>
        <ol>
          {timeline.map((item, index) => (
            <li key={item.title}>
              <span className="about-timeline-dot" aria-hidden="true">
                <Sparkles size={17} strokeWidth={2.5} />
              </span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </div>
              {index < timeline.length - 1 ? (
                <span className="about-timeline-arrow" aria-hidden="true">↓</span>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="about-closing" aria-label="Vår fortsatta resa">
        <p>Sedan 2017… och vår historia fortsätter.</p>
        <a href="/menu">Upptäck menyn</a>
      </section>
    </div>
  );
}
