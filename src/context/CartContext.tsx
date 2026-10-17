import React, { createContext, useContext, useEffect, useState } from 'react';
import type { CartLine, Product } from '../types';

interface CartContextValue {
  lines: CartLine[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue>({
  lines: [],
  addToCart: () => {},
  removeFromCart: () => {},
  setQuantity: () => {},
  clearCart: () => {},
  subtotal: 0,
  itemCount: 0,
});

const STORAGE_KEY = 'shopfront-cart-v1';

const isCartLine = (value: unknown): value is CartLine => {
  if (typeof value !== 'object' || value === null || !('product' in value) || !('quantity' in value)) return false;
  const product = value.product;
  return typeof value.quantity === 'number' && Number.isSafeInteger(value.quantity) && value.quantity > 0
    && typeof product === 'object' && product !== null
    && 'id' in product && typeof product.id === 'string'
    && 'name' in product && typeof product.name === 'string'
    && 'price' in product && typeof product.price === 'number' && Number.isFinite(product.price)
    && 'stock' in product && typeof product.stock === 'number' && Number.isSafeInteger(product.stock) && product.stock >= 0;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lines, setLines] = useState<CartLine[]>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const saved: unknown = JSON.parse(raw);
      if (!Array.isArray(saved)) throw new Error('Saved cart must be a list.');
      return saved.filter(isCartLine);
    } catch (error) {
      console.error('Failed to load the saved cart.', error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0 || !Number.isFinite(quantity) || quantity < 1) return;
    const amount = Math.min(product.stock, Math.floor(quantity));
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id
            ? { product, quantity: Math.min(product.stock, l.quantity + amount) }
            : l
        );
      }
      return [...prev, { product, quantity: amount }];
    });
  };

  const removeFromCart = (productId: string) =>
    setLines((prev) => prev.filter((l) => l.product.id !== productId));

  const setQuantity = (productId: string, quantity: number) => {
    if (!Number.isFinite(quantity)) return;
    const amount = Math.floor(quantity);
    setLines((prev) =>
      amount <= 0
        ? prev.filter((l) => l.product.id !== productId)
        : prev.map((l) => (l.product.id === productId
          ? { ...l, quantity: Math.min(l.product.stock, amount) }
          : l))
    );
  };

  const clearCart = () => setLines([]);

  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <CartContext.Provider
      value={{ lines, addToCart, removeFromCart, setQuantity, clearCart, subtotal, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
