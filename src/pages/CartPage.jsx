import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import OrderCard from "../components/OrderCard";
import { useCart } from "../context/CartContext";
import useTableOrders from "../hooks/useTableOrders";
import { placeOrder } from "../services/api";
import { buildIdempotencyKey, getOrderingClientId } from "../utils/storage";

export default function CartPage() {
  const [params] = useSearchParams();
  const tableId = params.get("tableId");
  const navigate = useNavigate();
  const { items, totalAmount, itemCount, setTableId, addItem, decreaseItem, removeItem, clearCart } =
    useCart();
  const [customerName, setCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const {
    ordersResponse,
    loading: previousOrdersLoading,
    error: previousOrdersError,
  } = useTableOrders(tableId);

  const previousOrders = ordersResponse?.orders || [];
  const previousItems = Number(ordersResponse?.sessionTotalItems || 0);
  const previousTotal = Number(ordersResponse?.sessionTotalAmount || 0);
  const combinedItems = previousItems + itemCount;
  const combinedTotal = previousTotal + totalAmount;
  const isAdditionalOrder = previousOrders.length > 0;

  useEffect(() => {
    if (tableId) {
      setTableId(tableId);
    }
  }, [setTableId, tableId]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!tableId || !items.length) return;

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        tableId,
        customerName: customerName.trim() || undefined,
        items: items.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),
      };

      await placeOrder(
        payload,
        buildIdempotencyKey(tableId),
        getOrderingClientId()
      );
      clearCart(tableId);
      navigate(`/track?tableId=${tableId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-olive">
            Checkout
          </p>
          <h1 className="mt-2 text-4xl font-bold">
            {isAdditionalOrder ? "Add to your table order" : "Confirm your order"}
          </h1>
        </div>
        <Link
          className="rounded-full border border-line bg-white px-4 py-3 text-sm font-semibold"
          to={`/menu?tableId=${tableId}`}
        >
          Back
        </Link>
      </div>

      {previousOrdersLoading ? (
        <section className="panel mb-5 h-36 animate-pulse bg-white/70" />
      ) : previousOrders.length ? (
        <section className="mb-6">
          <div className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-olive">
                Previous orders this session
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                Your table has already ordered {previousItems} items
              </h2>
              <p className="mt-1 text-sm text-muted">
                Every guest at this table sees the same live order history.
              </p>
            </div>
            <div className="rounded-[22px] bg-ink px-5 py-4 text-white sm:text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                Total so far
              </p>
              <p className="mt-1 text-3xl font-bold">₹{previousTotal.toFixed(2)}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {previousOrders.map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                compact={false}
                showTable={false}
              />
            ))}
          </div>
        </section>
      ) : previousOrdersError ? (
        <div className="mb-5 rounded-[20px] bg-saffron/20 px-4 py-3 text-sm text-ink">
          Previous table orders could not be loaded. You can still place this order.
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-[1.15fr_0.85fr]">
        <section className="panel p-5">
          <div className="space-y-3">
            {items.length ? (
              items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[22px] border border-line bg-white px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">{item.name}</h2>
                      <p className="text-sm text-muted">
                        ₹{item.price.toFixed(2)} per item
                      </p>
                    </div>
                    <button
                      className="text-sm font-semibold text-paprika"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 rounded-full bg-shell px-2 py-1">
                      <button
                        className="h-10 w-10 rounded-full bg-white"
                        onClick={() => decreaseItem(item.id)}
                      >
                        -
                      </button>
                      <span className="min-w-8 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        className="h-10 w-10 rounded-full bg-white"
                        onClick={() => addItem(item)}
                      >
                        +
                      </button>
                    </div>
                    <p className="text-base font-semibold">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-line bg-white/60 p-6 text-center text-muted">
                Your cart is empty. Add a few dishes from the menu first.
              </div>
            )}
          </div>
        </section>

        <aside className="panel h-fit p-5">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-olive">
                Guest details
              </p>
              <label className="mt-3 block text-sm font-medium text-ink">
                Customer name <span className="text-muted">(optional)</span>
              </label>
              <input
                className="mt-2 w-full rounded-[20px] border border-line bg-white px-4 py-3 text-base"
                placeholder="For example: Priya"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                maxLength={80}
              />
            </div>

            <div className="rounded-[24px] bg-ink p-4 text-white">
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>Items in this order</span>
                <span>{itemCount}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-white/70">This order total</span>
                <strong className="text-2xl">₹{totalAmount.toFixed(2)}</strong>
              </div>
              {isAdditionalOrder ? (
                <div className="mt-4 border-t border-white/15 pt-4">
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span>Previous table total</span>
                    <span>₹{previousTotal.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-white/55">
                        After this order
                      </p>
                      <p className="mt-1 text-xs text-white/55">
                        {combinedItems} items total
                      </p>
                    </div>
                    <strong className="text-2xl text-saffron">
                      ₹{combinedTotal.toFixed(2)}
                    </strong>
                  </div>
                </div>
              ) : null}
            </div>

            {error ? (
              <div className="rounded-[20px] bg-paprika/10 px-4 py-3 text-sm text-paprika">
                {error}
              </div>
            ) : null}

            <button
              className="min-h-14 w-full rounded-full bg-paprika px-5 py-3 text-base font-semibold text-white disabled:opacity-60"
              type="submit"
              disabled={!items.length || submitting}
            >
              {submitting
                ? "Placing order..."
                : isAdditionalOrder
                  ? "Place Additional Order"
                  : "Place Order"}
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}
