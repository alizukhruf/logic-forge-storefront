import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/admin', label: 'Overview', end: true, icon: '▦' },
  { to: '/admin/products', label: 'Products', icon: '◇' },
  { to: '/admin/categories', label: 'Categories', icon: '▤' },
  { to: '/admin/inventory', label: 'Inventory', icon: '▧' },
  { to: '/admin/orders', label: 'Orders', icon: '▣' },
  { to: '/admin/customers', label: 'Customers', icon: '♙' },
  { to: '/admin/coupons', label: 'Coupons', icon: '%' },
  { to: '/admin/reviews', label: 'Reviews', icon: '☆' },
  { to: '/account', label: 'Account security', icon: '⌑' },
];

export const AdminLayout: React.FC = () => (
  <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-8 lg:flex-row lg:gap-8 lg:px-8">
    <aside className="w-full shrink-0 lg:w-60">
      <div className="mb-3 flex items-center justify-between gap-3 lg:mb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">Logic Forge</span>
          <h1 className="mt-1 font-display text-xl font-extrabold text-brand-950">Store admin</h1>
        </div>
        <Link to="/" className="text-sm font-semibold text-brand-700 hover:text-brand-950">← Storefront</Link>
      </div>
      <nav aria-label="Admin navigation" className="flex gap-1 overflow-x-auto rounded-2xl border border-gray-100 bg-white p-2 shadow-sm lg:sticky lg:top-32 lg:flex-col lg:gap-1 lg:overflow-visible">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-brand-900 text-white shadow-sm' : 'text-gray-600 hover:bg-brand-50 hover:text-brand-900'
              }`
            }
          >
            <span aria-hidden="true" className="flex w-5 justify-center text-base">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
    <main id="admin-main" className="min-w-0 flex-1 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
      <Outlet />
    </main>
  </div>
);
