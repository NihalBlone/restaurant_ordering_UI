import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import OrderCard from "../components/OrderCard";
import useTableOrders from "../hooks/useTableOrders";
import { clearTableSession } from "../utils/storage";

export default function OrderTrackingPage() {
  const [params] = useSearchParams();
  const tableId = params.get("tableId");
  const { ordersResponse, loading, error, connectionState, refresh } =
    useTableOrders(tableId);

  useEffect(() => {
    if (ordersResponse && !ordersResponse.sessionId) {
      clearTableSession(tableId);
    }
  }, [ordersResponse, tableId]);

  const orders = ordersResponse?.orders || [];
  const sessionId = ordersResponse?.sessionId;
  const sessionActive = ordersResponse?.sessionActive;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-6">
      <section className="panel overflow-hidden p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-olive">
              Shared table tracking
            </p>
            <h1 className="mt-2 text-4xl font-bold">Everyone stays in sync</h1>
            <p className="mt-2 text-sm text-muted">
              Table {ordersResponse?.tableNumber || tableId?.slice(0, 8)} · Session {sessionId?.slice(0, 8) || "not started"}
            </p>
          </div>
          <div className="rounded-[20px] bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Realtime</p>
            <p className="mt-1 text-sm font-semibold text-ink">{connectionState}</p>
          </div>
        </div>

        {sessionActive ? (
          <div className="mt-5 grid grid-cols-2 gap-3 rounded-[24px] bg-ink p-4 text-white">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                Table items
              </p>
              <p className="mt-1 text-2xl font-bold">
                {ordersResponse?.sessionTotalItems || 0}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                Running total
              </p>
              <p className="mt-1 text-2xl font-bold">
                ₹{Number(ordersResponse?.sessionTotalAmount || 0).toFixed(2)}
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex gap-3">
          <Link
            className="rounded-full bg-paprika px-4 py-3 text-sm font-semibold text-white"
            to={`/menu?tableId=${tableId}`}
          >
            Back to menu
          </Link>
          <button
            type="button"
            onClick={() => {
              refresh({ showLoading: true }).catch(() => {});
            }}
            className="rounded-full border border-line bg-white px-4 py-3 text-sm font-semibold"
          >
            Refresh
          </button>
        </div>
      </section>

      <section className="mt-5 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="panel h-40 animate-pulse bg-white/70" />
          ))
        ) : error ? (
          <div className="panel p-6 text-paprika">{error}</div>
        ) : orders.length ? (
          orders.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              compact={false}
              showTable={false}
            />
          ))
        ) : (
          <div className="panel p-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-olive">
              Table ready
            </p>
            <h2 className="mt-2 text-2xl font-bold">No active orders yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              The first order starts a shared session. When staff finalize the bill, this view resets for the next guests.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
