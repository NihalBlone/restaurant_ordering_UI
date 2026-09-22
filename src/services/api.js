import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15000,
  withCredentials: true,
});

let csrfRequest;
api.interceptors.request.use(async (config) => {
  if (!["get", "head", "options"].includes((config.method || "get").toLowerCase())) {
    // Share first-token requests so concurrent mutations cannot race cookie creation.
    csrfRequest ||= api.get("/auth/csrf").finally(() => { csrfRequest = null; });
    const { data } = await csrfRequest;
    config.headers[data.headerName] = data.token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error?.config?.url || "";
    if (
      error?.response?.status === 401 &&
      !requestUrl.includes("/auth/login") &&
      !requestUrl.includes("/auth/platform-login") &&
      !requestUrl.includes("/auth/password-reset")
    ) {
      window.dispatchEvent(new Event("restaurant-auth-expired"));
    }
    return Promise.reject(error);
  }
);

function toApiError(error) {
  const details = error?.response?.data?.details;
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong. Please try again.";
  const apiError = new Error(
    Array.isArray(details) && details.length ? `${message}: ${details.join(", ")}` : message
  );
  apiError.status = error?.response?.status;
  return apiError;
}

async function execute(request) {
  try {
    const { data } = await request();
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export function loginRestaurant(credentials) {
  return execute(() => api.post("/auth/login", credentials));
}

export function getAdminSession() {
  return execute(() => api.get("/auth/me"));
}

export async function logoutRestaurant() {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    throw toApiError(error);
  }
}

export function requestPasswordReset(username) {
  return execute(() => api.post("/auth/password-reset/request", { username }));
}

export function confirmPasswordReset(token, newPassword) {
  return execute(() =>
    api.post("/auth/password-reset/confirm", { token, newPassword })
  );
}

export function getMenu(tableId) {
  return execute(() => api.get("/menu", { params: { tableId } }));
}

export function getAdminTables() {
  return execute(() => api.get("/admin/tables"));
}

export function createAdminTable(payload) {
  return execute(() => api.post("/admin/tables", payload));
}

export function getSalesReport({ from, to, tableId, menuItemId, timeZone, page = 0, size = 25, signal, platformRestaurantId }) {
  return execute(() =>
    api.get(platformRestaurantId ? `/platform/restaurants/${platformRestaurantId}/reports/sales` : "/admin/reports/sales", {
      params: { from, to, tableId: tableId || undefined, menuItemId: menuItemId || undefined, timeZone, page, size },
      signal,
    })
  );
}

export function getRestaurantMenuItems(restaurantId, platform = false) {
  return execute(() => api.get(`${platform ? "/platform" : ""}/restaurants/${restaurantId}/menu-items`));
}

export function getRestaurantMenuCategories(restaurantId) {
  return execute(() => api.get(`/restaurants/${restaurantId}/menu-categories`));
}

export function createRestaurantMenuCategory(restaurantId, payload) {
  return execute(() =>
    api.post(`/restaurants/${restaurantId}/menu-categories`, payload)
  );
}

export function updateRestaurantMenuCategory(restaurantId, categoryId, payload) {
  return execute(() =>
    api.put(`/restaurants/${restaurantId}/menu-categories/${categoryId}`, payload)
  );
}

export async function deleteRestaurantMenuCategory(restaurantId, categoryId) {
  try {
    await api.delete(`/restaurants/${restaurantId}/menu-categories/${categoryId}`);
  } catch (error) {
    throw toApiError(error);
  }
}

export function createRestaurantMenuItem(restaurantId, payload) {
  return execute(() => api.post(`/restaurants/${restaurantId}/menu-items`, payload));
}

export function updateRestaurantMenuItem(restaurantId, menuItemId, payload) {
  return execute(() =>
    api.put(`/restaurants/${restaurantId}/menu-items/${menuItemId}`, payload)
  );
}

export function uploadRestaurantMenuImage(restaurantId, file) {
  const formData = new FormData();
  formData.append("file", file);
  return execute(() =>
    api.post(`/restaurants/${restaurantId}/menu-images`, formData)
  );
}

export function placeOrder(payload, idempotencyKey, orderingClientId) {
  return execute(() =>
    api.post("/orders", payload, {
      headers: {
        ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
        ...(orderingClientId ? { "X-Ordering-Client-Id": orderingClientId } : {}),
      },
    })
  );
}

export function getOrders({ tableId, sessionId, page = 0, size = 20 }) {
  return execute(() =>
    api.get("/orders", {
      params: { tableId, sessionId: sessionId || undefined, page, size },
    })
  );
}

export function updateOrderStatus(orderId, status) {
  return execute(() => api.put(`/orders/${orderId}/status`, { status }));
}

export function closeTableSession(tableId) {
  return execute(() => api.post(`/table-sessions/${tableId}/close`));
}

export default api;

export const loginPlatform = (credentials) => execute(() => api.post("/auth/platform-login", credentials));
export const platformGet = (path, params, signal) => execute(() => api.get(`/platform/${path}`, { params, signal }));
export const platformSave = (path, body, method = "put") => execute(() => api[method](`/platform/${path}`, body));
export const getPlatformNotice = () => execute(() => api.get("/admin/notice"));
const staffPath = (restaurantId) => restaurantId ? `/platform/restaurants/${restaurantId}/staff` : "/admin/staff";
export const getStaff = (restaurantId) => execute(() => api.get(staffPath(restaurantId)));
export const inviteStaff = (restaurantId, body) => execute(() => api.post(staffPath(restaurantId), body));
export const updateStaff = (restaurantId, id, body) => execute(() => api.put(`${staffPath(restaurantId)}/${id}`, body));
export const staffAction = (restaurantId, id, action) => execute(() => api.post(`${staffPath(restaurantId)}/${id}/${action}`));
