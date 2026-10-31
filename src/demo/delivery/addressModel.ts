export const locationTypes = { apartment: "Lägenhet", house: "Hus", workplace: "Arbetsplats", other: "Annat" } as const;
export const handoffTypes = { customer: "Lämna till mig", door: "Lämna vid dörren" } as const;
export type DeliveryAddress = {
  street: string; postalCode: string; city: string; apartment: string; floor: string;
  entranceCode: string; instructions: string;
  locationType: keyof typeof locationTypes; handoff: keyof typeof handoffTypes;
};
export const emptyAddress = (): DeliveryAddress => ({ street: "", postalCode: "", city: "", apartment: "", floor: "", entranceCode: "", instructions: "", locationType: "apartment", handoff: "customer" });
export type AddressErrors = Partial<Record<keyof DeliveryAddress, string>>;
export const addressStorageKey = "alibaba.preview.delivery-address.v1";
export const addressLifetime = 30 * 24 * 60 * 60 * 1000;
const limits = { street: 160, postalCode: 6, city: 100, apartment: 30, floor: 30, entranceCode: 40, instructions: 500 } as const;

export function normalizeAddress(raw: unknown): DeliveryAddress | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const input = raw as Record<string, unknown>;
  const result = emptyAddress();
  for (const key of Object.keys(limits) as (keyof typeof limits)[]) {
    if (typeof input[key] !== "string" || input[key].length > limits[key]) return null;
    result[key] = input[key].replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  }
  if (typeof input.locationType !== "string" || !Object.prototype.hasOwnProperty.call(locationTypes, input.locationType)
    || typeof input.handoff !== "string" || !Object.prototype.hasOwnProperty.call(handoffTypes, input.handoff)) return null;
  result.locationType = input.locationType as DeliveryAddress["locationType"];
  result.handoff = input.handoff as DeliveryAddress["handoff"];
  const digits = result.postalCode.replace(/\s/g, "");
  if (/^\d{5}$/.test(digits)) result.postalCode = `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (result.locationType !== "apartment") result.apartment = "";
  if (result.locationType === "house") { result.floor = ""; result.entranceCode = ""; }
  return result;
}

export function addressErrors(address: DeliveryAddress): AddressErrors {
  const errors: AddressErrors = {};
  if (!/[\p{L}]/u.test(address.street) || !/\d/.test(address.street) || address.street.length > limits.street) errors.street = "Ange gata och gatunummer.";
  if (!/^\d{3}\s?\d{2}$/.test(address.postalCode.trim())) errors.postalCode = "Ange ett svenskt postnummer med fem siffror.";
  if (address.city.trim().length < 2 || !/[\p{L}]/u.test(address.city) || address.city.length > limits.city) errors.city = "Ange ort.";
  return errors;
}

type AddressStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export function readRememberedAddress(storage: AddressStorage, now = Date.now()): DeliveryAddress | null {
  try {
    const raw = storage.getItem(addressStorageKey);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const address = normalizeAddress(data.address);
    if (data.version !== 1 || data.consent !== true || !Number.isFinite(data.expiresAt)
      || data.expiresAt <= now || data.expiresAt > now + addressLifetime || !address || Object.keys(addressErrors(address)).length) {
      storage.removeItem(addressStorageKey); return null;
    }
    return { ...address, entranceCode: "", instructions: "" };
  } catch { return null; }
}

export function rememberAddress(storage: AddressStorage, address: DeliveryAddress, consent: boolean, replaceExisting: boolean, now = Date.now()): boolean {
  const clean = normalizeAddress(address);
  if (!consent || !clean || Object.keys(addressErrors(clean)).length) return false;
  try {
    if (readRememberedAddress(storage, now) && !replaceExisting) return false;
    storage.setItem(addressStorageKey, JSON.stringify({ version: 1, consent: true, expiresAt: now + addressLifetime,
      address: { ...clean, entranceCode: "", instructions: "" } }));
    return true;
  } catch { return false; }
}

export function forgetAddress(storage: AddressStorage): boolean {
  try { storage.removeItem(addressStorageKey); return true; } catch { return false; }
}
