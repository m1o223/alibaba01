import {
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";

const googleMapsUrl = "https://maps.app.goo.gl/zz8XnzbbCyZCgfGe7?g_st=it";
const googleMapsEmbedUrl = "https://www.google.com/maps?q=Ali%20Baba%20resturang%20%26%20Pizzaria%2C%20Stockholmsv%C3%A4gen%2018%2C%20602%2017%20Norrk%C3%B6ping&ftid=0x46593a33e8b252b1:0x3363eb694b6ccaf5&output=embed";

export function ContactPage() {
  return (
    <div className="contact-page" aria-labelledby="contact-page-title">
      <section className="contact-hero">
        <h1 id="contact-page-title">تواصل معنا</h1>
        <p>يسعدنا التواصل معكم والإجابة عن جميع استفساراتكم.</p>
      </section>

      <section className="contact-content" aria-label="Contact details and message form">
        <div className="contact-details">
          <h2>معلومات التواصل</h2>

          <a href="tel:011103358" className="contact-detail-row">
            <Phone aria-hidden="true" size={20} strokeWidth={2.3} />
            <span>رقم الهاتف</span>
            <bdi dir="ltr">011103358</bdi>
          </a>

          <a href="mailto:Blodan17@gmail.com" className="contact-detail-row">
            <Mail aria-hidden="true" size={20} strokeWidth={2.3} />
            <span>البريد الإلكتروني</span>
            <bdi dir="ltr">Blodan17@gmail.com</bdi>
          </a>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="contact-detail-row"
          >
            <MapPin aria-hidden="true" size={20} strokeWidth={2.3} />
            <span>العنوان</span>
            <bdi dir="ltr">Stockholmsvägen 18</bdi>
          </a>
        </div>

        <form
          className="contact-form"
          action="mailto:Blodan17@gmail.com"
          method="post"
          encType="text/plain"
        >
          <h2>أرسل رسالة</h2>

          <label>
            <span>الاسم</span>
            <input name="name" type="text" autoComplete="name" required />
          </label>

          <label>
            <span>البريد الإلكتروني</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>

          <label>
            <span>عنوان الرسالة</span>
            <input name="subject" type="text" required />
          </label>

          <label>
            <span>الرسالة</span>
            <textarea name="message" rows={5} required />
          </label>

          <button type="submit">
            <Send aria-hidden="true" size={19} strokeWidth={2.4} />
            <span>إرسال الرسالة</span>
          </button>
        </form>
      </section>

      <section className="contact-map-section" aria-labelledby="contact-map-title">
        <div className="contact-map-heading">
          <h2 id="contact-map-title">موقع المطعم</h2>
          <a href={googleMapsUrl} target="_blank" rel="noreferrer">
            <span>
              فتح في <bdi dir="ltr">Google Maps</bdi>
            </span>
            <ExternalLink aria-hidden="true" size={16} strokeWidth={2.3} />
          </a>
        </div>

        <iframe
          className="contact-map-frame"
          title="Alibaba Restaurant location on Google Maps"
          src={googleMapsEmbedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </section>
    </div>
  );
}
