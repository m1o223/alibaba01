import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { DeliveryAddressSheet } from "./DeliveryAddressSheet";
import { addressStorageKey, emptyAddress, forgetAddress, handoffTypes, readRememberedAddress, rememberAddress, type DeliveryAddress } from "./addressModel";
import "./delivery.css";
import { useNavigationDraft } from "../../hooks/useNavigationDraft";

function readSaved() { try { return readRememberedAddress(localStorage); } catch { return null; } }

export function DeliveryAddressSection({ active }: { active: boolean }) {
  const [saved, setSaved] = useState(readSaved);
  const [confirmed, setConfirmed] = useNavigationDraft<DeliveryAddress | null>("checkout:deliveryAddress", null);
  const [draft, setDraft] = useNavigationDraft("checkout:deliveryDraft", emptyAddress);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const previousActive = useRef(false);
  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (active && !previousActive.current && !confirmed && !saved) setOpen(true);
    if (!active) setOpen(false);
    previousActive.current = active;
  }, [active, confirmed, saved]);
  useEffect(() => {
    function refresh(event: StorageEvent) { if (event.key === addressStorageKey || event.key === null) setSaved(readSaved()); }
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);
  const displayed = confirmed ?? saved;

  return <>
    {active ? <div className="delivery-checkout-details">
      <p className="delivery-unavailable" id="delivery-unavailable">Hemleverans kan inte beställas ännu. Leveransområde, avgifter och orderhantering är inte klara. Ingen leveransbetalning kan genomföras.</p>
      {displayed ? <div className="delivery-address-card">
        <h3>Din leveransadress</h3>
        <address>{displayed.street}<br />{displayed.postalCode} {displayed.city}
          {displayed.apartment ? <><br />Lägenhet {displayed.apartment}</> : null}
          {displayed.floor ? <><br />Våning {displayed.floor}</> : null}
          <br />{handoffTypes[displayed.handoff]}</address>
        {confirmed ? <p className="delivery-help">Adressen är bekräftad för denna kassa. Hemleverans är ännu inte tillgänglig.</p> : <button className="delivery-primary" type="button" onClick={() => { setConfirmed({ ...displayed }); setNotice(""); }}>Använd denna adress</button>}
        <div className="delivery-card-actions">
          <button type="button" className="delivery-text-button" onClick={() => { setDraft({ ...displayed }); setOpen(true); }}><Pencil size={16} aria-hidden="true" />Ändra</button>
          <button type="button" className="delivery-text-button" onClick={() => { setDraft(emptyAddress()); setOpen(true); }}>Annan adress</button>
        </div>
      </div> : <button type="button" className="delivery-secondary" onClick={() => setOpen(true)}>Ange leveransadress</button>}
      {saved ? <div className="delivery-card-actions">
        {confirmed ? <button type="button" className="delivery-text-button" onClick={() => { setConfirmed({ ...saved }); setNotice(""); }}>Använd sparad adress</button> : null}
        <button type="button" className="delivery-text-button" onClick={() => {
          let deleted = false;
          try { deleted = forgetAddress(localStorage); } catch { /* Storage access may be denied. */ }
          if (deleted) { setSaved(null); setNotice("Den sparade adressen är borttagen från den här webbläsaren."); }
          else setNotice("Adressen kunde inte tas bort. Kontrollera webbläsarens lagringsinställningar.");
        }}><Trash2 size={16} aria-hidden="true" />Ta bort sparad adress</button>
      </div> : null}
      <p className="delivery-help" role="status">{notice}</p>
    </div> : null}
    <DeliveryAddressSheet open={open} draft={draft} onDraft={setDraft} hasSaved={Boolean(saved)} onClose={close} onConfirm={(address, remember, replace) => {
      setConfirmed(address); setDraft(address); setNotice("");
      if (remember && (!saved || replace)) {
        let stored = false;
        try { stored = rememberAddress(localStorage, address, true, replace); } catch { /* Current checkout remains usable without storage. */ }
        if (stored) setSaved(readSaved());
        else setNotice("Adressen används i denna kassa men kunde inte sparas på enheten. En tidigare sparad adress har inte skrivits över.");
      }
      close();
    }} />
  </>;
}
