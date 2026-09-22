# QR Restaurant Ordering UI

React 18 + Vite + Tailwind frontend for customer QR ordering and restaurant administration.

## Production Release

This UI remains in its own repository. Hosting is configured in the
[backend deployment repository](https://github.com/NihalBlone/restaurant-ordering), whose Dockerfile
fetches the published UI commit pinned in `deploy/frontend.ref` and packages its build inside Spring Boot.
UI, API, uploads, and WebSocket use one HTTPS origin. Do not create a separate static hosting service
without redesigning cookie, CSRF, and WebSocket-origin handling.

After committing and pushing a UI update, select that version from the backend repository:

```sh
# Run from this UI repository, after pushing its commit to origin/main.
UI_SHA=$(git rev-parse HEAD)
cd /Users/nihaltamang/Documents/personal/qr-restaurant-ordering-system
node scripts/pin-frontend.mjs "$UI_SHA"
git add deploy/frontend.ref
git commit -m "Release updated restaurant UI"
git push origin main
```

A UI push alone does not deploy. Both repositories have CI, and backend CI also tests the pinned UI.
The UI repository must remain publicly fetchable for this Docker build; never put a GitHub token in a
Dockerfile, build argument, or Git URL. A private UI repo needs a separate secret-safe artifact strategy.
See the [full deployment guide](https://github.com/NihalBlone/restaurant-ordering/blob/main/docs/DEPLOYMENT.md)
for first-time push commands, Render setup, domain purchase, email, and secrets.

## Run

Start the Spring Boot backend first, then:

    npm install
    npm run dev

Open:

- Customer menu: http://localhost:5173/menu?tableId=<table UUID>
- Restaurant login: http://localhost:5173/admin/login
- Platform owner login: http://localhost:5173/platform/login

Local sample login:

    admin / Admin@12345

The Vite development server proxies /api, /ws-orders, and /uploads to http://localhost:8080. Override the target when needed:

    VITE_BACKEND_TARGET=http://localhost:18080 npm run dev -- --port 5174

## Customer Flow

- Scan a table QR link
- Browse category tabs or search the menu
- Add items and place an order with an optional customer name
- See every order and running total in the shared table session
- Receive live status updates
- Automatically start clean after restaurant staff records payment and closes the session

## Restaurant Flow

- Secure username/password login and password reset
- Live order queue with status controls
- Tables & QR screen with table creation, search, QR preview, copyable customer links, and downloadable PNG table cards
- Explicit external-payment settlement and session close
- Flexible category/tab creation and editing
- Item name, description, price, dietary flag, availability, and photo management
- Date-filtered sales statement
- Combined date, table, and food-item history filters
- Bar charts by food item, table, or day, showing sales amount or quantity
- Per-table sales totals and detailed historical bills

## Build

    npm run build

## Tables And QR Setup

1. Sign in at `/admin/login` and open **Tables & QR**.
2. Enter a unique table name (for example `T6` or `PATIO 1`) and click **Add table**.
3. Click **Download QR card**, print the PNG, and place it on the matching table. **Copy link** and **Open menu** let you test the customer flow.

The backend controls the QR destination using `APP_CUSTOMER_BASE_URL` (default `http://localhost:5173`). QR codes pointing to localhost work only on the same computer. For phones on the same Wi-Fi:

- Set backend `APP_CUSTOMER_BASE_URL=http://<your-Mac-Wi-Fi-IP>:5173` and `APP_WEBSOCKET_ALLOWED_ORIGINS` to the same origin.
- Restart the backend and start this UI with `npm run dev -- --host 0.0.0.0`.
- Refresh the table cards and re-download the QR images. Do not expose the development server to the public internet.

For deployment, use a stable public HTTPS URL and PostgreSQL. The backend now uses persistent file-backed H2 for local development. Data from an older in-memory backend must be exported before stopping that process if you need to retain it. Closing a paid table session does not change the table ID or its QR code.

## Platform And Staff Access

The platform owner signs in at `/platform/login`. Configure its bootstrap username/email/password in the backend environment; there are no default platform credentials. Production also requires an authenticator code. See the backend's `docs/platform-setup.md` for setup and deployment requirements.

The platform console has Overview, Restaurants, Reports, Audit, and Settings screens. It supports restaurant onboarding with owner invitations, capacity/plan metadata, suspension/soft archive, staff access controls, scoped read-only sales reports, CSV summaries, audit history, and restaurant announcements.

Restaurant owners have a **Staff & Access** tab. Managers can use menu/tables/reports. Kitchen and waiter accounts see the order queue; only waiters, managers, and owners can settle a bill. Backend permissions enforce these rules. Use separate browser profiles if you need simultaneous platform and restaurant logins.

Axios automatically obtains and sends CSRF tokens for mutations. The backend must be restarted after this update. Host the production frontend, API, uploads, and websocket endpoint under the same HTTPS origin. Demo credentials are shown only in Vite development builds.

## Sales And History

Open **Sales & History**, choose the date range and optional table/food item, then click **Apply filters**. Use **Group chart by** to compare food items, tables, or settlement days; use **Measure** to switch between revenue and quantity. Charts include every matching bill, not only the visible history page.

A food-item filter shows only sales of that item. Expand a bill to see the matching order lines alongside the full bill amount for reference. Historical prices are preserved even if today's menu price changes. Dates use settlement time in your browser's timezone. Open, unpaid sessions are not included.

Editing filters does not change the report until you apply them; moving between pages keeps the last applied filters. The backend must be restarted after this update so it returns the new chart aggregates.

## Tests

    npm test

Includes a PNG encode/decode round-trip that verifies the QR points to the exact customer table URL.
