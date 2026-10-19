import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { supabase } from '../../db/supabase';
import { resetSalesAndOrders, saveStoreSettings } from '../../db/repo';
import { defaultStoreSettings, type StoreSettings } from '../../types';
import { Loader } from '../../components/Loader';

export const AdminStoreSettings: React.FC = () => {
  const { db, ready, refresh } = useDatabase();
  const { user } = useAuth();
  const [settings, setSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  useEffect(() => {
    if (ready && db) setSettings(db.settings);
  }, [db?.settings, ready]);

  if (!ready || !db) return <Loader />;

  const availableCoupons = db.coupons.filter((coupon) =>
    coupon.active && (!coupon.expires_at || new Date(coupon.expires_at) > new Date())
  );
  const hasSelectedCoupon = availableCoupons.some((coupon) => coupon.code === settings.offer_coupon_code);

  const update = (key: keyof StoreSettings, value: string) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setSaveError('');
    setSaveSuccess('');
  };

  const submitSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveError('');
    setSaveSuccess('');
    if (settings.offer_coupon_code && !hasSelectedCoupon) {
      setSaveError('Choose an active, unexpired coupon for the homepage offer, or select no coupon.');
      return;
    }
    setSaving(true);
    try {
      await saveStoreSettings(settings);
      await refresh();
      setSaveSuccess('Storefront settings saved.');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save storefront settings.');
    } finally {
      setSaving(false);
    }
  };

  const resetStoreSales = async (event: React.FormEvent) => {
    event.preventDefault();
    setResetError('');
    setResetSuccess('');
    if (resetConfirmation !== 'RESET') {
      setResetError('Type RESET exactly to confirm this action.');
      return;
    }
    if (!user?.email) {
      setResetError('Your administrator email could not be verified. Sign in again and retry.');
      return;
    }
    if (!window.confirm('Permanently delete every order and sales record? Sold quantities will be returned to stock. This cannot be undone.')) return;

    setResetting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: adminPassword,
      });
      if (error) throw new Error(error.message);
      if (data.user?.id !== user.id) throw new Error('The password did not verify the current administrator account.');

      await resetSalesAndOrders();
      await refresh();
      setResetSuccess('Order history and sales have been reset. Sold quantities were returned to inventory.');
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Could not reset sales and orders.');
    } finally {
      setAdminPassword('');
      setResetConfirmation('');
      setResetting(false);
    }
  };

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <span className="lf-eyebrow">Store configuration</span>
          <h2 className="admin-page-title">Store settings</h2>
          <p className="admin-page-description">Update the homepage content and customer support details shown in your store.</p>
        </div>
      </div>

      <form onSubmit={submitSettings} className="space-y-6">
        <section className="lf-panel p-5 sm:p-6">
          <div className="mb-5">
            <h3 className="font-display text-lg font-bold text-slate-900">Homepage hero</h3>
            <p className="mt-1 text-sm text-slate-500">Control the main headline, call to action, and hero image.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Eyebrow text
              <input required maxLength={100} value={settings.hero_eyebrow} onChange={(event) => update('hero_eyebrow', event.target.value)} className="lf-input mt-1.5" />
            </label>
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Headline
              <input required maxLength={180} value={settings.hero_title} onChange={(event) => update('hero_title', event.target.value)} className="lf-input mt-1.5" />
            </label>
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Description
              <textarea required maxLength={600} rows={3} value={settings.hero_description} onChange={(event) => update('hero_description', event.target.value)} className="lf-input mt-1.5" />
            </label>
            <label className="text-sm font-semibold text-slate-700">Hero image URL
              <input required type="url" maxLength={2000} value={settings.hero_image_url} onChange={(event) => update('hero_image_url', event.target.value)} className="lf-input mt-1.5" />
            </label>
            <label className="text-sm font-semibold text-slate-700">Primary button text
              <input required maxLength={60} value={settings.hero_cta_text} onChange={(event) => update('hero_cta_text', event.target.value)} className="lf-input mt-1.5" />
            </label>
          </div>
          {settings.hero_image_url && (
            <img src={settings.hero_image_url} alt="Homepage hero preview" className="mt-4 h-40 w-full rounded-lg border border-slate-200 object-cover sm:h-52" />
          )}
        </section>

        <section className="lf-panel p-5 sm:p-6">
          <div className="mb-5">
            <h3 className="font-display text-lg font-bold text-slate-900">Homepage offer</h3>
            <p className="mt-1 text-sm text-slate-500">Choose an active coupon and customize the banner text displayed on the home page.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Offer headline
              <input required maxLength={160} value={settings.offer_title} onChange={(event) => update('offer_title', event.target.value)} className="lf-input mt-1.5" />
            </label>
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Offer description
              <textarea required maxLength={300} rows={2} value={settings.offer_description} onChange={(event) => update('offer_description', event.target.value)} className="lf-input mt-1.5" />
            </label>
            <label className="text-sm font-semibold text-slate-700">Checkout coupon code
              <select value={settings.offer_coupon_code} onChange={(event) => update('offer_coupon_code', event.target.value)} className="lf-input mt-1.5">
                <option value="">No coupon / hide offer banner</option>
                {!hasSelectedCoupon && settings.offer_coupon_code && <option value={settings.offer_coupon_code}>Unavailable: {settings.offer_coupon_code}</option>}
                {availableCoupons.map((coupon) => <option key={coupon.id} value={coupon.code}>{coupon.code}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">Offer button text
              <input required maxLength={60} value={settings.offer_cta_text} onChange={(event) => update('offer_cta_text', event.target.value)} className="lf-input mt-1.5" />
            </label>
          </div>
        </section>

        <section className="lf-panel p-5 sm:p-6">
          <div className="mb-5">
            <h3 className="font-display text-lg font-bold text-slate-900">Customer support contact</h3>
            <p className="mt-1 text-sm text-slate-500">These details appear in the storefront footer.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">Support email
              <input type="email" required maxLength={254} value={settings.contact_email} onChange={(event) => update('contact_email', event.target.value)} className="lf-input mt-1.5" />
            </label>
            <label className="text-sm font-semibold text-slate-700">Phone / WhatsApp
              <input type="tel" maxLength={40} value={settings.contact_phone} onChange={(event) => update('contact_phone', event.target.value)} className="lf-input mt-1.5" />
            </label>
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Store address <span className="font-normal text-slate-400">(optional)</span>
              <textarea maxLength={500} rows={2} value={settings.contact_address} onChange={(event) => update('contact_address', event.target.value)} className="lf-input mt-1.5" />
            </label>
          </div>
        </section>

        {saveError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{saveError}</p>}
        {saveSuccess && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{saveSuccess}</p>}
        <button type="submit" disabled={saving} className="lf-button-primary">{saving ? 'Saving settings…' : 'Save store settings'}</button>
      </form>

      <section className="mt-10 rounded-xl border border-red-200 bg-white p-5 sm:p-6">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-red-700">Danger zone</span>
        <h3 className="mt-2 font-display text-lg font-bold text-slate-900">Reset sales and orders</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Permanently deletes all order and sales history and returns the sold quantities to inventory. Products, customers, categories, coupons, reviews, and store settings are kept. You must re-enter your administrator password.
        </p>
        <form onSubmit={(event) => { void resetStoreSales(event); }} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Administrator password
            <input required type="password" autoComplete="current-password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} className="lf-input mt-1.5" />
          </label>
          <label className="text-sm font-semibold text-slate-700">Type RESET to confirm
            <input required value={resetConfirmation} onChange={(event) => setResetConfirmation(event.target.value)} className="lf-input mt-1.5" />
          </label>
          {resetError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{resetError}</p>}
          {resetSuccess && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:col-span-2">{resetSuccess}</p>}
          <div className="sm:col-span-2">
            <button type="submit" disabled={resetting || resetConfirmation !== 'RESET' || !adminPassword} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50">
              {resetting ? 'Resetting sales and orders…' : 'Reset sales and orders'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
