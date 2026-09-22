import { useEffect, useState } from "react";
import MenuEditorCard from "./MenuEditorCard";
import NewMenuItemForm from "./NewMenuItemForm";

export default function MenuCategoryPanel({
  category,
  items,
  savingItemId,
  creatingItem,
  onCreateItem,
  onSaveItem,
  onUploadImage,
  onUpdateCategory,
  onDeleteCategory,
}) {
  const [editing, setEditing] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [name, setName] = useState(category.name);
  const [displayOrder, setDisplayOrder] = useState(category.displayOrder);

  useEffect(() => {
    setName(category.name);
    setDisplayOrder(category.displayOrder);
  }, [category]);

  async function saveCategory() {
    const saved = await onUpdateCategory(category.id, {
      name: name.trim(),
      displayOrder: Number(displayOrder),
    });
    if (saved) setEditing(false);
  }

  return (
    <section className="space-y-4">
      <div className="panel p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {editing ? (
            <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_140px]">
              <input
                required
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-2xl border border-line bg-white px-4 py-3 text-lg font-semibold"
                aria-label="Category name"
              />
              <input
                required
                type="number"
                min="1"
                value={displayOrder}
                onChange={(event) => setDisplayOrder(event.target.value)}
                className="rounded-2xl border border-line bg-white px-4 py-3"
                aria-label="Display order"
              />
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-olive">
                Menu category · position {category.displayOrder}
              </p>
              <h2 className="mt-1 text-3xl font-bold text-ink">{category.name}</h2>
              <p className="mt-1 text-sm text-muted">{items.length} dishes</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={saveCategory}
                  className="min-h-11 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
                >
                  Save category
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="min-h-11 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setAddingItem((current) => !current)}
                  className="min-h-11 rounded-full bg-paprika px-4 py-2 text-sm font-semibold text-white"
                >
                  Add dish
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="min-h-11 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold"
                >
                  Edit tab
                </button>
                {!items.length ? (
                  <button
                    type="button"
                    onClick={() => onDeleteCategory(category.id)}
                    className="min-h-11 rounded-full border border-paprika/30 bg-paprika/5 px-4 py-2 text-sm font-semibold text-paprika"
                  >
                    Delete
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      {addingItem ? (
        <NewMenuItemForm
          category={category}
          saving={creatingItem}
          onCreate={onCreateItem}
          onUploadImage={onUploadImage}
          onCancel={() => setAddingItem(false)}
        />
      ) : null}

      {items.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {items.map((item) => (
            <MenuEditorCard
              key={item.id}
              item={item}
              saving={savingItemId === item.id}
              onSave={onSaveItem}
              onUploadImage={onUploadImage}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[26px] border border-dashed border-line bg-white/45 p-8 text-center text-muted">
          This tab is empty. Add its first dish when you are ready.
        </div>
      )}
    </section>
  );
}
