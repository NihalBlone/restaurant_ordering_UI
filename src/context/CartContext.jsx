import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CART_STORAGE_KEY = "tabletap-carts";

const CartContext = createContext(null);

function readStoredCarts() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function CartProvider({ children }) {
  const [cartsByTable, setCartsByTable] = useState({});
  const [activeTableId, setActiveTableId] = useState(null);

  useEffect(() => {
    setCartsByTable(readStoredCarts());
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartsByTable));
  }, [cartsByTable]);

  const activeItems = activeTableId ? cartsByTable[activeTableId] || [] : [];

  const value = useMemo(() => {
    const totalAmount = activeItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const itemCount = activeItems.reduce((sum, item) => sum + item.quantity, 0);

    function updateTableItems(updater) {
      if (!activeTableId) return;
      setCartsByTable((current) => {
        const existing = current[activeTableId] || [];
        const nextItems = updater(existing);
        return {
          ...current,
          [activeTableId]: nextItems,
        };
      });
    }

    function addItem(item) {
      updateTableItems((items) => {
        const match = items.find((entry) => entry.id === item.id);
        if (match) {
          return items.map((entry) =>
            entry.id === item.id
              ? { ...entry, quantity: entry.quantity + 1 }
              : entry
          );
        }
        return [...items, { ...item, quantity: 1 }];
      });
    }

    function decreaseItem(itemId) {
      updateTableItems((items) =>
        items
          .map((entry) =>
            entry.id === itemId
              ? { ...entry, quantity: entry.quantity - 1 }
              : entry
          )
          .filter((entry) => entry.quantity > 0)
      );
    }

    function removeItem(itemId) {
      updateTableItems((items) =>
        items.filter((entry) => entry.id !== itemId)
      );
    }

    function clearCart(tableId = activeTableId) {
      if (!tableId) return;
      setCartsByTable((current) => ({
        ...current,
        [tableId]: [],
      }));
    }

    return {
      activeTableId,
      items: activeItems,
      itemCount,
      totalAmount,
      setTableId: setActiveTableId,
      addItem,
      decreaseItem,
      removeItem,
      clearCart,
    };
  }, [activeItems, activeTableId]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
