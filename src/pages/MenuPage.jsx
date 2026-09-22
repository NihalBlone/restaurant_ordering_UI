import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import CartBar from "../components/CartBar";
import CartModal from "../components/CartModal";
import CategorySection from "../components/CategorySection";
import { useCart } from "../context/CartContext";
import useTableOrders from "../hooks/useTableOrders";
import { getMenu } from "../services/api";

export default function MenuPage() {
  const [params] = useSearchParams();
  const tableId = params.get("tableId");
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const { ordersResponse: tableOrders } = useTableOrders(tableId);
  const { items, itemCount, totalAmount, setTableId, addItem, decreaseItem, removeItem } =
    useCart();

  useEffect(() => {
    if (tableId) {
      setTableId(tableId);
    }
  }, [setTableId, tableId]);

  useEffect(() => {
    if (!tableId) {
      setError("Missing tableId in the QR link.");
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    getMenu(tableId)
      .then((data) => {
        if (!active) return;
        setMenu(data);
        setActiveCategoryId(data.categories[0]?.id ?? null);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tableId]);

  const quantitiesByItemId = useMemo(
    () =>
      items.reduce((acc, item) => {
        acc[item.id] = item.quantity;
        return acc;
      }, {}),
    [items]
  );

  const activeCategory = useMemo(
    () =>
      menu?.categories.find((category) => category.id === activeCategoryId) ??
      menu?.categories[0] ??
      null,
    [activeCategoryId, menu]
  );

  const matchingCategories = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query || !menu) return [];
    return menu.categories
      .map((category) => ({
        ...category,
        items: category.name.toLocaleLowerCase().includes(query)
          ? category.items
          : category.items.filter((item) =>
              `${item.name} ${item.description}`.toLocaleLowerCase().includes(query)
            ),
      }))
      .filter((category) => category.items.length > 0);
  }, [menu, searchQuery]);

  const matchingItemCount = matchingCategories.reduce(
    (count, category) => count + category.items.length,
    0
  );

  if (loading) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
        <div className="panel animate-pulse p-6">
          <div className="h-6 w-40 rounded-full bg-shell" />
          <div className="mt-4 h-14 rounded-3xl bg-shell" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 rounded-[26px] bg-shell" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto min-h-screen max-w-md px-4 py-10">
        <div className="panel p-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-paprika">
            Menu unavailable
          </p>
          <h1 className="mt-3 text-3xl font-bold">We could not load this table</h1>
          <p className="mt-3 text-muted">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-28 pt-5">
      <section className="panel animate-float-in overflow-hidden bg-hero-glow p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-olive">
              Table service
            </p>
            <h1 className="mt-2 text-4xl font-bold leading-tight text-ink">
              {menu.restaurantName}
            </h1>
            <p className="mt-2 text-sm text-muted">
              Table {menu.tableNumber} • {menu.restaurantLocation}
            </p>
          </div>
          <div className="rounded-[22px] bg-white/75 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Ordering</p>
            <p className="mt-1 text-sm font-semibold text-ink">Shared table</p>
          </div>
        </div>

        {tableOrders?.sessionActive ? (
          <Link
            to={`/track?tableId=${tableId}`}
            className="mt-5 flex items-center justify-between gap-4 rounded-[22px] bg-ink px-5 py-4 text-white"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                Table order so far
              </p>
              <p className="mt-1 text-sm font-semibold">
                {tableOrders.sessionTotalItems || 0} items · ₹
                {Number(tableOrders.sessionTotalAmount || 0).toFixed(2)}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-saffron">
              View orders
            </span>
          </Link>
        ) : null}

        <div className="relative mt-5">
          <label className="sr-only" htmlFor="menu-search">
            Search the menu
          </label>
          <input
            id="menu-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search dishes, coffee, vegan..."
            className="min-h-14 w-full rounded-[22px] border border-white/70 bg-white/90 px-5 py-4 pr-24 text-base shadow-sm placeholder:text-muted/70"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-2 min-h-10 rounded-full bg-shell px-4 text-sm font-semibold text-muted"
            >
              Clear
            </button>
          ) : null}
        </div>

        <div
          className="mt-5 flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Menu categories"
        >
          {menu.categories.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => setActiveCategoryId(category.id)}
              id={`category-tab-${category.id}`}
              role="tab"
              aria-selected={activeCategoryId === category.id}
              aria-controls={`category-${category.id}`}
              className={`shrink-0 rounded-full px-5 py-3 text-sm font-semibold transition-all ${
                activeCategoryId === category.id
                  ? "bg-ink text-white shadow-lg shadow-ink/15"
                  : "bg-white/80 text-ink hover:bg-white"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-6 space-y-8">
        {searchQuery.trim() ? (
          matchingCategories.length ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-olive">
                    Search results
                  </p>
                  <h2 className="mt-1 text-2xl font-bold">
                    {matchingItemCount} {matchingItemCount === 1 ? "dish" : "dishes"} found
                  </h2>
                </div>
              </div>
              {matchingCategories.map((category) => (
                <CategorySection
                  key={category.id}
                  category={category}
                  quantitiesByItemId={quantitiesByItemId}
                  onAdd={addItem}
                  onIncrease={addItem}
                  onDecrease={decreaseItem}
                  searchMode
                />
              ))}
            </>
          ) : (
            <div className="panel p-8 text-center">
              <h2 className="text-2xl font-bold">No matching dishes</h2>
              <p className="mt-2 text-sm text-muted">
                Try a dish name, ingredient, or category.
              </p>
            </div>
          )
        ) : activeCategory ? (
          <CategorySection
            key={activeCategory.id}
            category={activeCategory}
            quantitiesByItemId={quantitiesByItemId}
            onAdd={addItem}
            onIncrease={addItem}
            onDecrease={decreaseItem}
          />
        ) : (
          <div className="panel p-8 text-center text-muted">
            No available menu items right now.
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-sm text-muted">
        Already ordered?{" "}
        <Link
          className="font-semibold text-paprika"
          to={`/track?tableId=${tableId}`}
        >
          Track your table
        </Link>
      </div>

      <CartModal
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={items}
        totalAmount={totalAmount}
        onIncrease={addItem}
        onDecrease={decreaseItem}
        onRemove={removeItem}
        tableId={tableId}
      />

      <CartBar
        itemCount={itemCount}
        totalAmount={totalAmount}
        tableId={tableId}
        onOpen={() => setCartOpen(true)}
      />
    </main>
  );
}
