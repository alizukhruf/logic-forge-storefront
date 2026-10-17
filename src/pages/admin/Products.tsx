import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { listCategories, listProducts, upsertProduct, deleteProduct } from '../../db/repo';
import type { Product } from '../../types';
import { Loader } from '../../components/Loader';
import ProductImage from '../../components/ProductImage';
import { formatPrice } from '../../utils/currency';

const emptyForm = {
  id: undefined as string | undefined,
  name: '', description: '', price: '', compare_at_price: '', category_id: '',
  image_url: '', stock: '', sku: '', is_active: 1,
};

export const AdminProducts: React.FC = () => {
  const { db, ready, refresh } = useDatabase();
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  if (!ready || !db) return <Loader />;

  const categories = listCategories(db);
  const products = listProducts(db, { search });

  const startEdit = (p: Product) => {
    setForm({
      id: p.id, name: p.name, description: p.description, price: String(p.price),
      compare_at_price: p.compare_at_price ? String(p.compare_at_price) : '', category_id: p.category_id,
      image_url: p.image_url, stock: String(p.stock), sku: p.sku, is_active: p.is_active,
    });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await upsertProduct(db, {
        id: form.id,
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
        category_id: form.category_id || categories[0]?.id,
        image_url: form.image_url,
        stock: parseInt(form.stock || '0', 10),
        sku: form.sku,
        is_active: form.is_active,
      });
      await refresh();
      setForm(emptyForm);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the product.');
    }
  };

  const removeProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    setError('');
    try {
      await deleteProduct(db, id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the product.');
    }
  };

  return (
    <div>
      <div className="admin-page-heading">
        <div><span className="lf-eyebrow">Catalog management</span><h1 className="admin-page-title">Products</h1><p className="admin-page-description">{products.length} products in your catalog</p></div>
        <button
          onClick={() => { setForm(emptyForm); setShowForm(true); }}
          className="lf-button-primary"
        >
          <span aria-hidden="true" className="mr-2">+</span>Add product
        </button>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <input
        aria-label="Search products"
        placeholder="Search products…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="lf-input mb-4 max-w-sm"
      />

      {showForm && (
        <form onSubmit={submit} className="lf-panel mb-6 grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="font-display text-lg font-bold text-brand-950 sm:col-span-2">{form.id ? 'Edit product' : 'Add a product'}</h2>
          <input required maxLength={160} aria-label="Product name" placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="lf-input sm:col-span-2" />
          <textarea aria-label="Product description" maxLength={3000} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="lf-input sm:col-span-2" rows={3} />
          <input required type="number" min="0.01" step="0.01" aria-label="Price in PKR" placeholder="Price (PKR)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="lf-input" />
          <input type="number" min="0" step="0.01" aria-label="Compare-at price in PKR (optional)" placeholder="Compare-at price (PKR, optional)" value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} className="lf-input" />
          <select aria-label="Product category" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="lf-input">
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input required type="number" min="0" step="1" aria-label="Stock quantity" placeholder="Stock quantity" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="lf-input" />
          <input required maxLength={80} aria-label="SKU" placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="lf-input" />
          <input type="url" maxLength={2000} aria-label="Image URL (optional)" placeholder="Image URL (optional)" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="lf-input sm:col-span-2" />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })} />
            Active / visible in store
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="lf-button-primary">
              {form.id ? 'Save changes' : 'Create product'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); }} className="lf-button-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
        <table className="admin-table min-w-[680px]">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-400">
              <th scope="col">Product</th><th scope="col">Price</th><th scope="col">Stock</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="flex items-center gap-3"><ProductImage product={p} className="h-10 w-10 rounded-lg object-cover" />
                  <span>{p.name}</span>
                  </div>
                </td>
                <td>{formatPrice(p.price)}</td>
                <td className={p.stock <= 5 ? 'font-semibold text-red-700' : ''}>{p.stock}</td>
                <td>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {p.is_active ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td className="space-x-3 whitespace-nowrap text-right">
                  <button onClick={() => startEdit(p)} className="font-semibold text-brand-700 hover:text-brand-950">Edit</button>
                  <button
                    onClick={() => { void removeProduct(p.id); }}
                    className="font-semibold text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
