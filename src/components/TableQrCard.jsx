import { useEffect, useRef, useState } from "react";
import { downloadTableQr, generateTableQr } from "../services/tableQr";

export default function TableQrCard({ table, restaurantName, isNew }) {
  const [qrImage, setQrImage] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [retry, setRetry] = useState(0);
  const linkInput = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setQrImage("");
    setError("");
    generateTableQr(table.qrCodeUrl)
      .then((image) => { if (!cancelled) setQrImage(image); })
      .catch(() => { if (!cancelled) setError("Could not generate this QR code. Please retry."); });
    return () => { cancelled = true; };
  }, [table.qrCodeUrl, retry]);

  async function copyLink() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(table.qrCodeUrl);
      setMessage("Customer link copied.");
    } catch {
      linkInput.current?.focus();
      linkInput.current?.select();
      setMessage("Link selected. Copy it using your browser or keyboard.");
    }
  }

  async function download() {
    setDownloading(true);
    setError("");
    try {
      await downloadTableQr({ qrImage, table, restaurantName });
      setMessage("QR card downloaded. Print it and place it on this table.");
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <article className={`panel overflow-hidden ${isNew ? "ring-2 ring-saffron" : ""}`}>
      <header className="flex items-center justify-between gap-3 border-b border-line p-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive">Table</p>
          <h3 className="mt-1 break-words text-2xl font-bold">{table.tableNumber}</h3>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${table.active ? "bg-emerald-100 text-emerald-800" : "bg-shell text-muted"}`}>
          {isNew ? "Just added" : table.active ? "Active" : "Inactive"}
        </span>
      </header>

      <div className="p-5">
        <div className="mx-auto flex aspect-square w-full max-w-64 items-center justify-center overflow-hidden rounded-2xl border border-line bg-white">
          {qrImage ? (
            <img src={qrImage} alt={`Scan to order at table ${table.tableNumber}`} width="256" height="256" className="h-full w-full" />
          ) : error ? (
            <button type="button" onClick={() => setRetry((value) => value + 1)} className="min-h-11 rounded-full border border-line px-5 text-sm font-semibold">
              Retry QR generation
            </button>
          ) : (
            <span role="status" className="animate-pulse text-sm text-muted">Generating QR...</span>
          )}
        </div>
        <p className="mt-3 text-center text-xs text-muted">Scan to browse, order, and share the table bill.</p>
        <label className="mt-5 block text-xs font-semibold text-muted" htmlFor={`table-link-${table.id}`}>Customer menu link</label>
        <input
          id={`table-link-${table.id}`}
          ref={linkInput}
          readOnly
          value={table.qrCodeUrl}
          onFocus={(event) => event.target.select()}
          className="mt-1 min-h-11 w-full rounded-xl border border-line bg-white px-3 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-saffron"
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={copyLink} className="min-h-11 rounded-full border border-line bg-white px-3 text-sm font-semibold transition hover:bg-shell">
            Copy link
          </button>
          {qrImage ? (
            <a href={table.qrCodeUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center rounded-full border border-line bg-white px-3 text-sm font-semibold transition hover:bg-shell">
              Open menu
            </a>
          ) : <span />}
        </div>
        <button type="button" disabled={!qrImage || downloading} onClick={download} className="mt-3 min-h-12 w-full rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-olive disabled:cursor-not-allowed disabled:opacity-50">
          {downloading ? "Preparing download..." : "Download QR card"}
        </button>
        {message ? <p role="status" className="mt-3 text-xs leading-5 text-olive">{message}</p> : null}
        {error ? <p role="alert" className="mt-3 text-xs leading-5 text-paprika">{error}</p> : null}
      </div>
    </article>
  );
}
