import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useDatabase } from '../../context/DatabaseContext';
import { getDashboardStats } from '../../db/repo';
import { Loader } from '../../components/Loader';
import { formatPrice } from '../../utils/currency';

const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

export const Dashboard: React.FC = () => {
  const { db, ready } = useDatabase();
  if (!ready || !db) return <Loader />;

  const stats = getDashboardStats(db);
  const cards = [
    { label: 'Total revenue', value: formatPrice(stats.totalRevenue), icon: '₨', detail: 'Across all non-cancelled orders' },
    { label: 'Total orders', value: stats.totalOrders, icon: '▤', detail: 'Orders placed in your store' },
    { label: 'Customers', value: stats.totalCustomers, icon: '♙', detail: 'Registered customer accounts' },
    { label: 'Products', value: stats.totalProducts, icon: '◇', detail: 'Products in your catalog' },
  ];
  const statusCounts = orderStatuses.map((status) => ({
    status,
    count: db.orders.filter((order) => order.status === status).length,
  }));
  const maxStatusCount = Math.max(1, ...statusCounts.map(({ count }) => count));

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <span className="lf-eyebrow">Store overview</span>
          <h2 className="admin-page-title">Dashboard</h2>
          <p className="admin-page-description">Here’s what’s happening with your store today.</p>
        </div>
        <Link to="/admin/products" className="lf-button-primary">Manage products</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {cards.map((card, index) => (
          <motion.article
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="admin-stat-card rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-3 break-words font-display text-2xl font-extrabold tracking-tight text-slate-900">{card.value}</p>
              </div>
              <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg font-semibold text-brand-800">{card.icon}</span>
            </div>
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">{card.detail}</p>
          </motion.article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="lf-panel overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900">Recent orders</h3>
              <p className="mt-1 text-xs text-slate-500">Latest activity from your customers</p>
            </div>
            <Link to="/admin/orders" className="text-sm font-semibold text-brand-700 hover:text-brand-900">View all</Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">No orders have been placed yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table min-w-[600px]">
                <thead>
                  <tr>
                    <th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Status</th><th scope="col" className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="font-mono text-xs font-semibold">#{order.id.slice(0, 8)}</td>
                      <td>{order.customer_name}</td>
                      <td><span className={`admin-status-pill admin-status-${order.status}`}>{order.status}</span></td>
                      <td className="text-right font-semibold">{formatPrice(order.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="lf-panel p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900">Orders by status</h3>
              <p className="mt-1 text-xs text-slate-500">Current fulfillment overview</p>
            </div>
            <Link to="/admin/orders" className="text-sm font-semibold text-brand-700 hover:text-brand-900">Orders</Link>
          </div>
          <ul className="space-y-4">
            {statusCounts.map(({ status, count }) => (
              <li key={status}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="capitalize text-slate-600">{status}</span>
                  <span className="font-semibold text-slate-800">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`admin-status-bar admin-status-bar-${status} h-full rounded-full transition-all`}
                    style={{ width: `${(count / maxStatusCount) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="lf-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900">Low stock</h3>
              <p className="mt-1 text-xs text-slate-500">Products that need replenishment</p>
            </div>
            <Link to="/admin/inventory" className="text-sm font-semibold text-brand-700 hover:text-brand-900">Manage inventory</Link>
          </div>
          {stats.lowStock.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">All products are well stocked.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.lowStock.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <span className="truncate text-sm font-medium text-slate-700">{product.name}</span>
                  <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{product.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="lf-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900">Top products</h3>
              <p className="mt-1 text-xs text-slate-500">Best sellers by units sold</p>
            </div>
            <Link to="/admin/products" className="text-sm font-semibold text-brand-700 hover:text-brand-900">Products</Link>
          </div>
          {stats.topProducts.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">No product sales yet.</p>
          ) : (
            <ol className="divide-y divide-slate-100">
              {stats.topProducts.map((product, index) => (
                <li key={product.name} className="flex items-center justify-between gap-4 px-5 py-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">{index + 1}</span>
                    <span className="truncate text-sm font-medium text-slate-700">{product.name}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-slate-800">{product.sold} sold</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
};
