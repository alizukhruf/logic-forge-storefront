import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/admin', label: 'Dashboard', end: true, icon: '◫', group: 'Store' },
  { to: '/admin/orders', label: 'Orders', icon: '▤', group: 'Store' },
  { to: '/admin/store-settings', label: 'Store settings', icon: '⚙', group: 'Store' },
  { to: '/admin/products', label: 'Products', icon: '◇', group: 'Catalog' },
  { to: '/admin/categories', label: 'Categories', icon: '▧', group: 'Catalog' },
  { to: '/admin/inventory', label: 'Inventory', icon: '▥', group: 'Catalog' },
  { to: '/admin/customers', label: 'Customers', icon: '♙', group: 'Customers' },
  { to: '/admin/coupons', label: 'Coupons', icon: '%', group: 'Marketing' },
  { to: '/admin/reviews', label: 'Reviews', icon: '☆', group: 'Marketing' },
];

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState('');
  const activeLink = links.find((link) => link.to === location.pathname);
  const pageTitle = activeLink?.label ?? 'Dashboard';

  const signOut = async () => {
    setLogoutError('');
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setLogoutError(err instanceof Error ? err.message : 'Could not sign out.');
    }
  };

  const groups = [...new Set(links.map((link) => link.group))];

  return (
    <div className="admin-shell min-h-screen bg-slate-50 lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="admin-sidebar flex min-w-0 flex-col border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <Link to="/admin" className="flex h-[72px] shrink-0 items-center gap-3 border-b border-slate-100 px-5">
          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-900 font-display text-lg font-extrabold text-white">L</span>
          <span className="min-w-0">
            <span className="block font-display text-sm font-extrabold tracking-tight text-slate-900">Logic Forge</span>
            <span className="mt-0.5 block text-[11px] font-medium text-slate-500">Store management</span>
          </span>
        </Link>

        <nav aria-label="Admin navigation" className="admin-sidebar-nav flex gap-1 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:gap-5 lg:overflow-y-auto lg:overflow-x-hidden lg:px-3 lg:py-6">
          {groups.map((group) => (
            <div key={group} className="flex shrink-0 gap-1 lg:block lg:space-y-1">
              <p className="hidden px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 lg:block">{group}</p>
              {links.filter((link) => link.group === group).map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setLogoutError('')}
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-slate-100 text-brand-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <span aria-hidden="true" className="flex w-5 justify-center text-base text-slate-500">{link.icon}</span>
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="hidden border-t border-slate-100 p-4 lg:block">
          <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900">
            <span aria-hidden="true">↗</span>
            View storefront
          </Link>
          <Link to="/account" className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900">
            <span aria-hidden="true">⚙</span>
            Account settings
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="admin-topbar sticky top-0 z-20 flex min-h-[72px] items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400">Store / Admin</p>
            <h1 className="mt-0.5 truncate text-sm font-bold text-slate-800">{pageTitle}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <Link to="/" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 lg:hidden">Storefront</Link>
            <Link to="/account" className="hidden text-sm font-semibold text-slate-600 hover:text-slate-900 sm:block">Account</Link>
            <span className="hidden h-8 w-px bg-slate-200 sm:block" aria-hidden="true" />
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-900">
              {user?.name?.trim().charAt(0).toUpperCase() || 'A'}
            </span>
            <span className="hidden max-w-40 sm:block">
              <span className="block truncate text-sm font-semibold text-slate-800">{user?.name || 'Administrator'}</span>
              <span className="block text-xs text-slate-500">Administrator</span>
            </span>
            <button type="button" onClick={() => { void signOut(); }} className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900" aria-label="Sign out">
              Sign out
            </button>
          </div>
        </header>

        <div id="admin-main" className="admin-content mx-auto w-full max-w-[1440px] p-4 sm:p-6 xl:p-8">
          {logoutError && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{logoutError}</p>}
          <Outlet />
          <footer className="mt-10 border-t border-slate-200 pt-5 text-xs text-slate-400">
            Logic Forge Store Admin
          </footer>
        </div>
      </div>
    </div>
  );
};
