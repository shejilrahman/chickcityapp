"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  // Load from localStorage
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("restaurant-cart");
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
      localStorage.setItem("restaurant-cart", JSON.stringify(cart));
    }
  }, [cart, isMounted]);

  /**
   * Add a product to cart.
   * For portionSlab products: supply portion ("qtr"|"half"|"full") and
   * riceType ("withRice"|"meatOnly") and portionPrice (explicit price).
   * For flat-price products: these are left undefined.
   *
   * Each cart key = `${product.id}__${portion}__${riceType}` for
   * portionSlab items, or just `product.id` for flat items.
   */
  const addToCart = (product, portion, riceType, portionPrice) => {
    setCart((prev) => {
      const hasPortions = !!product.portionSlab;

      if (hasPortions) {
        const _portion = portion || "qtr";
        const _riceType = riceType || "withRice";
        const _price =
          portionPrice ??
          product.portionSlab?.[_riceType]?.[_portion] ??
          product.price;
        const cartKey = `${product.id}__${_portion}__${_riceType}`;

        const existing = prev.find((item) => item.cartKey === cartKey);
        if (existing) {
          return prev.map((item) =>
            item.cartKey === cartKey
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [
          ...prev,
          {
            ...product,
            cartKey,
            portion: _portion,
            riceType: _riceType,
            portionPrice: _price,
            quantity: 1,
          },
        ];
      }

      // Flat-price product
      const existing = prev.find(
        (item) => item.cartKey === product.id || item.id === product.id && !item.portion
      );
      if (existing) {
        return prev.map((item) =>
          (item.cartKey === product.id || (item.id === product.id && !item.portion))
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        { ...product, cartKey: product.id, quantity: 1 },
      ];
    });
  };

  const updateQuantity = (cartKey, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const totalPrice = cart.reduce((acc, item) => {
    const price = item.portionPrice ?? item.price ?? 0;
    return acc + price * item.quantity;
  }, 0);

  const getEffectivePrice = (item) => item.portionPrice ?? item.price ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        getEffectivePrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
