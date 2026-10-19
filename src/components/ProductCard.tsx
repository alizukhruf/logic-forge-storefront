import React from 'react';
import { motion } from 'motion/react';
import type { Product } from '../types';
import { StarRating } from './StarRating';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';
import { isWishlisted, toggleWishlist } from '../db/repo';
import { useState } from 'react';
import ProductImage from './ProductImage';
import { formatPrice } from '../utils/currency';

interface ProductCardProps {
  product: Product;
  onProductClick?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onProductClick }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { db, refresh } = useDatabase();
  const [wishlistError, setWishlistError] = useState('');
  const [added, setAdded] = useState(false);
  const wished = db && user ? isWishlisted(db, user.id, product.id) : false;

  const handleCardClick = (e: React.MouseEvent) => {
    if (onProductClick) {
      e.stopPropagation();
      onProductClick(product);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!db || !user) return;
    setWishlistError('');
    try {
      await toggleWishlist(db, user.id, product.id);
      await refresh();
    } catch (err) {
      setWishlistError(err instanceof Error ? err.message : 'Could not update wishlist.');
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={handleCardClick}
      style={{ cursor: onProductClick ? 'pointer' : 'default' }}
      className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:border-gray-200 hover:shadow-lg"
    >
      <div
        onClick={handleCardClick}
        className="relative aspect-[4/3] overflow-hidden bg-gray-50 sm:aspect-square"
      >
        <ProductImage product={product} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
      </div>

      {user && (
        <button
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white/95 shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={wished ? '#ef4444' : 'none'} stroke={wished ? '#ef4444' : '#6b7280'} strokeWidth="2">
            <path d="M12 21s-7.5-4.6-10-9.1C.4 8.4 2 4.5 5.8 4a5 5 0 0 1 6.2 3 5 5 0 0 1 6.2-3c3.8.5 5.4 4.4 3.8 7.9C19.5 16.4 12 21 12 21z" />
          </svg>
        </button>
      )}
      {wishlistError && <p role="alert" className="absolute left-3 top-14 rounded bg-white px-2 py-1 text-xs text-red-600 shadow">{wishlistError}</p>}

      {product.compare_at_price && (
        <span className="absolute left-3 top-3 rounded-full bg-brand-900 px-2.5 py-1 text-[11px] font-bold text-white">
          Save {Math.round((1 - product.price / product.compare_at_price) * 100)}%
        </span>
      )}

      <div className="p-3.5 sm:p-4">
        <h3 onClick={handleCardClick} className="line-clamp-2 min-h-10 font-semibold leading-5 text-gray-900 hover:text-brand-700 transition-colors duration-200">
          {product.name}
        </h3>
        <div className="mt-1">
          {product.review_count > 0 ? <StarRating rating={product.rating} count={product.review_count} /> : <span className="text-xs text-gray-400">No reviews yet</span>}
        </div>
        <div className="mt-2 flex min-h-7 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-base font-bold text-gray-950 sm:text-lg">{formatPrice(product.price)}</span>
          {product.compare_at_price && (
            <span className="text-xs text-gray-400 line-through sm:text-sm">{formatPrice(product.compare_at_price)}</span>
          )}
        </div>
        <p className={`mt-1 text-xs font-medium ${product.stock > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
          {product.stock > 0 ? 'In stock' : 'Out of stock'}
        </p>
        <button
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
          className="lf-button-primary mt-3 w-full py-2.5"
        >
          {product.stock <= 0 ? 'Unavailable' : added ? 'Added to bag ✓' : 'Add to bag'}
        </button>
      </div>
    </motion.div>
  );
};
