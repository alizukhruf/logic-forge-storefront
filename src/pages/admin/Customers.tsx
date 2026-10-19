import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { deleteCustomer, listCustomers, listOrders } from '../../db/repo';
import { Loader } from '../../components/Loader';

export const AdminCustomers: React.FC = () => {
  const { db, ready, refresh } = useDatabase();
  const { user: currentUser } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  if (!ready || !db) return <Loader />;

  const customers = listCustomers(db);
  const orders = listOrders(db);
  const orderCounts = new Map<string | null, number>();
  orders.forEach((order) => orderCounts.set(order.customer_id, (orderCounts.get(order.customer_id) || 0) + 1));

  const removeUser = async (customerId: string, email: string) => {
    if (!confirm(`Permanently delete the account for ${email}? Their wishlist and reviews will be deleted. Historical orders will remain without a linked account. This cannot be undone.`)) return;
    setError('');
    setDeletingId(customerId);
    try {
      await deleteCustomer(db, customerId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this account.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="admin-page-heading">
        <div><span className="lf-eyebrow">Account management</span><h1 className="admin-page-title">User accounts</h1><p className="admin-page-description">All registered customer and administrator accounts ({customers.length}).</p></div>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="admin-table w-full min-w-[920px]">
          <thead>
            <tr>
              <th scope="col">Name</th><th scope="col">Email</th><th scope="col">Phone</th><th scope="col">Role</th><th scope="col">Orders</th><th scope="col">Joined</th><th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0
              ? <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">No user accounts to display yet.</td></tr>
              : customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="whitespace-nowrap font-semibold text-slate-900">{customer.name}</td>
                  <td><a className="text-brand-700 hover:underline" href={`mailto:${customer.email}`}>{customer.email}</a></td>
                  <td className="whitespace-nowrap">{customer.phone ? <a className="text-brand-700 hover:underline" href={`tel:${customer.phone.replace(/[^\d+]/g, '')}`}>{customer.phone}</a> : <span className="text-slate-400">Not provided</span>}</td>
                  <td><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${customer.role === 'admin' ? 'bg-violet-50 text-violet-800' : 'bg-gray-100 text-gray-700'}`}>{customer.role}</span></td>
                  <td>{orderCounts.get(customer.id) || 0}</td>
                  <td className="whitespace-nowrap text-gray-500">{new Date(customer.created_at).toLocaleDateString()}</td>
                  <td className="text-right">
                    {customer.id === currentUser?.id
                      ? <span className="text-xs text-gray-400">Current account</span>
                      : <button type="button" disabled={deletingId !== null} onClick={() => { void removeUser(customer.id, customer.email); }} className="font-semibold text-red-600 hover:text-red-800 disabled:opacity-50">
                        {deletingId === customer.id ? 'Deleting…' : 'Delete'}
                      </button>}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
