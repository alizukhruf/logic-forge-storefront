import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import ProductImage from '../components/ProductImage';
import { formatPrice } from '../utils/currency';

export const Cart: React.FC = () => {
  const { lines, setQuantity, removeFromCart, subtotal } = useCart();
  const navigate = useNavigate();

  if (lines.length === 0) {
    return (
      <div className="lf-page">
        <div className="lf-panel mx-auto max-w-xl px-6 py-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-800">
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
          </span>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-brand-950">Your bag is waiting</h1>
          <p className="mt-2 text-sm text-gray-500">You haven’t added anything to your bag yet.</p>
          <Link to="/shop" className="lf-button-primary mt-5">Explore the collection</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="lf-page max-w-6xl">
      <span className="lf-eyebrow">Logic Forge</span>
      <h1 className="mb-6 font-display text-3xl font-extrabold text-brand-950">Your shopping bag</h1>
      <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <AnimatePresence>
          {lines.map((line) => (
            <motion.div
              key={line.product.id}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap sm:gap-4 sm:p-5"
            >
              <ProductImage product={line.product} className="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24" />
              <div className="min-w-0 flex-1">
                <Link to={`/product/${line.product.slug}`} className="font-semibold text-gray-900 hover:text-brand-700">
                  {line.product.name}
                </Link>
                <p className="mt-1 text-sm font-semibold text-brand-900">{formatPrice(line.product.price)} each</p>
                {line.product.stock <= 0 && <p className="mt-1 text-xs font-semibold text-red-600">Currently out of stock</p>}
              </div>
              <label className="sr-only" htmlFor={`quantity-${line.product.id}`}>Quantity for {line.product.name}</label>
              <input
                id={`quantity-${line.product.id}`}
                type="number"
                min={1}
                max={line.product.stock}
                value={line.quantity}
                disabled={line.product.stock <= 0}
                onChange={(event) => {
                  const quantity = event.currentTarget.valueAsNumber;
                  if (Number.isSafeInteger(quantity) && quantity > 0) {
                    setQuantity(line.product.id, Math.min(line.product.stock, quantity));
                  }
                }}
                className="lf-input w-[4.5rem] px-2 text-center"
              />
              <p className="w-24 text-right font-bold text-gray-900">{formatPrice(line.product.price * line.quantity)}</p>
              <button aria-label={`Remove ${line.product.name} from bag`} onClick={() => removeFromCart(line.product.id)} className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600">
                <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="lf-panel w-full max-w-sm p-5">
          <h2 className="mb-4 font-display text-lg font-bold text-brand-950">Order summary</h2>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Tax and discounts calculated at checkout.</p>
          <button
            onClick={() => navigate('/checkout')}
            disabled={lines.some((line) => line.product.stock < line.quantity)}
            className="lf-button-primary mt-4 w-full"
          >
            Continue to checkout
          </button>
        </div>
      </div>
    </div>
  );
};
