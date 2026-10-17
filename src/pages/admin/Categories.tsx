import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { listCategories, upsertCategory, deleteCategory } from '../../db/repo';
import { Loader } from '../../components/Loader';

export const AdminCategories: React.FC = () => {
  const { db, ready, refresh } = useDatabase();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!ready || !db) return <Loader />;
  const categories = listCategories(db);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await upsertCategory(db, { id: editId || undefined, name, description });
      await refresh();
      setName('');
      setDescription('');
      setEditId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the category.');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this category? Products cannot be assigned to a deleted category.')) return;
    setError(null);
    try {
      await deleteCategory(db, id);
      await refresh();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the category.');
    }
  };

  return (
    <div>
      <div className="admin-page-heading">
        <div><span className="lf-eyebrow">Catalog structure</span><h1 className="admin-page-title">Categories</h1><p className="admin-page-description">Organize products into browseable collections.</p></div>
      </div>

      <form onSubmit={submit} className="lf-panel mb-6 grid gap-3 p-5 sm:grid-cols-[1fr_1.5fr_auto]">
        <input required maxLength={120} aria-label="Category name" placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} className="lf-input" />
        <input maxLength={500} aria-label="Category description" placeholder="Short description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="lf-input" />
        <button type="submit" className="lf-button-primary">
          {editId ? 'Save' : 'Add category'}
        </button>
        {editId && (
          <button type="button" onClick={() => { setEditId(null); setName(''); setDescription(''); }} className="lf-button-secondary">
            Cancel
          </button>
        )}
      </form>

      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {categories.length === 0 && <p className="lf-panel p-5 text-sm text-gray-500">No categories yet. Create one to organize your catalog.</p>}
        {categories.map((c) => (
          <div key={c.id} className="lf-panel flex items-start justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="font-semibold text-brand-950">{c.name}</p>
              <p className="mt-1 text-sm text-gray-500">{c.description || 'No description added.'}</p>
            </div>
            <div className="flex shrink-0 gap-3 text-sm">
              <button onClick={() => { setEditId(c.id); setName(c.name); setDescription(c.description); }} className="font-semibold text-brand-700 hover:text-brand-950">Edit</button>
              <button onClick={() => { void remove(c.id); }} className="font-semibold text-red-600 hover:text-red-800">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
