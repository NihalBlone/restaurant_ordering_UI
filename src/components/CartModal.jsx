import { Link } from "react-router-dom";

export default function CartModal({
  isOpen,
  onClose,
  items,
  totalAmount,
  onIncrease,
  onDecrease,
  onRemove,
  tableId,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink/50 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="w-full max-w-lg rounded-t-[32px] bg-card p-5 shadow-2xl sm:rounded-[32px]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-olive">
              Cart
            </p>
            <h2 className="text-2xl font-bold">Your order</h2>
          </div>
          <button
            className="h-11 w-11 rounded-full border border-line text-xl"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-[24px] border border-line bg-white px-4 py-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted">
                    ₹{item.price.toFixed(2)} each
                  </p>
                </div>
                <button
                  className="text-sm font-semibold text-paprika"
                  onClick={() => onRemove(item.id)}
                >
                  Remove
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-full bg-shell px-2 py-1">
                  <button
                    className="h-9 w-9 rounded-full bg-white"
                    onClick={() => onDecrease(item.id)}
                  >
                    -
                  </button>
                  <span className="min-w-6 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    className="h-9 w-9 rounded-full bg-white"
                    onClick={() => onIncrease(item)}
                  >
                    +
                  </button>
                </div>

                <p className="font-semibold">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[24px] bg-ink px-4 py-4 text-white">
          <div className="flex items-center justify-between text-sm text-white/70">
            <span>Total</span>
            <span>{items.length} lines</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-2xl font-bold">₹{totalAmount.toFixed(2)}</p>
            <Link
              className="rounded-full bg-paprika px-5 py-3 text-sm font-semibold"
              to={`/cart?tableId=${tableId}`}
              onClick={onClose}
            >
              Place Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
