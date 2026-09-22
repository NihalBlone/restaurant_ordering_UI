const STATUS_STYLES = {
  PLACED: "bg-saffron/20 text-ink",
  PREPARING: "bg-paprika/15 text-paprika",
  SERVED: "bg-olive/15 text-olive",
  CANCELLED: "bg-stone-200 text-stone-700",
};

export default function OrderCard({
  order,
  actions = [],
  compact = false,
  showTable = true,
}) {
  const placedAt = order.createdAt
    ? new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(order.createdAt))
    : null;

  return (
    <article className="panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {showTable ? (
              <p className="text-sm font-semibold text-ink">
                Table {order.tableLabel || order.tableId?.slice(0, 6)}
              </p>
            ) : null}
            <span className={`status-pill ${STATUS_STYLES[order.status] || ""}`}>
              {order.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted">
            {order.customerName || "Guest order"}
          </p>
          <p className="mt-1 text-xs text-muted">
            Order {order.orderId?.slice(0, 6)}
            {placedAt ? ` · ${placedAt}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-ink">
            ₹{Number(order.estimatedTotalAmount || order.totalAmount || 0).toFixed(2)}
          </p>
          <p className="text-xs text-muted">
            {order.totalItems || order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} items
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {(order.items || []).map((item) => (
          <div
            key={`${order.orderId}-${item.menuItemId}-${item.menuItemName}`}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-shell text-xs font-semibold">
                {item.quantity}
              </span>
              <span>{item.menuItemName}</span>
            </div>
            {!compact ? (
              <span className="text-muted">
                ₹{Number(item.lineTotal || item.unitPrice * item.quantity).toFixed(2)}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      {actions.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold ${
                action.variant === "primary"
                  ? "bg-paprika text-white"
                  : "border border-line bg-white text-ink"
              }`}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}
