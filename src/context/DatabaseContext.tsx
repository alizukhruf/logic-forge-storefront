import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Customer, StoreData } from '../types';
import { useAuth } from './AuthContext';
import { supabase, supabaseConfigError } from '../db/supabase';

interface StoreContextValue {
  db: StoreData | null;
  ready: boolean;
  error: string | null;
  version: number;
  refresh: () => Promise<void>;
}

const emptyStore: StoreData = {
  categories: [],
  products: [],
  customers: [],
  orders: [],
  order_items: [],
  coupons: [],
  reviews: [],
  wishlist: [],
};

const loadProfiles = async (): Promise<Customer[]> => {
  const pageSize = 500;
  const profiles: Customer[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    profiles.push(...(data ?? []));
    if (!data || data.length < pageSize) return profiles;
  }
};

const StoreContext = createContext<StoreContextValue>({
  db: null,
  ready: false,
  error: null,
  version: 0,
  refresh: async () => {},
});

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, ready: authReady } = useAuth();
  const [db, setDb] = useState<StoreData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const requestVersion = useRef(0);

  const load = useCallback(async (requestId: number) => {
    if (supabaseConfigError) throw new Error(supabaseConfigError);
    const [categories, products, customers, orders, orderItems, coupons, reviews, wishlist] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      loadProfiles(),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('order_items').select('*'),
      supabase.from('coupons').select('*').order('code'),
      supabase.from('reviews').select('*').order('created_at', { ascending: false }),
      supabase.from('wishlist').select('*').order('created_at', { ascending: false }),
    ]);
    const failed = [categories, products, orders, orderItems, coupons, reviews, wishlist].find((result) => result.error);
    if (failed?.error) {
      if ('code' in failed.error && failed.error.code === 'PGRST205') {
        throw new Error('Supabase tables are not set up. Run supabase/schema.sql in your Supabase SQL Editor.');
      }
      throw new Error(failed.error.message);
    }

    if (requestId !== requestVersion.current) return;
    setDb({
      categories: categories.data ?? [],
      products: products.data ?? [],
      customers,
      orders: orders.data ?? [],
      order_items: orderItems.data ?? [],
      coupons: coupons.data ?? [],
      reviews: reviews.data ?? [],
      wishlist: wishlist.data ?? [],
    });
    setError(null);
    setVersion((current) => current + 1);
  }, []);

  const refresh = useCallback(async () => {
    const requestId = ++requestVersion.current;
    try {
      await load(requestId);
    } catch (err) {
      console.error('Could not refresh Supabase data.', err);
      setError(err instanceof Error ? err.message : 'Could not refresh Supabase data.');
      throw err;
    }
  }, [load]);

  useEffect(() => {
    if (!authReady) return;
    let active = true;
    const requestId = ++requestVersion.current;
    setDb(null);
    setError(null);
    load(requestId).catch((err) => {
      console.error('Could not load Supabase data.', err);
      if (active && requestId === requestVersion.current) {
        setError(err instanceof Error ? err.message : 'Could not load Supabase data.');
      }
    });
    return () => {
      active = false;
      requestVersion.current += 1;
    };
  }, [authReady, user?.id, load]);

  const valueDb = db ?? (error ? emptyStore : null);
  return (
    <StoreContext.Provider value={{ db: valueDb, ready: !!db, error, version, refresh }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useDatabase = () => useContext(StoreContext);
