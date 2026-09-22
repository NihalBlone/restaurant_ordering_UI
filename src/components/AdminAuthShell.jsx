import { Link } from "react-router-dom";

export default function AdminAuthShell({ eyebrow, title, description, children, platform = false }) {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:grid lg:place-items-center">
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-saffron/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-olive/20 blur-3xl" />

      <section className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-[36px] border border-line bg-card shadow-lift lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex min-h-72 flex-col justify-between bg-ink p-7 text-white sm:p-10">
          <div>
            <Link to="/menu" className="inline-flex items-center gap-2 text-sm font-bold tracking-wide">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-saffron text-ink">Q</span>
              TABLESIDE
            </Link>
            <p className="mt-16 text-xs font-semibold uppercase tracking-[0.24em] text-saffron">
              {platform ? "Platform operations" : "Restaurant operations"}
            </p>
            <h2 className="mt-4 max-w-sm text-4xl font-bold leading-tight sm:text-5xl">
              {platform ? "A home for every restaurant you serve." : "Service, menu and sales in one calm workspace."}
            </h2>
          </div>
          <p className="mt-10 max-w-sm text-sm leading-6 text-white/60">
            {platform ? "Onboard restaurants, control access, and understand activity across your platform." : "Customer ordering stays login-free. This secure area is only for restaurant staff."}
          </p>
        </div>

        <div className="p-7 sm:p-10 lg:p-14">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-olive">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-bold text-ink">{title}</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}
