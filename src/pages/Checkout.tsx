import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';
import { placeOrder, validateCoupon } from '../db/repo';
import type { Address } from '../types';
import { formatPrice } from '../utils/currency';

export const Checkout: React.FC = () => {
  const { lines, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { db, refresh } = useDatabase();
  const navigate = useNavigate();

  const [address, setAddress] = useState<Address>(() => {
    const nameParts = (user?.name ?? '').trim().split(/\s+/);
    const firstName = nameParts.shift() ?? '';
    return {
      first_name: firstName,
      last_name: nameParts.join(' '),
      phone: user?.phone ?? '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      zip: '',
      country: 'Pakistan',
    };
  });
  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [discountPreview, setDiscountPreview] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  if (!user) {
    return (
      <div className="lf-page">
        <div className="lf-panel mx-auto max-w-md px-6 py-12 text-center">
          <h1 className="font-display text-2xl font-extrabold text-brand-950">Sign in to check out</h1>
          <p className="mt-2 text-sm text-gray-500">Your bag will be here when you return.</p>
          <button onClick={() => navigate('/login')} className="lf-button-primary mt-5">Sign in</button>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="lf-page">
        <div className="lf-panel mx-auto max-w-md px-6 py-12 text-center">
          <h1 className="font-display text-2xl font-extrabold text-brand-950">Your bag is empty</h1>
          <Link to="/shop" className="lf-button-primary mt-5">Continue shopping</Link>
        </div>
      </div>
    );
  }

  const applyCoupon = () => {
    if (!db) {
      setCouponMsg({ type: 'error', text: 'Store data is not ready yet. Please try again.' });
      return;
    }
    try {
      const coupon = validateCoupon(db, couponCode, subtotal);
      const discount = coupon.type === 'percent' ? subtotal * (coupon.value / 100) : Math.min(coupon.value, subtotal);
      setDiscountPreview(discount);
      setCouponMsg({ type: 'ok', text: `Coupon applied: -${formatPrice(discount)}` });
    } catch (err) {
      setDiscountPreview(0);
      setCouponMsg({ type: 'error', text: err instanceof Error ? err.message : 'Could not apply that coupon.' });
    }
  };

  const tax = Math.max(0, subtotal - discountPreview) * 0.08;
  const total = Math.max(0, subtotal - discountPreview) + tax;
  const stockIssue = lines.some((line) => line.product.stock < line.quantity || line.product.stock <= 0);

  const handlePlaceOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!db) {
      setError('Store data is not ready yet. Please try again.');
      return;
    }
    setError(null);
    setPlacing(true);
    try {
      const order = await placeOrder(db, {
        lines,
        address,
        couponCode: discountPreview > 0 ? couponCode : null,
      });
      await refresh();
      clearCart();
      navigate(`/order-confirmation/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place your order.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="lf-page max-w-6xl">
      <span className="lf-eyebrow">One last step</span>
      <h1 className="mb-7 font-display text-3xl font-extrabold text-brand-950">Checkout</h1>
      <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <form onSubmit={handlePlaceOrder} className="lf-panel space-y-4 p-5 sm:p-7">
          <div className="mb-5">
            <h2 className="font-display text-xl font-bold text-brand-950">Shipping address</h2>
            <p className="mt-1 text-sm text-gray-500">Enter the recipient and address for delivery in Pakistan.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="address-first-name" className="mb-1.5 block text-sm font-semibold text-gray-700">First name</label>
              <input id="address-first-name" autoComplete="given-name" required maxLength={80} value={address.first_name}
                onChange={(event) => setAddress({ ...address, first_name: event.target.value })} className="lf-input" />
            </div>
            <div>
              <label htmlFor="address-last-name" className="mb-1.5 block text-sm font-semibold text-gray-700">Last name</label>
              <input id="address-last-name" autoComplete="family-name" required maxLength={80} value={address.last_name}
                onChange={(event) => setAddress({ ...address, last_name: event.target.value })} className="lf-input" />
            </div>
          </div>
          <div>
            <label htmlFor="address-phone" className="mb-1.5 block text-sm font-semibold text-gray-700">Delivery mobile number</label>
            <input id="address-phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={24}
              pattern="(?:[+]92|0092|0)?[ -]?3(?:[ -]?[0-9]){9}"
              title="Enter a Pakistani mobile number, such as 03001234567 or +92 300 1234567."
              placeholder="03XX XXXXXXX" value={address.phone}
              onChange={(event) => setAddress({ ...address, phone: event.target.value })} className="lf-input" />
          </div>
          <div>
            <label htmlFor="address-line1" className="mb-1.5 block text-sm font-semibold text-gray-700">House / flat number and street</label>
            <input id="address-line1" autoComplete="address-line1" required maxLength={200} value={address.line1}
              onChange={(event) => setAddress({ ...address, line1: event.target.value })} className="lf-input" />
          </div>
          <div>
            <label htmlFor="address-line2" className="mb-1.5 block text-sm font-semibold text-gray-700">Area, sector, or landmark <span className="font-normal text-gray-400">(optional)</span></label>
            <input id="address-line2" autoComplete="address-line2" maxLength={200} value={address.line2}
              onChange={(event) => setAddress({ ...address, line2: event.target.value })} className="lf-input" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="address-city" className="mb-1.5 block text-sm font-semibold text-gray-700">City</label>
              <input id="address-city" autoComplete="address-level2" required maxLength={100} value={address.city}
                onChange={(event) => setAddress({ ...address, city: event.target.value })} className="lf-input" />
            </div>
            <div>
              <label htmlFor="address-state" className="mb-1.5 block text-sm font-semibold text-gray-700">Province / territory</label>
              <select id="address-state" autoComplete="address-level1" required value={address.state}
                onChange={(event) => setAddress({ ...address, state: event.target.value })} className="lf-input">
                <option value="">Select province / territory</option>
                <option>Punjab</option>
                <option>Sindh</option>
                <option>Khyber Pakhtunkhwa</option>
                <option>Balochistan</option>
                <option>Islamabad Capital Territory</option>
                <option>Gilgit-Baltistan</option>
                <option>Azad Jammu and Kashmir</option>
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="address-zip" className="mb-1.5 block text-sm font-semibold text-gray-700">Postal code <span className="font-normal text-gray-400">(optional)</span></label>
              <input id="address-zip" autoComplete="postal-code" maxLength={24} value={address.zip}
                onChange={(event) => setAddress({ ...address, zip: event.target.value })} className="lf-input" />
            </div>
            <div>
              <label htmlFor="address-country" className="mb-1.5 block text-sm font-semibold text-gray-700">Country</label>
              <input id="address-country" autoComplete="country-name" readOnly value={address.country} className="lf-input bg-gray-50" />
            </div>
          </div>

          {stockIssue && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">One or more items no longer have enough stock. Update your bag before placing the order.</p>}
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={placing || stockIssue || !db} className="lf-button-primary w-full">
            {placing ? 'Placing order…' : `Place order — ${formatPrice(total)}`}
          </button>
          <p className="text-center text-xs text-gray-400">Review your address and order details before submitting.</p>
        </form>

        <aside className="lf-panel p-5 sm:p-6">
          <h2 className="mb-4 font-display text-xl font-bold text-brand-950">Order summary</h2>
          <div className="max-h-64 space-y-3 overflow-y-auto pr-1 text-sm">
            {lines.map((line) => (
              <div key={line.product.id} className="flex justify-between gap-4 text-gray-600">
                <span>{line.product.name} <span className="text-gray-400">× {line.quantity}</span></span>
                <span className="shrink-0 font-medium text-gray-900">{formatPrice(line.product.price * line.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-2">
            <label htmlFor="coupon-code" className="sr-only">Coupon code</label>
            <input id="coupon-code" value={couponCode} onChange={(event) => { setCouponCode(event.target.value); setDiscountPreview(0); setCouponMsg(null); }}
              placeholder="Coupon code" autoCapitalize="characters" maxLength={40} className="lf-input min-w-0 flex-1" />
            <button type="button" onClick={applyCoupon} disabled={!couponCode.trim()} className="lf-button-secondary px-4">Apply</button>
          </div>
          {couponMsg && <p role={couponMsg.type === 'error' ? 'alert' : 'status'} className={`mt-2 text-xs ${couponMsg.type === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}>{couponMsg.text}</p>}

          <dl className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-sm">
            <div className="flex justify-between text-gray-600"><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
            <div className="flex justify-between text-gray-600"><dt>Discount</dt><dd>-{formatPrice(discountPreview)}</dd></div>
            <div className="flex justify-between text-gray-600"><dt>Tax (8%)</dt><dd>{formatPrice(tax)}</dd></div>
            <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold text-brand-950"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
};
