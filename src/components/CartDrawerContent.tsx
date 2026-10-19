import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

// Display values and actions belong to the caller; this view never changes order data.
export type CartLineView = {
  id: string;
  name: string;
  imageUrl?: string;
  emoji?: string;
  options: readonly string[];
  quantity: number;
  unitPriceLabel: string;
  lineTotalLabel: string;
};

type CartDrawerContentProps = {
  items: readonly CartLineView[];
  totalLabel: string;
  onGoToMenu: () => void;
  onQuantityChange?: (id: string, quantity: number) => void;
  onRemove?: (id: string) => void;
  onCheckout?: () => void;
};

export function CartDrawerContent({
  items,
  totalLabel,
  onGoToMenu,
  onQuantityChange,
  onRemove,
  onCheckout,
}: CartDrawerContentProps) {
  const isEmpty = items.length === 0;

  return (
    <>
      <div className="cart-drawer-body">
        {isEmpty ? (
          <section className="cart-drawer-empty" aria-labelledby="cart-empty-title">
            <div className="cart-drawer-empty-icon" aria-hidden="true">
              <ShoppingBag size={22} strokeWidth={1.8} />
            </div>
            <h3 id="cart-empty-title">Din varukorg är tom</h3>
            <p>Du har inte lagt till något ännu.</p>
            <button className="cart-drawer-primary" type="button" onClick={onGoToMenu}>
              Gå till menyn
            </button>
          </section>
        ) : (
          <ul className="cart-drawer-items" aria-label="Varor i varukorgen">
            {items.map((item) => (
              <li className="cart-drawer-item" key={item.id}>
                <div className="cart-item-details">
                  {item.imageUrl ? <img src={item.imageUrl} alt="" width="56" height="56" /> : item.emoji ? <span className="cart-item-demo-emoji" aria-hidden="true">{item.emoji}</span> : null}
                  <div>
                    <h3>{item.name}</h3>
                    {item.options.length > 0 ? <p>{item.options.join(", ")}</p> : null}
                    <p>{item.unitPriceLabel} / st</p>
                  </div>
                </div>
                <div className="cart-item-actions">
                  <div className="cart-item-controls">
                    <div className="cart-item-quantity" role="group" aria-label={`Antal ${item.name}`}>
                      <button
                        type="button"
                        aria-label={`Minska antal ${item.name}`}
                        title="Minska antal"
                        disabled={!onQuantityChange || item.quantity <= 1}
                        onClick={() => onQuantityChange?.(item.id, item.quantity - 1)}
                      >
                        <Minus size={16} aria-hidden="true" />
                      </button>
                      <output aria-label="Antal" aria-live="polite">{item.quantity}</output>
                      <button
                        type="button"
                        aria-label={`Öka antal ${item.name}`}
                        title="Öka antal"
                        disabled={!onQuantityChange}
                        onClick={() => onQuantityChange?.(item.id, item.quantity + 1)}
                      >
                        <Plus size={16} aria-hidden="true" />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="cart-item-remove"
                      aria-label={`Ta bort ${item.name}`}
                      title="Ta bort"
                      disabled={!onRemove}
                      onClick={() => onRemove?.(item.id)}
                    >
                      <Trash2 size={17} aria-hidden="true" />
                    </button>
                  </div>
                  <strong>{item.lineTotalLabel}</strong>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <section className="cart-drawer-summary" aria-label="Beställningsöversikt">
        <div>
          <span>Totalt:</span>
          <strong aria-live="polite">{totalLabel}</strong>
        </div>
        <button
          className="cart-drawer-primary"
          type="button"
          disabled={isEmpty || !onCheckout}
          onClick={onCheckout}
        >
          Till kassan
        </button>
      </section>
    </>
  );
}
