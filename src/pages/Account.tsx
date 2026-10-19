import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';
import { listOrders } from '../db/repo';
import { Loader } from '../components/Loader';
import { formatPrice } from '../utils/currency';

const statusColor: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800',
  processing: 'bg-blue-50 text-blue-800',
  shipped: 'bg-violet-50 text-violet-800',
  delivered: 'bg-emerald-50 text-emerald-800',
  cancelled: 'bg-red-50 text-red-700',
};

export const Account: React.FC = () => {
  const { user, changePassword } = useAuth();
  const { db, ready } = useDatabase();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  if (!user) return null;
  if (!ready || !db) return <Loader />;

  const orders = listOrders(db, user.id);

  const submitPasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword !== confirmPassword) {
      setPasswordError('The new passwords do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Your password has been changed.');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Could not change your password.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="lf-page max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <span className="lf-eyebrow">Your Logic Forge</span>
        <h1 className="font-display text-3xl font-extrabold text-brand-950">My account</h1>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }} aria-label="Account details" className="lf-panel mt-6 flex flex-wrap items-center gap-4 p-5 sm:p-6">
        <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 font-display text-xl font-bold text-brand-800">{user.name.trim().charAt(0).toUpperCase()}</span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold text-brand-950">{user.name}</h2>
          <p className="break-all text-sm text-gray-500">{user.email}</p>
        </div>
        <Link to="/wishlist" className="lf-button-secondary ml-auto">View wishlist</Link>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} aria-labelledby="password-heading" className="lf-panel mt-5 p-5 sm:p-6">
        <div className="mb-5">
          <span className="lf-eyebrow">Account security</span>
          <h2 id="password-heading" className="font-display text-xl font-bold text-brand-950">Change password</h2>
          <p className="mt-1 text-sm text-gray-500">Enter your current password to verify your identity.</p>
        </div>
        <form onSubmit={submitPasswordChange} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-gray-700 sm:col-span-2">Current password
            <input required type="password" autoComplete="current-password" value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)} className="lf-input mt-1.5 max-w-xl" />
          </label>
          <label className="text-sm font-semibold text-gray-700">New password
            <input required type="password" minLength={8} autoComplete="new-password" value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)} className="lf-input mt-1.5" />
          </label>
          <label className="text-sm font-semibold text-gray-700">Confirm new password
            <input required type="password" minLength={8} autoComplete="new-password" value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)} className="lf-input mt-1.5" />
          </label>
          <div className="flex flex-col items-start gap-3 sm:col-span-2">
            {passwordError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{passwordError}</p>}
            {passwordSuccess && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{passwordSuccess}</p>}
            <button type="submit" disabled={changingPassword} className="lf-button-primary">
              {changingPassword ? 'Updating password…' : 'Update password'}
            </button>
          </div>
        </form>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }} className="mt-10">
        <div className="lf-section-heading">
          <div><span className="lf-eyebrow">Purchases</span><h2 className="font-display text-2xl font-extrabold text-brand-950">Order history</h2></div>
          <span className="text-sm text-gray-500">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span>
        </div>
        {orders.length === 0 ? (
          <div className="lf-panel px-5 py-10 text-center">
            <p className="text-sm text-gray-500">You haven’t placed an order yet.</p>
            <Link to="/shop" className="lf-button-primary mt-4">Explore the collection</Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: orders.indexOf(order) * 0.05 }}
                whileHover={{ y: -2 }}
              >
                <Link to={`/order-confirmation/${order.id}`}
                  className="lf-panel flex flex-wrap items-center justify-between gap-3 p-4 transition hover:border-brand-200 hover:shadow-md sm:p-5">
                  <div className="min-w-[45%]">
                    <p className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</p>
                    <time className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</time>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColor[order.status] || 'bg-gray-100 text-gray-700'}`}>{order.status}</span>
                  <p className="font-display font-bold text-brand-950">{formatPrice(order.total)}</p>
                  <span aria-hidden="true" className="text-brand-600">→</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
