import React from 'react';
import { motion } from 'motion/react';
import { useDatabase } from '../../context/DatabaseContext';
import { getDashboardStats } from '../../db/repo';
import { Loader } from '../../components/Loader';
import { formatPrice } from '../../utils/currency';

export const Dashboard: React.FC = () => {
  const { db, ready } = useDatabase();
  if (!ready || !db) return <Loader />;

  const stats = getDashboardStats(db);
  const cards = [
    { label: 'Total revenue', value: formatPrice(stats.totalRevenue) },
    { label: 'Orders', value: stats.totalOrders },
    { label: 'Customers', value: stats.totalCustomers },
    { label: 'Products', value: stats.totalProducts },
  ];

  return (
    <div>
      <div className="admin-page-heading">
        <div><span className="lf-eyebrow">Store overview</span><h1 className="admin-page-title">Dashboard</h1><p className="admin-page-description">A quick look at your store’s performance.</p></div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-4 shadow-sm sm:p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{c.label}</p>
            <p className="mt-2 break-words font-display text-xl font-extrabold text-brand-950 sm:text-2xl">{c.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="lf-panel p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-display font-bold text-brand-950">Low stock</h2><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">{stats.lowStock.length} items</span></div>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-gray-500">All products are well stocked.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {stats.lowStock.map((p) => (
                <li key={p.id} className="flex justify-between gap-3 border-t border-gray-50 py-2 first:border-0">
                  <span className="text-gray-700">{p.name}</span>
                  <span className="font-medium text-red-500">{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lf-panel p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-display font-bold text-brand-950">Top sellers</h2><span aria-hidden="true" className="text-amber-500">★</span></div>
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-gray-500">No sales yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {stats.topProducts.map((p) => (
                <li key={p.name} className="flex justify-between gap-3 border-t border-gray-50 py-2 first:border-0">
                  <span className="text-gray-700">{p.name}</span>
                  <span className="font-medium text-gray-900">{p.sold} sold</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="lf-panel mt-8 overflow-hidden">
        <div className="p-5 pb-3"><h2 className="font-display font-bold text-brand-950">Recent orders</h2><p className="mt-1 text-sm text-gray-500">Latest orders placed in your store.</p></div>
        {stats.recentOrders.length === 0 ? (
          <p className="text-sm text-gray-500">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto"><table className="admin-table min-w-[600px]">
            <thead>
              <tr className="text-left text-gray-400">
                <th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Status</th><th scope="col" className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((o) => (
                <tr key={o.id}>
                  <td className="font-mono text-xs">#{o.id.slice(0, 8)}</td>
                  <td>{o.customer_name}</td>
                  <td><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-800">{o.status}</span></td>
                  <td className="text-right font-semibold">{formatPrice(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
};
