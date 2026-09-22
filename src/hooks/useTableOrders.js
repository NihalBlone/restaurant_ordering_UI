import { useCallback, useEffect, useRef, useState } from "react";
import { getOrders } from "../services/api";
import { subscribeToTopic } from "../services/websocket";

function normalizeOrdersResponse(data) {
  const orders = data.orders || [];
  const derivedItems = orders.reduce(
    (total, order) =>
      total +
      Number(
        order.totalItems ||
          order.items?.reduce((itemTotal, item) => itemTotal + item.quantity, 0) ||
          0
      ),
    0
  );
  const derivedAmount = orders.reduce(
    (total, order) =>
      total + Number(order.estimatedTotalAmount ?? order.totalAmount ?? 0),
    0
  );

  return {
    ...data,
    orders,
    sessionActive:
      data.sessionActive ?? Boolean(data.sessionId && orders.length > 0),
    sessionTotalItems: data.sessionTotalItems ?? derivedItems,
    sessionTotalAmount: data.sessionTotalAmount ?? derivedAmount,
  };
}

export default function useTableOrders(tableId) {
  const [ordersResponse, setOrdersResponse] = useState(null);
  const [loading, setLoading] = useState(Boolean(tableId));
  const [error, setError] = useState("");
  const [connectionState, setConnectionState] = useState("Connecting");
  const requestVersion = useRef(0);

  const refresh = useCallback(
    async ({ showLoading = false } = {}) => {
      if (!tableId) return null;

      const version = ++requestVersion.current;
      if (showLoading) setLoading(true);

      try {
        const data = normalizeOrdersResponse(
          await getOrders({ tableId, size: 100 })
        );
        if (version === requestVersion.current) {
          setOrdersResponse(data);
          setError("");
        }
        return data;
      } catch (requestError) {
        if (version === requestVersion.current) {
          setError(requestError.message);
        }
        throw requestError;
      } finally {
        if (showLoading && version === requestVersion.current) {
          setLoading(false);
        }
      }
    },
    [tableId]
  );

  useEffect(() => {
    if (!tableId) {
      setOrdersResponse(null);
      setLoading(false);
      setConnectionState("Disconnected");
      return undefined;
    }

    setConnectionState("Connecting");
    refresh({ showLoading: true }).catch(() => {});

    const unsubscribe = subscribeToTopic(
      `/topic/table/${tableId}`,
      () => refresh().catch(() => {}),
      () => setConnectionState("Reconnecting"),
      () => setConnectionState("Live")
    );

    return () => {
      requestVersion.current += 1;
      unsubscribe();
    };
  }, [refresh, tableId]);

  return {
    ordersResponse,
    loading,
    error,
    connectionState,
    refresh,
  };
}
