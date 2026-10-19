import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { listOrders, getOrderItems, updateOrderStatus } from '../../db/repo';
import type { Order } from '../../types';
import { Loader } from '../../components/Loader';
import { formatPrice } from '../../utils/currency';

const statuses: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export const AdminOrders: React.FC = () => {
  const { db, ready, refresh } = useDatabase();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState('');
  if (!ready || !db) return <Loader />;

  const orders = listOrders(db);

  const changeStatus = async (id: string, status: Order['status']) => {
    setError('');
    try {
      await updateOrderStatus(db, id, status);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update order status.');
    }
  };

  return (
    <div>
      <div className="admin-page-heading">
        <div><span className="lf-eyebrow">Fulfillment</span><h1 className="admin-page-title">Orders</h1><p className="admin-page-description">{orders.length} orders across all statuses.</p></div>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="space-y-3">
        {orders.length === 0 && <div className="lf-panel px-5 py-10 text-center text-sm text-gray-500">No orders have been placed yet.</div>}
        {orders.map((o) => {
          const items = expanded === o.id ? getOrderItems(db, o.id) : [];
          return (
            <article key={o.id} className="lf-panel p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-[45%]">
                  <p className="font-semibold text-brand-950">Order #{o.id.slice(0, 8)}</p>
                  <p className="mt-1 text-sm text-gray-700">{o.customer_name}</p>
                  <p className="text-xs text-gray-500">{o.customer_email} · {new Date(o.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    aria-label={`Status for order ${o.id.slice(0, 8)}`}
                    value={o.status}
                    onChange={(e) => { void changeStatus(o.id, e.target.value as Order['status']); }}
                    className="lf-input w-auto min-w-32 capitalize"
                  >
                    {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span className="font-display font-bold text-brand-950">{formatPrice(o.total)}</span>
                  <button
                    onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                    aria-expanded={expanded === o.id}
                    className="lf-button-secondary min-h-9 px-3 py-1"
                  >
                    {expanded === o.id ? 'Hide' : 'View items'}
                  </button>
                </div>
              </div>
              {expanded === o.id && (
                <div className="mt-4 grid gap-4 border-t border-gray-100 pt-4 text-sm text-gray-600 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-2 font-semibold text-gray-800">Items</h3>
                  {items.map((i) => (
                    <div key={i.id} className="flex justify-between py-0.5">
                      <span>{i.product_name} × {i.quantity}</span>
                      <span>{formatPrice(i.unit_price * i.quantity)}</span>
                    </div>
                  ))}
                  <p className="mt-2 text-xs text-gray-400">
                    Subtotal {formatPrice(o.subtotal)} · Discount -{formatPrice(o.discount)} · Tax {formatPrice(o.tax)}
                  </p>
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold text-gray-800">Shipping address</h3>
                    <address className="text-sm not-italic leading-6">
                      {[o.shipping_address.first_name, o.shipping_address.last_name].filter(Boolean).join(' ') || o.customer_name}<br />
                      {o.shipping_address.phone && <>{o.shipping_address.phone}<br /></>}
                      {o.shipping_address.line1}<br />
                      {o.shipping_address.line2 && <>{o.shipping_address.line2}<br /></>}
                      {o.shipping_address.city}, {o.shipping_address.state} {o.shipping_address.zip}<br />
                      {o.shipping_address.country}
                    </address>
                    {o.coupon_code && <p className="mt-2 text-xs text-emerald-700">Coupon: {o.coupon_code}</p>}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};
