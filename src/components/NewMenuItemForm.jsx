import { useState } from "react";

const INITIAL_FORM = {
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  vegetarian: true,
  available: true,
};

export default function NewMenuItemForm({
  category,
  saving,
  onCreate,
  onCancel,
  onUploadImage,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const created = await onCreate({
      ...form,
      categoryId: category.id,
      name: form.name.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      price: Number(form.price),
    });
    if (created) {
      setForm(INITIAL_FORM);
      onCancel();
    }
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
      className="rounded-[26px] border border-dashed border-olive/40 bg-olive/5 p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-olive">
            New dish
          </p>
          <h3 className="mt-1 text-xl font-bold">Add to {category.name}</h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="h-10 w-10 rounded-full border border-line bg-white text-lg"
          aria-label="Cancel adding dish"
        >
          ×
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
            Dish name
          </span>
          <input
            required
            maxLength={120}
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3"
            placeholder="Chocolate brownie"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
            Price (₹)
          </span>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={form.price}
            onChange={(event) => updateField("price", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3"
            placeholder="199"
          />
        </label>
      </div>

      <label className="mt-3 block">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
          Description
        </span>
        <textarea
          required
          rows={3}
          maxLength={500}
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
          className="mt-2 w-full resize-none rounded-2xl border border-line bg-white px-4 py-3"
          placeholder="Tell guests what makes this dish special"
        />
      </label>

      <label className="mt-3 block">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
          Photo URL
        </span>
        <input
          type="text"
          maxLength={1000}
          value={form.imageUrl}
          onChange={(event) => updateField("imageUrl", event.target.value)}
          className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3"
          placeholder="https://... or uploaded path"
        />
      </label>

      <div className="mt-3 rounded-2xl border border-dashed border-olive/40 bg-white/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Upload photo</p>
            <p className="mt-1 text-xs text-muted">PNG, JPEG or WebP, up to 5 MB.</p>
          </div>
          <label className="cursor-pointer rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">
            {uploading ? "Uploading..." : "Choose file"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={uploading || saving}
              onChange={handleImageUpload}
              className="sr-only"
            />
          </label>
        </div>
        {form.imageUrl ? (
          <img
            src={form.imageUrl}
            alt="New dish preview"
            className="mt-4 h-36 w-full rounded-2xl object-cover"
          />
        ) : null}
        {uploadError ? <p className="mt-3 text-sm text-paprika">{uploadError}</p> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-emerald-700">
          <input
            type="checkbox"
            checked={form.vegetarian}
            onChange={(event) => updateField("vegetarian", event.target.checked)}
            className="h-5 w-5 accent-emerald-600"
          />
          Vegetarian
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.available}
            onChange={(event) => updateField("available", event.target.checked)}
            className="h-5 w-5 accent-paprika"
          />
          Available now
        </label>
      </div>

      <button
        type="submit"
        disabled={saving || uploading}
        className="mt-4 min-h-12 rounded-full bg-paprika px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Adding dish..." : "Add dish"}
      </button>
    </form>
  );
}
