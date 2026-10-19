import { ExternalLink, Mail, MapPin, Phone, Send } from "lucide-react";
import "../styles/contact.css";

const googleMapsUrl = "https://maps.app.goo.gl/zz8XnzbbCyZCgfGe7?g_st=it";
const googleMapsEmbedUrl = "https://www.google.com/maps?q=Ali%20Baba%20resturang%20%26%20Pizzaria%2C%20Stockholmsv%C3%A4gen%2018%2C%20602%2017%20Norrk%C3%B6ping&ftid=0x46593a33e8b252b1:0x3363eb694b6ccaf5&output=embed";

export function ContactPage() {
  return (
    <div className="contact-page" aria-labelledby="contact-page-title">
      <section className="contact-hero">
        <h1 id="contact-page-title">Kontakta oss</h1>
        <p>Vi hjälper dig gärna och svarar på dina frågor.</p>
      </section>

      <section className="contact-details" aria-labelledby="contact-details-title">
        <h2 id="contact-details-title">Kontaktuppgifter</h2>

        <a href="tel:011103358" className="contact-detail-row">
          <span className="contact-detail-icon"><Phone aria-hidden="true" size={20} strokeWidth={1.8} /></span>
          <span className="contact-detail-text">
            <span>Telefon</span>
            <bdi dir="ltr">011103358</bdi>
          </span>
        </a>

        <a href="mailto:Blodan17@gmail.com" className="contact-detail-row">
          <span className="contact-detail-icon"><Mail aria-hidden="true" size={20} strokeWidth={1.8} /></span>
          <span className="contact-detail-text">
            <span>E-post</span>
            <bdi dir="ltr">Blodan17@gmail.com</bdi>
          </span>
        </a>

        <div className="contact-detail-row" aria-label="Restaurangens adress">
          <span className="contact-detail-icon"><MapPin aria-hidden="true" size={20} strokeWidth={1.8} /></span>
          <span className="contact-detail-text">
            <span>Adress</span>
            <bdi dir="ltr">Stockholmsvägen 18</bdi>
          </span>
        </div>
      </section>

      <form
        className="contact-form"
        aria-labelledby="contact-form-title"
        action="mailto:Blodan17@gmail.com"
        method="post"
        encType="text/plain"
      >
        <h2 id="contact-form-title">Skicka ett meddelande</h2>

        <label>
          <span>Namn</span>
          <input name="name" type="text" autoComplete="name" required />
        </label>

        <label>
          <span>E-post</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>

        <label>
          <span>Meddelande</span>
          <textarea name="message" rows={5} required />
        </label>

        <button type="submit">
          <Send aria-hidden="true" size={18} strokeWidth={1.8} />
          <span>Skicka meddelande</span>
        </button>
      </form>

      <section className="contact-map-section" aria-label="Restaurangens plats på Google Maps">
        <iframe
          className="contact-map-frame"
          title="Alibaba restaurang på Google Maps"
          src={googleMapsEmbedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />

        <div className="contact-map-meta">
          <h2>Hitta till oss</h2>
          <a className="contact-map-link" href={googleMapsUrl} target="_blank" rel="noreferrer">
            <span>
              Öppna i <bdi dir="ltr">Google Maps</bdi>
            </span>
            <ExternalLink aria-hidden="true" size={16} strokeWidth={1.8} />
          </a>
        </div>
      </section>
    </div>
  );
}
