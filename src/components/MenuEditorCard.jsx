import { useEffect, useState } from "react";

function createForm(item) {
  return {
    name: item.name,
    description: item.description,
    price: item.price,
    imageUrl: item.imageUrl || "",
    vegetarian: item.vegetarian,
    available: item.available,
  };
}

export default function MenuEditorCard({ item, saving, onSave, onUploadImage }) {
  const [form, setForm] = useState(() => createForm(item));
  const [imageFailed, setImageFailed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    setForm(createForm(item));
    setImageFailed(false);
  }, [item]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === "imageUrl") {
      setImageFailed(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSave(item.id, {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      price: Number(form.price),
    });
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");
    try {
      const imageUrl = await onUploadImage(file);
      updateField("imageUrl", imageUrl);
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`panel overflow-hidden transition ${
        form.available ? "" : "opacity-70"
      }`}
    >
      <div className="relative aspect-[16/8] overflow-hidden bg-gradient-to-br from-saffron/25 via-white to-olive/25">
        {form.imageUrl && !imageFailed ? (
          <img
            src={form.imageUrl}
            alt="Menu item preview"
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <p className="text-4xl font-bold text-ink/20">
                {form.name.charAt(0).toUpperCase() || "M"}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Add a dish photo
              </p>
            </div>
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink shadow-sm">
          {item.categoryName}
        </span>
        {!form.available ? (
          <span className="absolute right-4 top-4 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">
            Hidden
          </span>
        ) : null}
      </div>

      <div className="space-y-4 p-5">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Dish name
          </span>
          <input
            required
            maxLength={120}
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-ink"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Description
          </span>
          <textarea
            required
            maxLength={500}
            rows={3}
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            className="mt-2 w-full resize-none rounded-2xl border border-line bg-white px-4 py-3 text-ink"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-[0.55fr_1.45fr]">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Price (₹)
            </span>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={(event) => updateField("price", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-ink"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Photo URL
            </span>
            <input
              type="text"
              maxLength={1000}
              placeholder="https://... or uploaded path"
              value={form.imageUrl}
              onChange={(event) => updateField("imageUrl", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-ink"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-dashed border-olive/40 bg-olive/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Upload a menu photo</p>
              <p className="mt-1 text-xs text-muted">PNG, JPEG or WebP, up to 5 MB.</p>
            </div>
            <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm">
              {uploading ? "Uploading..." : "Choose photo"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploading || saving}
                onChange={handleImageUpload}
                className="sr-only"
              />
            </label>
          </div>
          {uploadError ? (
            <p className="mt-3 text-sm text-paprika">{uploadError}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3">
            <input
              type="checkbox"
              checked={form.vegetarian}
              onChange={(event) => updateField("vegetarian", event.target.checked)}
              className="h-5 w-5 accent-emerald-600"
            />
            <span className="text-sm font-semibold text-emerald-700">Vegetarian</span>
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(event) => updateField("available", event.target.checked)}
              className="h-5 w-5 accent-paprika"
            />
            <span className="text-sm font-semibold text-ink">Available</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={saving || uploading}
          className="min-h-12 w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-paprika disabled:cursor-wait disabled:opacity-60"
        >
          {saving ? "Saving changes..." : "Save menu item"}
        </button>
      </div>
    </form>
  );
}
