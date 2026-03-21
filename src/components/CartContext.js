"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { WEIGHT_SLABS, getSlabPrice } from "@/lib/weight-slabs";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  // Load from localStorage
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("grocery-cart");
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("grocery-cart", JSON.stringify(cart));
    }
  }, [cart, isMounted]);

  /**
   * Compute the effective price for a cart item.
   * For slab products: price = (selectedGrams / baseUnit) × product.price
   * For regular products: price = product.price
   */
  const getEffectivePrice = (item) => {
    if (item.weightSlab && item.selectedGrams) {
      const slab = WEIGHT_SLABS[item.weightSlab];
      if (slab) {
        return getSlabPrice(item.price, item.selectedGrams, slab.baseUnit);
      }
    }
    return item.price;
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);

      if (product.weightSlab) {
        // Slab product — quantity is always 1, and selectedGrams tracks amount
        const slab = WEIGHT_SLABS[product.weightSlab];
        if (!slab) return prev;

        if (existing) {
          // Already in cart — bump by one step
          const newGrams = Math.min(existing.selectedGrams + slab.step, slab.max);
          return prev.map((item) =>
            item.id === product.id ? { ...item, selectedGrams: newGrams } : item
          );
        }
        // New item — start at minimum
        return [
          ...prev,
          { ...product, quantity: 1, selectedGrams: slab.min },
        ];
      }

      // Regular product — regular quantity
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;

          if (item.weightSlab) {
            const slab = WEIGHT_SLABS[item.weightSlab];
            if (!slab) return item;
            const newGrams = item.selectedGrams + delta * slab.step;
            return { ...item, selectedGrams: newGrams };
          }

          return { ...item, quantity: item.quantity + delta };
        })
        .filter((item) => {
          if (item.weightSlab) {
            const slab = WEIGHT_SLABS[item.weightSlab];
            return slab && item.selectedGrams >= slab.min;
          }
          return item.quantity > 0;
        })
    );
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((acc, item) => acc + (item.weightSlab ? 1 : item.quantity), 0);

  const totalPrice = cart.reduce((acc, item) => {
    const effectivePrice = getEffectivePrice(item);
    const qty = item.weightSlab ? 1 : item.quantity;
    return acc + effectivePrice * qty;
  }, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, updateQuantity, clearCart, totalItems, totalPrice, getEffectivePrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
