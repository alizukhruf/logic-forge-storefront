import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { listCoupons, upsertCoupon, deleteCoupon } from '../../db/repo';
import { Loader } from '../../components/Loader';
import type { Coupon } from '../../types';
import { formatPrice } from '../../utils/currency';

type CouponForm = { id: string | undefined; code: string; type: Coupon['type']; value: string; min_subtotal: string; expires_at: string; active: number };
const emptyForm: CouponForm = { id: undefined, code: '', type: 'percent', value: '', min_subtotal: '0', expires_at: '', active: 1 };

export const AdminCoupons: React.FC = () => {
  const { db, ready, refresh } = useDatabase();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  if (!ready || !db) return <Loader />;

  const coupons = listCoupons(db);

  const startEdit = (coupon: Coupon) => {
    setForm({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      min_subtotal: String(coupon.min_subtotal),
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : '',
      active: coupon.active,
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await upsertCoupon(db, {
        id: form.id,
        code: form.code,
        type: form.type,
        value: parseFloat(form.value),
        min_subtotal: parseFloat(form.min_subtotal || '0'),
        expires_at: form.expires_at ? `${form.expires_at}T23:59:59.999Z` : null,
        active: form.active,
      });
      await refresh();
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the coupon.');
    }
  };

  const toggleActive = async (id: string, active: number) => {
    const coupon = coupons.find((item) => item.id === id);
    if (!coupon) {
      setError('That coupon could not be found. Refresh the page and try again.');
      return;
    }
    setError('');
    try {
      await upsertCoupon(db, { ...coupon, active: active ? 0 : 1 });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the coupon.');
    }
  };

  const removeCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    setError('');
    try {
      await deleteCoupon(db, id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the coupon.');
    }
  };

  return (
    <div>
      <div className="admin-page-heading">
        <div><span className="lf-eyebrow">Promotions</span><h1 className="admin-page-title">Coupons</h1><p className="admin-page-description">Create and manage discounts for your customers.</p></div>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form onSubmit={submit} className="lf-panel mb-6 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <h2 className="font-display font-bold text-brand-950 sm:col-span-2 lg:col-span-3">{form.id ? `Edit ${form.code}` : 'Create a coupon'}</h2>
        <input required maxLength={40} aria-label="Coupon code" placeholder="Coupon code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="lf-input font-mono uppercase" />
        <select aria-label="Discount type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Coupon['type'] })} className="lf-input">
          <option value="percent">Percent off</option>
          <option value="fixed">Fixed amount off</option>
        </select>
        <input required type="number" min="0.01" max={form.type === 'percent' ? 100 : undefined} step="0.01" aria-label={form.type === 'percent' ? 'Percent discount' : 'Discount amount in PKR'} placeholder={form.type === 'percent' ? 'Percent off' : 'Amount off (PKR)'} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="lf-input" />
        <input type="number" min="0" step="0.01" aria-label="Minimum subtotal in PKR" placeholder="Minimum subtotal (PKR)" value={form.min_subtotal} onChange={(e) => setForm({ ...form, min_subtotal: e.target.value })} className="lf-input" />
        <input type="date" aria-label="Expiration date (optional)" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="lf-input" />
        <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={!!form.active} onChange={(e) => setForm({ ...form, active: e.target.checked ? 1 : 0 })} />Active coupon</label>
        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
        <button type="submit" className="lf-button-primary">
          {form.id ? 'Save coupon' : 'Create coupon'}
        </button>
        {form.id && <button type="button" onClick={() => setForm(emptyForm)} className="lf-button-secondary">Cancel editing</button>}
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
        <table className="admin-table min-w-[680px]">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-400">
              <th scope="col">Code</th><th scope="col">Discount</th><th scope="col">Min subtotal</th><th scope="col">Expires</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id}>
                <td className="font-mono font-semibold text-brand-900">{c.code}</td>
                <td>{c.type === 'percent' ? `${c.value}%` : formatPrice(c.value)}</td>
                <td>{formatPrice(c.min_subtotal)}</td>
                <td className="text-gray-500">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'No expiry'}</td>
                <td>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="space-x-3 whitespace-nowrap text-right">
                  <button onClick={() => startEdit(c)} className="font-semibold text-brand-700 hover:text-brand-950">Edit</button>
                  <button onClick={() => { void toggleActive(c.id, c.active); }} className="font-semibold text-brand-700 hover:text-brand-950">
                    {c.active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => { void removeCoupon(c.id); }} className="font-semibold text-red-600 hover:text-red-800">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
