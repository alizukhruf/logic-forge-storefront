import React from 'react';
import { Link } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';

export const Footer: React.FC = () => {
  const { db } = useDatabase();
  const settings = db?.settings;
  const phone = settings?.contact_phone.trim() ?? '';
  const phoneHref = phone.replace(/[^\d+]/g, '');
  const whatsappDigits = phone.replace(/\D/g, '');
  const whatsappNumber = whatsappDigits.startsWith('00')
    ? whatsappDigits.slice(2)
    : whatsappDigits.startsWith('0')
      ? `92${whatsappDigits.slice(1)}`
      : whatsappDigits;

  return (
    <footer className="mt-12 border-t border-brand-900/10 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-brand-950">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-900 text-white">L</span>
              LOGIC FORGE
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-gray-500">
              Technology and everyday essentials, thoughtfully selected for the Logic Forge collection.
            </p>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-bold text-brand-950">Explore</h2>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li><Link to="/shop" className="hover:text-brand-800">Shop all products</Link></li>
              <li><Link to="/shop#categories" className="hover:text-brand-800">Shop categories</Link></li>
              <li><Link to="/account" className="hover:text-brand-800">My account</Link></li>
              <li><Link to="/cart" className="hover:text-brand-800">Shopping bag</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-bold text-brand-950">Customer support</h2>
            <p className="mb-3 text-sm text-gray-500">Questions about the store? Get in touch.</p>
            <ul className="space-y-3 text-sm">
              {settings?.contact_email && (
                <li>
                  <a href={`mailto:${settings.contact_email}`} className="inline-flex items-center gap-2 font-medium text-gray-700 hover:text-brand-800">
                    <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                    {settings.contact_email}
                  </a>
                </li>
              )}
              {phone && (
                <li>
                  <a href={`tel:${phoneHref}`} className="inline-flex items-center gap-2 font-medium text-gray-700 hover:text-brand-800">
                    <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.2-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.8 2.1Z" /></svg>
                    {phone}
                  </a>
                </li>
              )}
              {whatsappNumber && (
                <li>
                  <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-medium text-gray-700 hover:text-brand-800">
                    <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20l1.2-5.3A8.4 8.4 0 1 1 21 11.5Z" /><path d="M9 9c.5 2 2 3.5 4 4l1-1 2 1c-.5 1.5-1.5 2-3 2-3-1-5-3-6-6 0-1.5.5-2.5 2-3l1 2-1 1Z" /></svg>
                    Message on WhatsApp
                  </a>
                </li>
              )}
              {settings?.contact_address && <li className="whitespace-pre-line text-sm leading-6 text-gray-600">{settings.contact_address}</li>}
            </ul>
          </div>
        </div>
        <div className="mt-9 flex flex-col gap-2 border-t border-gray-100 pt-5 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Logic Forge. All rights reserved.</p>
          <p>Product catalog, accounts, and orders are powered by Supabase.</p>
        </div>
      </div>
    </footer>
  );
};
