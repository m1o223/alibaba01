import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { LocateFixed, X } from "lucide-react";
import { addressErrors, handoffTypes, locationTypes, normalizeAddress, type AddressErrors, type DeliveryAddress } from "./addressModel";
import { approvedLookupPath, lookupAddress } from "./addressLookup";

type Props = {
  open: boolean; draft: DeliveryAddress; onDraft: (address: DeliveryAddress) => void;
  hasSaved: boolean; onClose: () => void; onConfirm: (address: DeliveryAddress, remember: boolean, replace: boolean) => void;
};

export function DeliveryAddressSheet({ open, draft, onDraft, hasSaved, onClose, onConfirm }: Props) {
  const panel = useRef<HTMLElement>(null);
  const [errors, setErrors] = useState<AddressErrors>({});
  const [remember, setRemember] = useState(false);
  const [replace, setReplace] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const request = useRef<AbortController | null>(null);
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
  const keyboardOpen = useRef(false);
  const lookupPath = approvedLookupPath(import.meta.env.VITE_DELIVERY_GEOCODER_PATH);
  const cancelLookup = useCallback(() => { request.current?.abort(); request.current = null; setLocating(false); }, []);

  useEffect(() => {
    if (!open) { cancelLookup(); return; }
    setRemember(false); setReplace(false); setErrors({}); setLocationMessage("");
    const sheet = panel.current!;
    const root = document.getElementById("root");
    const wasInert = root?.inert ?? false;
    const previousFilter = root?.style.filter ?? "";
    const trigger = document.activeElement as HTMLElement | null;
    const scrollY = window.scrollY;
    const { position, top, width, overflow } = document.body.style;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    if (root) { root.inert = true; root.style.filter = "blur(4px)"; }
    sheet.querySelector<HTMLElement>(".delivery-close")?.focus({ preventScroll: true });
    const viewport = window.visualViewport;
    let frame = 0;
    function fit() {
      if (!viewport || viewport.scale !== 1) return;
      keyboardOpen.current = window.innerHeight - viewport.height > 120;
      sheet.style.setProperty("--delivery-height", `${viewport.height * .9}px`);
      sheet.style.setProperty("--delivery-bottom", `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (sheet.contains(document.activeElement)) (document.activeElement as HTMLElement)?.scrollIntoView({ block: "nearest" });
      });
    }
    function keys(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const controls = [...sheet.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href]')].filter(el => el.getClientRects().length > 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    fit();
    viewport?.addEventListener("resize", fit); viewport?.addEventListener("scroll", fit);
    sheet.addEventListener("keydown", keys);
    return () => {
      cancelLookup(); cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", fit); viewport?.removeEventListener("scroll", fit);
      sheet.removeEventListener("keydown", keys);
      if (root) { root.inert = wasInert; root.style.filter = previousFilter; }
      Object.assign(document.body.style, { position, top, width, overflow });
      window.scrollTo(0, scrollY);
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [open, onClose, cancelLookup]);

  function change<K extends keyof DeliveryAddress>(key: K, value: DeliveryAddress[K]) {
    cancelLookup(); onDraft({ ...draft, [key]: value });
    setErrors(current => ({ ...current, [key]: undefined }));
  }

  async function locate() {
    if (!lookupPath) { setLocationMessage("Adressökning är inte ansluten ännu. Fyll i adressen manuellt."); return; }
    if (!navigator.geolocation) { setLocationMessage("Platsfunktionen saknas. Fyll i adressen manuellt."); return; }
    cancelLookup();
    const controller = new AbortController(); request.current = controller;
    setLocating(true); setLocationMessage("Hämtar ett adressförslag…");
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        controller.signal.addEventListener("abort", () => reject(new Error("Cancelled")), { once: true });
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, maximumAge: 0, timeout: 10000 });
      });
      const suggestion = await lookupAddress(lookupPath, { latitude: position.coords.latitude, longitude: position.coords.longitude }, controller.signal);
      if (controller.signal.aborted || request.current !== controller) return;
      onDraft({ ...draft, ...suggestion });
      setErrors({}); setLocationMessage("Kontrollera adressförslaget och rätta det vid behov innan du bekräftar.");
    } catch {
      if (request.current === controller) setLocationMessage("Platsen kunde inte hämtas. Tillåt platsåtkomst eller fyll i adressen manuellt.");
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) { request.current = null; setLocating(false); }
    }
  }

  function endGesture(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current; gesture.current = null;
    if (start?.id === event.pointerId && !keyboardOpen.current && event.clientY - start.y > 90
      && event.clientY - start.y > Math.abs(event.clientX - start.x)) onClose();
  }

  function keyboardMayBeOpen() {
    return keyboardOpen.current || (window.matchMedia("(pointer: coarse)").matches && Boolean(document.activeElement?.matches("input, textarea")));
  }

  const field = (key: "street" | "postalCode" | "city" | "apartment" | "floor" | "entranceCode", label: string, autoComplete = "off", maxLength = 160) => <label className="delivery-field" key={key}>
    <span id={`delivery-label-${key}`}>{label}</span>
    <input name={key} id={`delivery-${key}`} value={draft[key]} onChange={event => change(key, event.target.value)} autoComplete={autoComplete}
      inputMode={key === "postalCode" ? "numeric" : "text"} maxLength={maxLength} required={["street", "postalCode", "city"].includes(key)}
      aria-labelledby={`delivery-label-${key}`} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `delivery-error-${key}` : undefined} />
    {errors[key] ? <small id={`delivery-error-${key}`} className="delivery-error">{errors[key]}</small> : null}
  </label>;

  return createPortal(<div className={`delivery-layer ${open ? "is-open" : ""}`} inert={!open} aria-hidden={!open} lang="sv" dir="ltr">
    <div className="delivery-backdrop" aria-hidden="true" onPointerDown={event => event.preventDefault()} onClick={() => {
      if (keyboardMayBeOpen()) { (document.activeElement as HTMLElement)?.blur(); return; }
      onClose();
    }} />
    <aside className="delivery-sheet" ref={panel} role="dialog" aria-modal={open || undefined} aria-labelledby="delivery-title" aria-describedby="delivery-subtitle">
      <div className="delivery-handle" aria-hidden="true" onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0 || keyboardMayBeOpen()) return;
        gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId);
      }} onPointerUp={endGesture} onPointerCancel={() => { gesture.current = null; }}><span /></div>
      <div className="delivery-heading"><div><h2 id="delivery-title">Leveransuppgifter</h2><p id="delivery-subtitle">Var vill du få din beställning?</p></div>
        <button type="button" className="delivery-close" aria-label="Stäng leveransuppgifter" onClick={onClose}><X size={22} aria-hidden="true" /></button></div>
      <form className="delivery-form" noValidate onSubmit={event => {
        event.preventDefault(); cancelLookup();
        const clean = normalizeAddress(draft); const nextErrors = addressErrors(clean ?? draft);
        setErrors(nextErrors);
        if (!clean || Object.keys(nextErrors).length) {
          panel.current?.querySelector<HTMLElement>(`#delivery-${Object.keys(nextErrors)[0] ?? "street"}`)?.focus(); return;
        }
        onConfirm(clean, remember, replace);
      }}>
        <div className="delivery-scroll">
          <button type="button" className="delivery-secondary" onClick={locate} disabled={locating}><LocateFixed size={19} aria-hidden="true" />{locating ? "Hämtar plats…" : "Använd min plats"}</button>
          <p className="delivery-help">{lookupPath ? "En engångsposition används för att föreslå adressen. Du bekräftar alltid själv." : "Adressökning är inte ansluten ännu. Du kan ange adressen manuellt."}</p>
          <p className="delivery-help" role="status">{locationMessage}</p>
          {field("street", "Gatuadress", "shipping address-line1")}
          <div className="delivery-field-pair">{field("postalCode", "Postnummer", "shipping postal-code", 6)}{field("city", "Ort", "shipping address-level2", 100)}</div>
          <fieldset><legend>Vilken typ av plats?</legend><div className="delivery-options">{Object.entries(locationTypes).map(([value, label]) => <label key={value}><input type="radio" name="location-type" checked={draft.locationType === value} onChange={() => change("locationType", value as DeliveryAddress["locationType"])} /><span>{label}</span></label>)}</div></fieldset>
          {draft.locationType === "apartment" ? field("apartment", "Lägenhetsnummer (valfritt)", "off", 30) : null}
          {draft.locationType !== "house" ? <div className="delivery-field-pair">{field("floor", "Våning (valfritt)", "off", 30)}{field("entranceCode", "Portkod (valfritt)", "off", 40)}</div> : null}
          <label className="delivery-field"><span>Övrig information (valfritt)</span><textarea name="instructions" value={draft.instructions} maxLength={500} rows={3} onChange={event => change("instructions", event.target.value)} /></label>
          <fieldset><legend>Hur vill du få maten?</legend><div className="delivery-options delivery-handoff">{Object.entries(handoffTypes).map(([value, label]) => <label key={value}><input type="radio" name="handoff" checked={draft.handoff === value} onChange={() => change("handoff", value as DeliveryAddress["handoff"])} /><span>{label}</span></label>)}</div></fieldset>
          <label className="delivery-check"><input type="checkbox" checked={remember} onChange={event => { setRemember(event.target.checked); setReplace(false); }} /><span>Kom ihåg min adress till nästa gång</span></label>
          <p className="delivery-help">Sparas bara i den här webbläsaren i 30 dagar, inte på ett konto. Använd inte på en delad enhet. Portkod och övrig information sparas bara i denna kassa. Du kan ta bort den sparade adressen här.</p>
          {remember && hasSaved ? <label className="delivery-check"><input type="checkbox" checked={replace} onChange={event => setReplace(event.target.checked)} /><span>Ersätt min tidigare sparade adress</span></label> : null}
          {remember && hasSaved && !replace ? <p className="delivery-help">Din tidigare sparade adress behålls. Den nya används bara i denna kassa.</p> : null}
        </div>
        <div className="delivery-actions"><button type="submit" className="delivery-primary">Bekräfta adress och fortsätt</button></div>
      </form>
    </aside>
  </div>, document.body);
}
