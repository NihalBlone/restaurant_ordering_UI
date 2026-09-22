import { useEffect, useState } from "react";

export default function MenuItem({
  item,
  quantity = 0,
  onAdd,
  onIncrease,
  onDecrease,
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const vegetarian = item.vegetarian !== false;

  useEffect(() => {
    setImageFailed(false);
  }, [item.imageUrl]);

  return (
    <article className="overflow-hidden rounded-[26px] border border-line bg-white/75 p-3 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:p-4">
      <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-4 sm:grid-cols-[132px_minmax(0,1fr)]">
        <div className="relative min-h-32 overflow-hidden rounded-[20px] bg-gradient-to-br from-saffron/30 via-white to-olive/20 sm:min-h-36">
          {item.imageUrl && !imageFailed ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              loading="lazy"
              className="h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full min-h-32 flex-col items-center justify-center px-2 text-center sm:min-h-36">
              <span className="text-3xl font-bold text-ink/25">
                {item.name.charAt(0).toUpperCase()}
              </span>
              <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                Freshly made
              </span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col justify-between gap-3">
          <div>
            <div
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${
                vegetarian ? "text-emerald-700" : "text-paprika"
              }`}
            >
              <span
                className={`grid h-4 w-4 place-items-center border ${
                  vegetarian ? "border-emerald-600" : "border-paprika"
                }`}
                aria-hidden="true"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    vegetarian ? "bg-emerald-600" : "bg-paprika"
                  }`}
                />
              </span>
              {vegetarian ? "Vegetarian" : "Non-vegetarian"}
            </div>
            <h3 className="mt-2 text-lg font-semibold leading-tight text-ink">
              {item.name}
            </h3>
            <p className="mt-1 line-clamp-3 text-sm leading-5 text-muted">
              {item.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-base font-bold text-paprika">
              ₹{Number(item.price).toFixed(2)}
            </p>
            {quantity > 0 ? (
              <div className="flex min-w-[112px] items-center justify-between rounded-full bg-ink px-1.5 py-1 text-white">
                <button
                  type="button"
                  className="h-9 w-9 rounded-full text-xl transition hover:bg-white/10"
                  onClick={() => onDecrease(item.id)}
                  aria-label={`Decrease ${item.name}`}
                >
                  -
                </button>
                <span className="text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  className="h-9 w-9 rounded-full text-xl transition hover:bg-white/10"
                  onClick={() => onIncrease(item)}
                  aria-label={`Increase ${item.name}`}
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="min-h-11 rounded-full bg-paprika px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a53e23]"
                onClick={() => onAdd(item)}
              >
                Add
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
