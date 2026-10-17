import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { listCategories, listProducts } from '../db/repo';
import { ProductCard } from '../components/ProductCard';
import { Loader } from '../components/Loader';

export const ProductList: React.FC = () => {
  const { db, ready } = useDatabase();
  const [params, setParams] = useSearchParams();

  if (!ready || !db) return <Loader />;

  const categories = listCategories(db);
  const q = params.get('q') || '';
  const categoryId = params.get('category') || '';
  const sortValues = ['newest', 'price_asc', 'price_desc', 'rating'] as const;
  const requestedSort = params.get('sort');
  const sort = sortValues.find((value) => value === requestedSort) || 'newest';
  const minPrice = params.get('min') || '';
  const maxPrice = params.get('max') || '';
  const products = listProducts(db, {
    search: q,
    categoryId: categoryId || undefined,
    sort,
    activeOnly: true,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
  });

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  return (
    <div className="lf-page">
      <div className="mb-7">
        <span className="lf-eyebrow">Logic Forge collection</span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-950 sm:text-4xl">
          {q ? `Results for “${q}”` : 'Shop all products'}
        </h1>
        <p className="mt-2 text-sm text-gray-500">Explore the collection and find the right everyday technology.</p>
      </div>
      <div id="categories" className="mb-5 scroll-mt-36 rounded-2xl border border-gray-100 bg-white p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_0.7fr_0.7fr_auto]">
          <select
            value={categoryId}
            onChange={(e) => update('category', e.target.value)}
            aria-label="Filter by category"
            className="lf-input"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => update('sort', e.target.value)}
            aria-label="Sort products"
            className="lf-input"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
          <input aria-label="Minimum price in PKR" type="number" min="0" value={minPrice} onChange={(e) => update('min', e.target.value)} placeholder="Min price (PKR)" className="lf-input" />
          <input aria-label="Maximum price in PKR" type="number" min="0" value={maxPrice} onChange={(e) => update('max', e.target.value)} placeholder="Max price (PKR)" className="lf-input" />
          <div className="hidden lg:block" />
          {(q || categoryId || minPrice || maxPrice || requestedSort) && (
            <button onClick={() => setParams({ q })} className="lf-button-secondary whitespace-nowrap">Clear filters</button>
          )}
        </div>
      </div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500">{products.length} {products.length === 1 ? 'product' : 'products'}{categoryId ? ` · ${categories.find((category) => category.id === categoryId)?.name || 'Category'}` : ''}</p>
        {q && <p className="truncate text-xs text-gray-400">Search: “{q}”</p>}
      </div>

      {products.length === 0 ? (
        <div className="lf-panel px-5 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-xl text-brand-700">⌕</span>
          <h2 className="mt-4 font-display text-lg font-bold text-brand-950">No products found</h2>
          <p className="mt-2 text-sm text-gray-500">Try another search or clear some filters to browse the collection.</p>
          <button onClick={() => setParams({})} className="lf-button-secondary mt-5">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};
