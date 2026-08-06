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
    title: "سريع",
    text: "طلباتك جاهزة بسرعة.",
  },
  {
    icon: Utensils,
    title: "طعم مميز",
    text: "وصفاتنا الخاصة.",
  },
  {
    icon: BadgeDollarSign,
    title: "سعر مناسب",
    text: "جودة بسعر جيد.",
  },
  {
    icon: Heart,
    title: "نصنعها بحب",
    text: "نهتم بكل وجبة.",
  },
];

const timeline = [
  {
    title: "2017",
    text: "البداية بمطعم صغير.",
  },
  {
    title: "كبرنا",
    text: "كبرت ثقة زبائننا.",
  },
  {
    title: "Alibaba اليوم",
    text: "مكان أكبر وتطور مستمر.",
  },
];

export function AboutPage() {
  return (
    <div className="about-page" aria-labelledby="about-title">
      <section className="about-hero">
        <img src="/assets/hero-pizza.webp" alt="" />
        <div className="about-hero-copy">
          <p>قصتنا</p>
          <h1 id="about-title">من بداية صغيرة في 2017… إلى Alibaba اليوم.</h1>
        </div>
      </section>

      <section className="about-story" aria-labelledby="about-story-title">
        <span className="about-kicker">قصتنا</span>
        <h2 id="about-story-title">منذ 2017</h2>
        <p>
          بدأنا بمطعم صغير عام 2017. ومع ثقة زبائننا ونجاح Alibaba، انتقلنا إلى مكان أكبر، وما زلنا نتطور كل يوم.
        </p>
      </section>

      <section className="about-highlights" aria-labelledby="about-highlights-title">
        <h2 id="about-highlights-title">لماذا تختار Alibaba؟</h2>
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
        <h2 id="about-timeline-title">رحلة Alibaba</h2>
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

      <section className="about-closing" aria-label="About closing">
        <p>من 2017… وقصتنا مستمرة. ❤️</p>
        <a href="/menu">اكتشف المنيو</a>
      </section>
    </div>
  );
}
