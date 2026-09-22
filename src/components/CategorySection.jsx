import MenuItem from "./MenuItem";

export default function CategorySection({
  category,
  quantitiesByItemId,
  onAdd,
  onIncrease,
  onDecrease,
  searchMode = false,
}) {
  return (
    <section
      id={`category-${category.id}`}
      role={searchMode ? undefined : "tabpanel"}
      aria-labelledby={searchMode ? undefined : `category-tab-${category.id}`}
      className="animate-float-in space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-olive">
            Course
          </p>
          <h2 className="text-2xl font-bold text-ink">{category.name}</h2>
        </div>
        <div className="rounded-full bg-saffron/20 px-3 py-1 text-xs font-semibold text-ink">
          {category.items.length} items
        </div>
      </div>

      <div className="space-y-3">
        {category.items.length ? (
          category.items.map((item) => (
            <MenuItem
              key={item.id}
              item={item}
              quantity={quantitiesByItemId[item.id] || 0}
              onAdd={onAdd}
              onIncrease={onIncrease}
              onDecrease={onDecrease}
            />
          ))
        ) : (
          <div className="rounded-[24px] border border-dashed border-line bg-white/60 p-6 text-center text-sm text-muted">
            No available dishes in this category yet.
          </div>
        )}
      </div>
    </section>
  );
}
