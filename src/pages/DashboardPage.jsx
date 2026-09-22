import { useEffect, useState } from "react";
import MenuCategoryPanel from "../components/MenuCategoryPanel";
import OrderCard from "../components/OrderCard";
import SalesReportPanel from "../components/SalesReportPanel";
import TablesPanel from "../components/TablesPanel";
import StaffPanel from "../components/StaffPanel";
import { useAuth } from "../context/AuthContext";
import {
  closeTableSession,
  createRestaurantMenuCategory,
  createRestaurantMenuItem,
  deleteRestaurantMenuCategory,
  getAdminTables,
  getPlatformNotice,
  getOrders,
  getRestaurantMenuCategories,
  getRestaurantMenuItems,
  updateOrderStatus,
  updateRestaurantMenuCategory,
  updateRestaurantMenuItem,
  uploadRestaurantMenuImage,
} from "../services/api";
import { subscribeToTopic } from "../services/websocket";

const STATUS_BUCKETS = [
  { key: "PLACED", title: "New Orders" },
  { key: "PREPARING", title: "Preparing" },
  { key: "SERVED", title: "Served" },
];

const VIEW_COPY = {
  staff: { eyebrow: "Your team", title: "People & permissions", description: "Invite staff, assign roles, and control access to your restaurant." },
  tables: {
    eyebrow: "Your floor, connected",
    title: "Tables & QR codes",
    description: "Give every table a permanent customer link and a scan-ready QR card.",
  },
  orders: {
    eyebrow: "Live service",
    title: "Order command center",
    description: "Move orders through service and settle a shared table only after payment is received outside the app.",
  },
  menu: {
    eyebrow: "Guest experience",
    title: "Menu studio",
    description: "Create flexible menu tabs, add dishes, upload photos, and control what guests can order.",
  },
  sales: {
    eyebrow: "Settled revenue",
    title: "Sales and table history",
    description: "Explore settled bills by date, table, or food item, with sales charts and detailed history.",
  },
};

function mapTableResponse(response, tableId) {
  const tableLabel = response.tableNumber || tableId.slice(0, 8);
  return {
    orders: response.orders.map((order) => ({ ...order, tableLabel })),
    session: {
      tableId,
      tableNumber: tableLabel,
      sessionId: response.sessionId,
      active: response.sessionActive,
      totalItems: response.sessionTotalItems || 0,
      totalAmount: Number(response.sessionTotalAmount || 0),
    },
  };
}

export default function DashboardPage() {
  const { admin, logout } = useAuth();
  const restaurantId = admin.restaurantId;
  const canManage = ["RESTAURANT_ADMIN", "MANAGER"].includes(admin.role);
  const canSettle = admin.role !== "KITCHEN";
  const [platformNotice, setPlatformNotice] = useState(null);
  const [activeView, setActiveView] = useState("orders");
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tableSessions, setTableSessions] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);
  const [menuLoaded, setMenuLoaded] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);
  const [savingItemId, setSavingItemId] = useState(null);
  const [creatingItemCategoryId, setCreatingItemCategoryId] = useState(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [closingTableId, setClosingTableId] = useState(null);
  const [confirmingTableId, setConfirmingTableId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [liveStatus, setLiveStatus] = useState("Connecting");

  async function fetchTable(tableId) {
    const response = await getOrders({ tableId, size: 100 });
    return mapTableResponse(response, tableId);
  }

  async function loadOrderQueue(tableList = tables) {
    const activeTables = tableList.filter((table) => table.active);
    setLoading(true);
    setError("");
    try {
      const results = await Promise.all(activeTables.map((table) => fetchTable(table.id)));
      const mergedOrders = results
        .flatMap((result) => result.orders)
        .filter((order) => order.restaurantId === restaurantId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(mergedOrders);
      setTableSessions(results.map((result) => result.session));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadWorkspace() {
    setLoading(true);
    setError("");
    try {
      const restaurantTables = await getAdminTables();
      setTables(restaurantTables);
      await loadOrderQueue(restaurantTables);
    } catch (requestError) {
      setError(requestError.message);
      setLoading(false);
    }
  }

  async function loadMenu() {
    setMenuLoading(true);
    setError("");
    setNotice("");
    try {
      const [categories, items] = await Promise.all([
        getRestaurantMenuCategories(restaurantId),
        getRestaurantMenuItems(restaurantId),
      ]);
      setMenuCategories(categories);
      setMenuItems(items);
      setMenuLoaded(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setMenuLoading(false);
    }
  }

  useEffect(() => {
    loadWorkspace();
    getPlatformNotice().then(setPlatformNotice).catch(() => {});
  }, []);

  useEffect(() => {
    setLiveStatus("Connecting");
    const unsubscribe = subscribeToTopic(
      `/topic/restaurant/${restaurantId}`,
      async (event) => {
        setLiveStatus("Live");
        if (!event?.tableId) return;
        try {
          const result = await fetchTable(event.tableId);
          setOrders((current) => {
            const otherTables = current.filter((entry) => entry.tableId !== event.tableId);
            return [...result.orders, ...otherTables].sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
          });
          setTableSessions((current) => {
            const others = current.filter((session) => session.tableId !== event.tableId);
            return [result.session, ...others];
          });
        } catch (requestError) {
          setError(requestError.message);
        }
      },
      () => setLiveStatus("Reconnecting"),
      () => setLiveStatus("Live")
    );

    return unsubscribe;
  }, [restaurantId]);

  async function handleStatusUpdate(orderId, status) {
    setError("");
    setNotice("");
    try {
      const updated = await updateOrderStatus(orderId, status);
      setOrders((current) =>
        current.map((order) =>
          order.orderId === orderId
            ? { ...updated, tableLabel: order.tableLabel }
            : order
        )
      );
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleCloseSession(tableId) {
    setClosingTableId(tableId);
    setError("");
    setNotice("");
    try {
      const closed = await closeTableSession(tableId);
      setOrders((current) => current.filter((order) => order.tableId !== tableId));
      setTableSessions((current) =>
        current.map((session) =>
          session.tableId === tableId ? { ...session, active: false } : session
        )
      );
      setTables((current) =>
        current.map((table) =>
          table.id === tableId ? { ...table, currentSessionId: null } : table
        )
      );
      setConfirmingTableId(null);
      setNotice(
        `Payment of ₹${Number(closed.totalAmount).toFixed(2)} recorded for table ${closed.tableNumber}. The next order starts a new session.`
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setClosingTableId(null);
    }
  }

  async function handleMenuItemSave(menuItemId, payload) {
    setSavingItemId(menuItemId);
    setError("");
    setNotice("");
    try {
      const updated = await updateRestaurantMenuItem(restaurantId, menuItemId, payload);
      setMenuItems((current) =>
        current.map((item) => (item.id === menuItemId ? updated : item))
      );
      setNotice(`${updated.name} was updated on the customer menu.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingItemId(null);
    }
  }

  async function handleCreateItem(payload) {
    setCreatingItemCategoryId(payload.categoryId);
    setError("");
    setNotice("");
    try {
      const created = await createRestaurantMenuItem(restaurantId, payload);
      setMenuItems((current) => [...current, created]);
      setNotice(`${created.name} was added to ${created.categoryName}.`);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setCreatingItemCategoryId(null);
    }
  }

  async function handleCreateCategory(event) {
    event.preventDefault();
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    setError("");
    setNotice("");
    try {
      const created = await createRestaurantMenuCategory(restaurantId, {
        name: newCategoryName.trim(),
      });
      setMenuCategories((current) =>
        [...current, created].sort((a, b) => a.displayOrder - b.displayOrder)
      );
      setNewCategoryName("");
      setNotice(`${created.name} is now a customer menu tab.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCreatingCategory(false);
    }
  }

  async function handleUpdateCategory(categoryId, payload) {
    setError("");
    setNotice("");
    try {
      const updated = await updateRestaurantMenuCategory(
        restaurantId,
        categoryId,
        payload
      );
      setMenuCategories((current) =>
        current
          .map((category) => (category.id === categoryId ? updated : category))
          .sort((a, b) => a.displayOrder - b.displayOrder)
      );
      setMenuItems((current) =>
        current.map((item) =>
          item.categoryId === categoryId
            ? {
                ...item,
                categoryName: updated.name,
                categoryDisplayOrder: updated.displayOrder,
              }
            : item
        )
      );
      setNotice(`${updated.name} tab was updated.`);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    }
  }

  async function handleDeleteCategory(categoryId) {
    setError("");
    setNotice("");
    try {
      const category = menuCategories.find((entry) => entry.id === categoryId);
      await deleteRestaurantMenuCategory(restaurantId, categoryId);
      setMenuCategories((current) =>
        current.filter((entry) => entry.id !== categoryId)
      );
      setNotice(`${category?.name || "Category"} was removed.`);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleImageUpload(file) {
    const response = await uploadRestaurantMenuImage(restaurantId, file);
    return response.imageUrl;
  }

  function openView(view) {
    setActiveView(view);
    setError("");
    setNotice("");
    if (view === "menu" && !menuLoaded) {
      loadMenu();
    }
  }

  function hasOpenOrders(tableId) {
    return orders.some(
      (order) =>
        order.tableId === tableId &&
        (order.status === "PLACED" || order.status === "PREPARING")
    );
  }

  const groupedOrders = STATUS_BUCKETS.map((bucket) => ({
    ...bucket,
    orders: orders.filter((order) => order.status === bucket.key),
  }));
  const activeTableSessions = tableSessions.filter((session) => session.active);
  const copy = VIEW_COPY[activeView];

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-5 sm:py-7">
      <section className="overflow-hidden rounded-[30px] bg-ink text-white shadow-lift">
        <div className="grid lg:grid-cols-[1fr_auto]">
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-saffron">
              {copy.eyebrow}
            </p>
            <h1 className="mt-3 text-4xl font-bold sm:text-5xl">{copy.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">{copy.description}</p>
          </div>
          <div className="border-t border-white/10 bg-white/5 p-6 lg:min-w-72 lg:border-l lg:border-t-0">
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Signed in restaurant</p>
            <p className="mt-2 text-xl font-bold">{admin.restaurantName}</p>
            <p className="mt-1 text-sm text-white/55">{admin.restaurantLocation}</p>
            <div className="mt-5 flex items-center justify-between gap-4">
              <span className="text-xs text-white/45">@{admin.username}</span>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white hover:text-ink"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-3 sm:px-8" role="tablist" aria-label="Dashboard sections">
          {[
            ["orders", "Order Queue"],
            ["menu", "Menu Studio"],
            ["tables", "Tables & QR"],
            ["sales", "Sales & History"],
            ["staff", "Staff & Access"],
          ].filter(([view]) => view === "orders" || (view === "staff" ? admin.role === "RESTAURANT_ADMIN" : canManage)).map(([view, label]) => (
            <button
              key={view}
              type="button"
              role="tab"
              aria-selected={activeView === view}
              onClick={() => openView(view)}
              className={`min-h-11 shrink-0 rounded-full px-5 text-sm font-semibold transition ${
                activeView === view
                  ? "bg-saffron text-ink"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {platformNotice?.announcement && <aside className="mt-5 rounded-2xl border border-saffron bg-saffron/15 p-4 text-sm" role="status">
        <p className="font-bold">{platformNotice.productName}</p><p className="mt-1 whitespace-pre-wrap">{platformNotice.announcement}</p>
        {platformNotice.supportEmail && <p className="mt-2 text-xs text-muted">Support: {platformNotice.supportEmail}</p>}
      </aside>}

      <section className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-white px-3 py-2 font-semibold text-ink">
            {tables.length} tables
          </span>
          {activeView === "orders" ? (
            <span className="rounded-full bg-emerald-100 px-3 py-2 font-semibold text-emerald-800">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />
              {liveStatus}
            </span>
          ) : null}
        </div>
        {activeView === "orders" ? (
          <button
            type="button"
            onClick={() => loadOrderQueue()}
            disabled={loading}
            className="min-h-11 rounded-full border border-line bg-white px-5 text-sm font-semibold text-ink disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh orders"}
          </button>
        ) : activeView === "menu" ? (
          <button
            type="button"
            onClick={loadMenu}
            disabled={menuLoading}
            className="min-h-11 rounded-full border border-line bg-white px-5 text-sm font-semibold text-ink disabled:opacity-50"
          >
            {menuLoading ? "Refreshing..." : "Refresh menu"}
          </button>
        ) : null}
      </section>

      {error ? (
        <div role="alert" className="mt-4 rounded-[20px] bg-paprika/10 px-4 py-3 text-sm text-paprika">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="mt-4 rounded-[20px] bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-800">
          {notice}
        </div>
      ) : null}

      {activeView === "orders" ? (
        <div className="mt-6" role="tabpanel">
          {canSettle && <section>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-olive">Shared sessions</p>
                <h2 className="mt-1 text-2xl font-bold">Open table bills</h2>
              </div>
              <p className="text-xs text-muted">No payment gateway: staff records payment received.</p>
            </div>

            {activeTableSessions.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeTableSessions.map((session) => {
                  const blocked = hasOpenOrders(session.tableId);
                  const confirming = confirmingTableId === session.tableId;
                  return (
                    <article key={session.tableId} className="panel overflow-hidden">
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive">
                              Table {session.tableNumber}
                            </p>
                            <p className="mt-2 text-xs text-muted">
                              Session {session.sessionId?.slice(0, 8)}
                            </p>
                          </div>
                          <p className="text-2xl font-bold text-paprika">₹{session.totalAmount.toFixed(2)}</p>
                        </div>
                        <p className="mt-3 text-sm text-muted">
                          {session.totalItems} items · {blocked ? "Orders still in service" : "Ready to settle"}
                        </p>
                      </div>

                      {confirming ? (
                        <div className="border-t border-saffron/30 bg-saffron/15 p-4">
                          <p className="text-sm font-bold text-ink">Confirm external payment received?</p>
                          <p className="mt-1 text-xs leading-5 text-muted">
                            This closes the shared session and records ₹{session.totalAmount.toFixed(2)} in sales.
                          </p>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              disabled={closingTableId === session.tableId}
                              onClick={() => handleCloseSession(session.tableId)}
                              className="min-h-11 rounded-full bg-ink px-3 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              {closingTableId === session.tableId ? "Recording..." : "Confirm payment"}
                            </button>
                            <button
                              type="button"
                              disabled={closingTableId === session.tableId}
                              onClick={() => setConfirmingTableId(null)}
                              className="min-h-11 rounded-full border border-line bg-white px-3 text-xs font-semibold"
                            >
                              Keep open
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={blocked}
                          onClick={() => setConfirmingTableId(session.tableId)}
                          className="min-h-13 w-full border-t border-line bg-white px-4 py-4 text-sm font-semibold text-ink transition hover:bg-saffron/15 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {blocked ? "Serve all orders before settlement" : "Record paid & close session"}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="panel p-8 text-center">
                <p className="text-xl font-bold">No open table bills</p>
                <p className="mt-2 text-sm text-muted">A session appears here as soon as a guest places an order.</p>
              </div>
            )}
          </section>}

          <section className="mt-8 grid gap-5 xl:grid-cols-3">
            {groupedOrders.map((bucket) => (
              <div key={bucket.key} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{bucket.title}</h2>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-muted">
                    {bucket.orders.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {loading ? (
                    Array.from({ length: 2 }).map((_, index) => (
                      <div key={index} className="panel h-40 animate-pulse bg-white/70" />
                    ))
                  ) : bucket.orders.length ? (
                    bucket.orders.map((order) => (
                      <OrderCard
                        key={order.orderId}
                        order={order}
                        actions={[
                          ...(order.status === "PLACED"
                            ? [{
                                label: "Accept",
                                variant: "primary",
                                onClick: () => handleStatusUpdate(order.orderId, "PREPARING"),
                              }]
                            : []),
                          ...(order.status === "PREPARING"
                            ? [{
                                label: "Mark Served",
                                variant: "primary",
                                onClick: () => handleStatusUpdate(order.orderId, "SERVED"),
                              }]
                            : []),
                        ]}
                      />
                    ))
                  ) : (
                    <div className="panel p-6 text-center text-sm text-muted">
                      No {bucket.title.toLowerCase()} right now.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>
        </div>
      ) : null}

      {activeView === "menu" ? (
        <section className="mt-6 space-y-6" role="tabpanel">
          <form onSubmit={handleCreateCategory} className="panel grid gap-3 p-5 md:grid-cols-[1fr_auto]">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-olive">
                Create any menu tab
              </label>
              <input
                required
                maxLength={100}
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                className="mt-2 w-full rounded-[20px] border border-line bg-white px-4 py-3"
                placeholder="Desserts, Coffee, Tea, Vegan..."
              />
            </div>
            <button
              type="submit"
              disabled={creatingCategory}
              className="min-h-12 self-end rounded-full bg-olive px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {creatingCategory ? "Creating tab..." : "Add category tab"}
            </button>
          </form>

          {menuLoading ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="panel h-[520px] animate-pulse bg-white/70" />
              ))}
            </div>
          ) : menuCategories.length ? (
            menuCategories.map((category) => (
              <MenuCategoryPanel
                key={category.id}
                category={category}
                items={menuItems.filter((item) => item.categoryId === category.id)}
                savingItemId={savingItemId}
                creatingItem={creatingItemCategoryId === category.id}
                onCreateItem={handleCreateItem}
                onSaveItem={handleMenuItemSave}
                onUploadImage={handleImageUpload}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            ))
          ) : (
            <div className="panel p-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-olive">Menu studio</p>
              <h2 className="mt-2 text-2xl font-bold">Build your first menu tab</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                Add a category such as Desserts, Coffee, Tea, Vegan, or anything that fits your restaurant.
              </p>
            </div>
          )}
        </section>
      ) : null}

      {activeView === "tables" ? (
        <TablesPanel
          tables={tables}
          restaurantName={admin.restaurantName}
          loading={loading}
          onRefresh={loadWorkspace}
          onCreated={(table) => setTables((current) => [...current.filter((entry) => entry.id !== table.id), table])}
        />
      ) : null}

      {activeView === "sales" ? (
        <div className="mt-6">
          <SalesReportPanel tables={tables} restaurantId={restaurantId} />
        </div>
      ) : null}
      {activeView === "staff" && admin.role === "RESTAURANT_ADMIN" && <div className="mt-6"><StaffPanel /></div>}
    </main>
  );
}
