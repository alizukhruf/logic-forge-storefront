import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';
import { listWishlist } from '../db/repo';
import { ProductCard } from '../components/ProductCard';
import { Loader } from '../components/Loader';

export const Wishlist: React.FC = () => {
  const { user } = useAuth();
  const { db, ready } = useDatabase();
  if (!user) return null;
  if (!ready || !db) return <Loader />;

  const products = listWishlist(db, user.id);

  return (
    <div className="lf-page">
      <span className="lf-eyebrow">Saved for later</span>
      <div className="lf-section-heading">
        <div><h1 className="font-display text-3xl font-extrabold text-brand-950">Your wishlist</h1><p className="mt-1 text-sm text-gray-500">{products.length} saved {products.length === 1 ? 'product' : 'products'}</p></div>
        <Link to="/shop" className="lf-button-secondary">Explore shop</Link>
      </div>
      {products.length === 0 ? (
        <div className="lf-panel px-5 py-12 text-center">
          <span aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-2xl text-brand-800">♡</span>
          <h2 className="mt-4 font-display text-xl font-bold text-brand-950">Nothing saved yet</h2>
          <p className="mt-1 text-sm text-gray-500">Save products you love and find them here later.</p>
          <Link to="/shop" className="lf-button-primary mt-5">Browse products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </div>
  );
};
