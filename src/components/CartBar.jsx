import { Link } from "react-router-dom";

export default function CartBar({ itemCount, totalAmount, tableId, onOpen }) {
  if (!itemCount) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
      <div className="mx-auto flex max-w-3xl items-center justify-between rounded-[28px] bg-ink px-5 py-4 text-white shadow-2xl">
        <button
          className="flex flex-1 items-center gap-4 text-left"
          onClick={onOpen}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold">
            {itemCount}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/60">
              Ready to order
            </p>
            <p className="text-lg font-semibold">₹{totalAmount.toFixed(2)}</p>
          </div>
        </button>
        <Link
          className="rounded-full bg-paprika px-5 py-3 text-sm font-semibold"
          to={`/cart?tableId=${tableId}`}
        >
          Review
        </Link>
      </div>
    </div>
  );
}
