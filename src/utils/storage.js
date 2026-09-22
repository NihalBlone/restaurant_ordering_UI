const SESSION_PREFIX = "tabletap-session:";
const ORDERING_CLIENT_KEY = "tabletap-ordering-client";

export function getTableSession(tableId) {
  if (!tableId) return null;
  const raw = localStorage.getItem(`${SESSION_PREFIX}${tableId}`);
  return raw ? JSON.parse(raw) : null;
}

export function setTableSession(tableId, session) {
  if (!tableId || !session) return;
  localStorage.setItem(`${SESSION_PREFIX}${tableId}`, JSON.stringify(session));
}

export function clearTableSession(tableId) {
  if (!tableId) return;
  localStorage.removeItem(`${SESSION_PREFIX}${tableId}`);
}

export function buildIdempotencyKey(tableId) {
  if (!tableId) return crypto.randomUUID();
  return `${tableId}-${crypto.randomUUID()}`;
}

export function getOrderingClientId() {
  const existing = localStorage.getItem(ORDERING_CLIENT_KEY);
  if (existing) return existing;
  const clientId = crypto.randomUUID();
  localStorage.setItem(ORDERING_CLIENT_KEY, clientId);
  return clientId;
}
