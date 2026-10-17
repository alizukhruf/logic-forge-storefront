import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useDatabase } from '../context/DatabaseContext';
import { getOrder, getOrderItems } from '../db/repo';
import { Loader } from '../components/Loader';
import { formatPrice } from '../utils/currency';

export const OrderConfirmation: React.FC = () => {
  const { orderId } = useParams();
  const { db, ready } = useDatabase();
  if (!ready || !db) return <Loader />;

  const order = getOrder(db, orderId || '');
  if (!order) {
    return (
      <div className="lf-page">
        <div className="lf-panel mx-auto max-w-lg px-6 py-12 text-center">
          <h1 className="font-display text-2xl font-bold text-brand-950">Order not found</h1>
          <p className="mt-2 text-sm text-gray-500">We couldn’t find that order in your account.</p>
          <Link to="/account" className="lf-button-primary mt-5">Go to your account</Link>
        </div>
      </div>
    );
  }
  const items = getOrderItems(db, order.id);

  return (
    <div className="lf-page max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="text-center">
        <div aria-hidden="true" className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl font-bold text-emerald-700">✓</div>
        <span className="lf-eyebrow">Order received</span>
        <h1 className="font-display text-3xl font-extrabold text-brand-950">Thank you, {order.customer_name.split(' ')[0]}.</h1>
        <p className="mt-2 text-gray-600">Your order <span className="font-semibold text-gray-800">#{order.id.slice(0, 8)}</span> has been placed.</p>
        <p className="mt-1 text-sm text-gray-500">A confirmation will be sent to {order.customer_email}.</p>
      </motion.div>

      <section aria-labelledby="order-items-heading" className="lf-panel mt-8 p-5 sm:p-7">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="order-items-heading" className="font-display text-lg font-bold text-brand-950">Order details</h2>
          <time className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</time>
        </div>
        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 py-3 text-sm">
              <span className="text-gray-700">{item.product_name} <span className="text-gray-400">× {item.quantity}</span></span>
              <span className="shrink-0 font-medium text-gray-900">{formatPrice(item.unit_price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <dl className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
          <div className="flex justify-between text-gray-600"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          {order.coupon_code && <div className="flex justify-between text-emerald-700"><dt>Discount <span className="text-xs">({order.coupon_code})</span></dt><dd>-{formatPrice(order.discount)}</dd></div>}
          <div className="flex justify-between text-gray-600"><dt>Tax</dt><dd>{formatPrice(order.tax)}</dd></div>
          <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold text-brand-950"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>
      </section>

      <section aria-labelledby="shipping-heading" className="lf-panel mt-4 p-5 sm:p-6">
        <h2 id="shipping-heading" className="font-display font-bold text-brand-950">Shipping to</h2>
        <address className="mt-2 text-sm not-italic leading-6 text-gray-600">
          {order.customer_name}<br />{order.shipping_address.line1}<br />
          {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}<br />
          {order.shipping_address.country}
        </address>
      </section>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/account" className="lf-button-secondary">View order history</Link>
        <Link to="/shop" className="lf-button-primary">Continue shopping</Link>
      </div>
    </div>
  );
};
