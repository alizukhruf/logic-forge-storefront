import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Product } from '../types';
import { useDatabase } from '../context/DatabaseContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getProductById, isWishlisted, toggleWishlist } from '../db/repo';
import { StarRating } from './StarRating';
import ProductImage from './ProductImage';
import { Loader } from './Loader';
import { formatPrice } from '../utils/currency';

interface ProductDetailsModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { db, ready, refresh } = useDatabase();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [wishlistError, setWishlistError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [wished, setWished] = useState(false);

  useEffect(() => {
    if (db && user) {
      setWished(isWishlisted(db, user.id, product.id));
    }
  }, [db, user, product.id]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleClose();
  };

  const handleAddToCart = () => {
    addToCart(product, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!db || !user) return;
    setWishlistError('');
    try {
      const result = await toggleWishlist(db, user.id, product.id);
      await refresh();
      setWished(result);
      setActionSuccess(result ? 'Saved to your wishlist.' : 'Removed from your wishlist.');
    } catch (err) {
      setWishlistError(err instanceof Error ? err.message : 'Could not update wishlist.');
    }
  };

  const discountPercent = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0;

  if (!ready || !db) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onKeyDown={handleKeyDown}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm sm:bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-label="Product details"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl mx-4 sm:mx-6 sm:max-w-3xl bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden"
          >
            <div className="absolute right-3 top-3 z-20">
              <button
                onClick={handleClose}
                aria-label="Close product details"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-900 text-white hover:bg-brand-800 transition-colors duration-200"
              >
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12 p-6 sm:p-8">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative overflow-hidden rounded-3xl bg-white">
                <ProductImage product={product} className="aspect-square w-full object-cover" />
                {discountPercent > 0 && (
                  <span className="absolute left-4 top-4 rounded-full bg-brand-900 px-3 py-1.5 text-xs font-bold text-white">
                    Save {discountPercent}%
                  </span>
                )}
              </motion.div>

              <div className="flex flex-col justify-center">
                <span className="lf-eyebrow">Logic Forge collection</span>
                <h1 className="font-display text-3xl font-extrabold leading-tight text-brand-950 sm:text-4xl">{product.name}</h1>
                <div className="mt-3">
                  {product.review_count > 0 ? (
                    <StarRating rating={product.rating} count={product.review_count} />
                  ) : (
                    <span className="text-sm text-gray-500">No reviews yet</span>
                  )}
                </div>
                <div className="mt-5 flex flex-wrap items-baseline gap-3">
                  <span className="font-display text-3xl font-extrabold text-brand-950">{formatPrice(product.price)}</span>
                  {product.compare_at_price && (
                    <span className="text-lg text-gray-400 line-through">{formatPrice(product.compare_at_price)}</span>
                  )}
                  {discountPercent > 0 && (
                    <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                      {discountPercent}% savings
                    </span>
                  )}
                </div>
                <p className="mt-5 leading-7 text-gray-600">{product.description}</p>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-y border-gray-200 py-4 text-sm">
                  <span className={`inline-flex items-center gap-2 font-semibold ${product.stock > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    <span className={`h-2 w-2 rounded-full ${product.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                  </span>
                  <span className="text-gray-500">SKU: {product.sku}</span>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <label className="sr-only" htmlFor="modal-product-quantity">Quantity</label>
                  <input
                    id="modal-product-quantity"
                    type="number"
                    min={1}
                    max={Math.max(1, product.stock)}
                    value={qty}
                    onChange={(event) =>
                      setQty(Math.max(1, Math.min(product.stock || 1, Number(event.target.value))))
                    }
                    className="lf-input w-24 text-center"
                  />
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    className="lf-button-primary flex-1"
                  >
                    {added ? 'Added to bag ✓' : 'Add to bag'}
                  </button>
                  {user && (
                    <button
                      onClick={handleWishlist}
                      aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'}
                      className="lf-button-secondary min-w-12 px-3 text-xl text-brand-800"
                    >
                      {wished ? '♥' : '♡'}
                    </button>
                  )}
                </div>
                {actionError && (
                  <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {actionError}
                  </p>
                )}
                {actionSuccess && (
                  <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                    {actionSuccess}
                  </p>
                )}
                <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-gray-500">
                  <p className="rounded-xl bg-white p-3">Current stock information is shown above.</p>
                  <p className="rounded-xl bg-white p-3">Sign in to keep this product in your wishlist.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
