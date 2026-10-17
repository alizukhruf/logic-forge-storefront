import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { itemCount } = useCart();
  const { user, logout, isAdmin } = useAuth();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const search = query.trim();
    navigate(search ? `/shop?q=${encodeURIComponent(search)}` : '/shop');
    setMobileSearchOpen(false);
  };

  const signOut = async () => {
    try {
      await logout();
      setMenuOpen(false);
      navigate('/');
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not sign out.');
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="bg-brand-950 px-4 py-2 text-center text-[11px] font-medium tracking-wide text-white sm:text-xs">
        Welcome to Logic Forge — explore our technology collection
      </div>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6 lg:px-8">
        <Link to="/" aria-label="Logic Forge home" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-900 font-display text-lg font-extrabold text-white">L</span>
          <span className="font-display text-lg font-extrabold tracking-tight text-brand-950 sm:text-xl">
            LOGIC <span className="text-brand-600">FORGE</span>
          </span>
        </Link>

        <form onSubmit={handleSearch} role="search" className="hidden max-w-xl flex-1 md:flex">
          <label className="relative w-full">
            <span className="sr-only">Search products</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products and categories"
              className="lf-input rounded-full bg-gray-50 pl-4 pr-12"
            />
            <button
              aria-label="Search"
              className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-brand-900 text-white transition hover:bg-brand-700"
            >
              <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
              </svg>
            </button>
          </label>
        </form>

        <nav aria-label="Main navigation" className="ml-auto flex items-center gap-1 text-sm sm:gap-3">
          <Link to="/shop" className="hidden rounded-lg px-2 py-2 font-semibold text-gray-700 hover:bg-gray-50 hover:text-brand-800 sm:inline">
            Shop
          </Link>
          <Link to="/shop#categories" className="hidden rounded-lg px-2 py-2 font-semibold text-gray-700 hover:bg-gray-50 hover:text-brand-800 lg:inline">
            Categories
          </Link>
          {user && (
            <Link to="/wishlist" aria-label="Wishlist" className="hidden p-2 text-gray-700 hover:text-brand-800 sm:inline-flex">
              <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
              </svg>
            </Link>
          )}
          <button
            onClick={() => setMobileSearchOpen((open) => !open)}
            aria-label={mobileSearchOpen ? 'Close search' : 'Open search'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-700 hover:bg-gray-50 md:hidden"
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
            </svg>
          </button>
          <Link
            to="/cart"
            aria-label={`Shopping bag${itemCount ? `, ${itemCount} items` : ''}`}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-700 hover:bg-gray-50 hover:text-brand-800"
          >
            <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" />
            </svg>
            <AnimatePresence>
              {itemCount > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                  {itemCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Account menu"
              aria-expanded={menuOpen}
              className="flex h-10 items-center gap-2 rounded-full border border-gray-200 px-2.5 text-sm font-semibold text-brand-950 transition hover:bg-gray-50"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                {user ? user.name.charAt(0).toUpperCase() : (
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" />
                  </svg>
                )}
              </span>
              <span className="hidden md:inline">{user ? 'Account' : 'Sign in'}</span>
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-gray-100 bg-white py-2 shadow-xl"
                >
                  {user ? (
                    <>
                      <div className="border-b border-gray-100 px-4 py-2">
                        <p className="truncate text-xs text-gray-500">Signed in as</p>
                        <p className="truncate text-sm font-semibold text-gray-900">{user.email}</p>
                      </div>
                      <Link to="/account" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-gray-50">My account</Link>
                      {isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-gray-50">Admin dashboard</Link>}
                      <button onClick={() => { void signOut(); }} className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50">Sign out</button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-gray-50">Sign in</Link>
                      <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-gray-50">Create account</Link>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </div>
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleSearch}
            className="overflow-hidden px-4 pb-3 md:hidden"
          >
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" aria-label="Search products" className="lf-input rounded-full bg-gray-50" />
          </motion.form>
        )}
      </AnimatePresence>
      <div className="flex justify-center gap-6 border-t border-gray-100 py-2 text-xs font-semibold text-gray-600 sm:hidden">
        <Link to="/shop" className="hover:text-brand-800">Shop</Link>
        <Link to="/shop#categories" className="hover:text-brand-800">Categories</Link>
        {user && <Link to="/wishlist" className="hover:text-brand-800">Wishlist</Link>}
        <Link to={user ? '/account' : '/login'} className="hover:text-brand-800">{user ? 'Account' : 'Sign in'}</Link>
      </div>
    </header>
  );
};
