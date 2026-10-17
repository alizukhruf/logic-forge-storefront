import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { listProducts, adjustStock } from '../../db/repo';
import { Loader } from '../../components/Loader';

export const AdminInventory: React.FC = () => {
  const { db, ready, refresh } = useDatabase();
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  if (!ready || !db) return <Loader />;

  const products = listProducts(db, { search, sort: 'newest' });

  const adjust = async (id: string, delta: number) => {
    setError('');
    try {
      await adjustStock(db, id, delta);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not adjust inventory.');
    }
  };

  return (
    <div>
      <div className="admin-page-heading">
        <div><span className="lf-eyebrow">Stock control</span><h1 className="admin-page-title">Inventory</h1><p className="admin-page-description">Keep stock levels accurate and ready for orders.</p></div>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <input
        aria-label="Search inventory"
        placeholder="Search products…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="lf-input mb-4 max-w-sm"
      />
      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
        <table className="admin-table min-w-[620px]">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-400">
              <th scope="col">Product</th><th scope="col">SKU</th><th scope="col">Stock</th><th scope="col">Adjust stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td className="font-semibold text-gray-900">{p.name}</td>
                <td className="font-mono text-xs text-gray-500">{p.sku}</td>
                <td className={`font-bold ${p.stock <= 10 ? 'text-amber-700' : 'text-emerald-700'}`}>{p.stock}<span className="ml-1 text-xs font-normal text-gray-400">units</span></td>
                <td className="space-x-2 whitespace-nowrap">
                  <button aria-label={`Remove one ${p.name} from stock`} disabled={p.stock <= 0} onClick={() => { void adjust(p.id, -1); }} className="lf-button-secondary min-h-9 px-3 py-1">−1</button>
                  <button aria-label={`Add one ${p.name} to stock`} onClick={() => { void adjust(p.id, 1); }} className="lf-button-secondary min-h-9 px-3 py-1">+1</button>
                  <button aria-label={`Add ten ${p.name} to stock`} onClick={() => { void adjust(p.id, 10); }} className="lf-button-secondary min-h-9 px-3 py-1">+10</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
