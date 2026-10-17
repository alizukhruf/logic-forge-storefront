import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useDatabase } from '../context/DatabaseContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getProductBySlug, listProducts, listReviews, addReview, isWishlisted, toggleWishlist } from '../db/repo';
import { StarRating } from '../components/StarRating';
import { Loader } from '../components/Loader';
import ProductImage from '../components/ProductImage';
import { ProductCard } from '../components/ProductCard';
import { formatPrice } from '../utils/currency';

export const ProductDetail: React.FC = () => {
  const { slug } = useParams();
  const { db, ready, refresh } = useDatabase();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [added, setAdded] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  if (!ready || !db) return <Loader />;

  const product = getProductBySlug(db, slug || '');
  if (!product) {
    return (
      <div className="lf-page">
        <div className="lf-panel mx-auto max-w-xl px-6 py-14 text-center">
          <h1 className="font-display text-2xl font-bold text-brand-950">Product not found</h1>
          <p className="mt-2 text-sm text-gray-500">This product may have been removed from the collection.</p>
          <Link to="/shop" className="lf-button-primary mt-5">Back to shop</Link>
        </div>
      </div>
    );
  }

  const reviews = listReviews(db, product.id);
  const wished = user ? isWishlisted(db, user.id, product.id) : false;
  const relatedProducts = listProducts(db, { categoryId: product.category_id, activeOnly: true })
    .filter((item) => item.id !== product.id)
    .slice(0, 4);
  const discountPercent = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0;

  const add = (goToCheckout = false) => {
    addToCart(product, qty);
    if (goToCheckout) {
      navigate('/checkout');
      return;
    }
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setActionError('');
    setActionSuccess('');
    try {
      await addReview(db, product.id, user.id, user.name, reviewRating, reviewComment.trim());
      setReviewComment('');
      setReviewRating(5);
      await refresh();
      setActionSuccess('Your review has been added.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not submit your review.');
    }
  };

  const saveToWishlist = async () => {
    if (!user) return;
    setActionError('');
    setActionSuccess('');
    try {
      await toggleWishlist(db, user.id, product.id);
      await refresh();
      setActionSuccess(wished ? 'Removed from your wishlist.' : 'Saved to your wishlist.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update your wishlist.');
    }
  };

  return (
    <>
      <div className="lf-page">
        <nav aria-label="Breadcrumb" className="mb-5 text-xs font-medium text-gray-500">
          <Link to="/" className="hover:text-brand-700">Home</Link><span className="mx-2">/</span><Link to="/shop" className="hover:text-brand-700">Shop</Link><span className="mx-2">/</span><span className="text-gray-800">{product.name}</span>
        </nav>
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative overflow-hidden rounded-3xl bg-white">
            <ProductImage product={product} className="aspect-square w-full object-cover" />
            {discountPercent > 0 && <span className="absolute left-4 top-4 rounded-full bg-brand-900 px-3 py-1.5 text-xs font-bold text-white">Save {discountPercent}%</span>}
          </motion.div>
          <div className="flex flex-col justify-center">
            <span className="lf-eyebrow">Logic Forge collection</span>
            <h1 className="font-display text-3xl font-extrabold leading-tight text-brand-950 sm:text-4xl">{product.name}</h1>
            <div className="mt-3">
              {product.review_count > 0 ? <StarRating rating={product.rating} count={product.review_count} /> : <span className="text-sm text-gray-500">No reviews yet</span>}
            </div>
            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="font-display text-3xl font-extrabold text-brand-950">{formatPrice(product.price)}</span>
              {product.compare_at_price && <span className="text-lg text-gray-400 line-through">{formatPrice(product.compare_at_price)}</span>}
              {discountPercent > 0 && <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{discountPercent}% savings</span>}
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
              <label className="sr-only" htmlFor="product-quantity">Quantity</label>
              <input id="product-quantity" type="number" min={1} max={Math.max(1, product.stock)} value={qty}
                onChange={(event) => setQty(Math.max(1, Math.min(product.stock || 1, Number(event.target.value))))}
                className="lf-input w-24 text-center" />
              <button onClick={() => add()} disabled={product.stock <= 0} className="lf-button-primary flex-1">
                {added ? 'Added to bag ✓' : 'Add to bag'}
              </button>
              <button onClick={() => add(true)} disabled={product.stock <= 0} className="lf-button-secondary flex-1">
                Buy now
              </button>
              {user && (
                <button onClick={() => { void saveToWishlist(); }} aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'} className="lf-button-secondary min-w-12 px-3 text-xl text-brand-800">
                  {wished ? '♥' : '♡'}
                </button>
              )}
            </div>
            {actionError && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
            {actionSuccess && <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{actionSuccess}</p>}
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-gray-500">
              <p className="rounded-xl bg-white p-3">Current stock information is shown above.</p>
              <p className="rounded-xl bg-white p-3">Sign in to keep this product in your wishlist.</p>
            </div>
          </div>
        </div>

        <section className="mt-14 border-t border-gray-200 pt-9">
          <div className="mb-5">
            <span className="lf-eyebrow">Your experience matters</span>
            <h2 className="font-display text-2xl font-extrabold text-brand-950">Customer reviews</h2>
          </div>
          {user ? (
            <form onSubmit={submitReview} className="lf-panel mb-7 max-w-2xl p-5 sm:p-6">
              <p className="mb-3 text-sm font-semibold text-gray-800">Share your experience</p>
              <div className="mb-4 flex gap-1" role="group" aria-label="Choose a rating">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button type="button" key={rating} onClick={() => setReviewRating(rating)} aria-label={`${rating} star${rating === 1 ? '' : 's'}`} aria-pressed={rating === reviewRating} className="rounded p-1 text-2xl focus-visible:outline">
                    <span className={rating <= reviewRating ? 'text-amber-400' : 'text-gray-300'}>★</span>
                  </button>
                ))}
              </div>
              <label htmlFor="review-comment" className="sr-only">Review comments</label>
              <textarea id="review-comment" value={reviewComment} onChange={(event) => setReviewComment(event.target.value)}
                placeholder="What did you think?" className="lf-input min-h-24 resize-y" rows={3} maxLength={1000} />
              <button type="submit" className="lf-button-primary mt-3">Submit review</button>
            </form>
          ) : (
            <p className="mb-6 text-sm text-gray-500"><Link to="/login" className="font-semibold text-brand-700 hover:text-brand-900">Sign in</Link> to leave a review.</p>
          )}
          {reviews.length === 0 ? (
            <p className="lf-panel p-5 text-sm text-gray-500">No reviews yet. Be the first to share your thoughts.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">{reviews.map((review) => (
              <article key={review.id} className="lf-panel p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className="font-semibold text-gray-900">{review.customer_name}</p><time className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</time></div>
                  <StarRating rating={review.rating} size={14} />
                </div>
                {review.comment && <p className="mt-3 text-sm leading-6 text-gray-600">{review.comment}</p>}
              </article>
            ))}</div>
          )}
        </section>
      </div>
      {relatedProducts.length > 0 && (
        <section className="border-t border-gray-100 bg-white">
          <div className="lf-page">
            <div className="lf-section-heading">
              <div><span className="lf-eyebrow">Keep exploring</span><h2 className="font-display text-2xl font-extrabold text-brand-950">More from this category</h2></div>
              <Link to={`/shop?category=${product.category_id}`} className="text-sm font-semibold text-brand-700 hover:text-brand-900">View category →</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{relatedProducts.map((related) => <ProductCard key={related.id} product={related} />)}</div>
          </div>
        </section>
      )}
    </>
  );
};
