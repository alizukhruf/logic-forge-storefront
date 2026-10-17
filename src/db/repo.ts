import { v4 as uuid } from 'uuid';
import type {
  Category, Product, Customer, Order, OrderItem, Coupon, Review, WishlistItem, CartLine, Address, StoreData,
} from '../types';
import { supabase } from './supabase';
import { formatPrice } from '../utils/currency';

const fail = (error: { message: string } | null): void => {
  if (error) throw new Error(error.message);
};

const makeSlug = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const listCategories = (db: StoreData): Category[] => db.categories;

export const upsertCategory = async (db: StoreData, c: Partial<Category> & { name: string }) => {
  const values = { name: c.name, slug: makeSlug(c.slug || c.name), description: c.description || '' };
  const result = c.id
    ? await supabase.from('categories').update(values).eq('id', c.id)
    : await supabase.from('categories').insert({ id: uuid(), ...values });
  fail(result.error);
};

export const deleteCategory = async (db: StoreData, id: string) => {
  if (db.products.some((product) => product.category_id === id)) {
    throw new Error('Cannot delete a category that still has products.');
  }
  const { error } = await supabase.from('categories').delete().eq('id', id);
  fail(error);
};

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating';
  activeOnly?: boolean;
}

export const listProducts = (db: StoreData, f: ProductFilters = {}): Product[] => {
  const search = f.search?.toLocaleLowerCase();
  const products = db.products.filter((product) =>
    (!f.activeOnly || product.is_active === 1) &&
    (!search || product.name.toLocaleLowerCase().includes(search) || product.description.toLocaleLowerCase().includes(search)) &&
    (!f.categoryId || product.category_id === f.categoryId) &&
    (f.minPrice == null || product.price >= f.minPrice) &&
    (f.maxPrice == null || product.price <= f.maxPrice)
  );
  const comparators: Record<NonNullable<ProductFilters['sort']>, (a: Product, b: Product) => number> = {
    newest: (a, b) => b.created_at.localeCompare(a.created_at),
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating,
  };
  return products.sort(comparators[f.sort || 'newest']);
};

export const getProductBySlug = (db: StoreData, slug: string): Product | null =>
  db.products.find((product) => product.slug === slug) ?? null;

export const getProductById = (db: StoreData, id: string): Product | null =>
  db.products.find((product) => product.id === id) ?? null;

export const upsertProduct = async (db: StoreData, p: Partial<Product> & { name: string; price: number }) => {
  const slug = makeSlug(p.slug || p.name);
  const values = {
    name: p.name,
    slug,
    description: p.description || '',
    price: p.price,
    compare_at_price: p.compare_at_price ?? null,
    category_id: p.category_id || db.categories[0]?.id,
    image_url: p.image_url || `https://picsum.photos/seed/${slug}/600/600`,
    stock: p.stock ?? 0,
    sku: p.sku || `SKU-${Date.now()}`,
    is_active: p.is_active ?? 1,
  };
  if (!values.category_id) throw new Error('Create a category before adding products.');
  const result = p.id
    ? await supabase.from('products').update(values).eq('id', p.id)
    : await supabase.from('products').insert({ id: uuid(), ...values });
  fail(result.error);
};

export const deleteProduct = async (_db: StoreData, id: string) => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  fail(error);
};

export const adjustStock = async (_db: StoreData, id: string, delta: number) => {
  const { error } = await supabase.rpc('adjust_inventory', { p_product_id: id, p_delta: delta });
  fail(error);
};

export const findCustomerByEmail = (db: StoreData, email: string): Customer | null =>
  db.customers.find((customer) => customer.email.toLocaleLowerCase() === email.toLocaleLowerCase()) ?? null;

export const getCustomer = (db: StoreData, id: string): Customer | null =>
  db.customers.find((customer) => customer.id === id) ?? null;

export const listCustomers = (db: StoreData): Customer[] => db.customers;

export const deleteCustomer = async (_db: StoreData, userId: string): Promise<void> => {
  const { data, error } = await supabase.functions.invoke<{ success: boolean }>('admin-delete-user', {
    body: { userId },
  });
  if (error) {
    let message = error.message;
    if (error.context instanceof Response) {
      const responseBody: unknown = await error.context.clone().json();
      if (typeof responseBody === 'object' && responseBody !== null
        && 'error' in responseBody && typeof responseBody.error === 'string') {
        message = responseBody.error;
      }
    }
    throw new Error(message);
  }
  if (!data?.success) throw new Error('The account deletion could not be confirmed.');
};

export const listCoupons = (db: StoreData): Coupon[] => db.coupons;

export const upsertCoupon = async (_db: StoreData, c: Partial<Coupon> & { code: string; type: string; value: number }) => {
  const values = {
    code: c.code.toUpperCase(),
    type: c.type,
    value: c.value,
    active: c.active ?? 1,
    expires_at: c.expires_at ?? null,
    min_subtotal: c.min_subtotal ?? 0,
  };
  const result = c.id
    ? await supabase.from('coupons').update(values).eq('id', c.id)
    : await supabase.from('coupons').insert({ id: uuid(), ...values });
  fail(result.error);
};

export const deleteCoupon = async (_db: StoreData, id: string) => {
  const { error } = await supabase.from('coupons').delete().eq('id', id);
  fail(error);
};

export const validateCoupon = (db: StoreData, code: string, subtotal: number): Coupon => {
  const coupon = db.coupons.find((item) => item.code.toUpperCase() === code.toUpperCase());
  if (!coupon || !coupon.active) throw new Error('Coupon not found or inactive.');
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) throw new Error('Coupon has expired.');
  if (subtotal < coupon.min_subtotal) {
    throw new Error(`Requires a subtotal of at least ${formatPrice(coupon.min_subtotal)}.`);
  }
  return coupon;
};

export const listReviews = (db: StoreData, productId: string): Review[] =>
  db.reviews.filter((review) => review.product_id === productId);

export const listAdminReviews = (db: StoreData): (Review & { product_name: string })[] =>
  db.reviews.map((review) => ({
    ...review,
    product_name: db.products.find((product) => product.id === review.product_id)?.name ?? 'Deleted product',
  }));

export const addReview = async (
  _db: StoreData,
  productId: string,
  customerId: string,
  customerName: string,
  rating: number,
  comment: string
) => {
  const { error } = await supabase.from('reviews').insert({
    id: uuid(),
    product_id: productId,
    customer_id: customerId,
    customer_name: customerName,
    rating,
    comment,
  });
  fail(error);
};

export const deleteReview = async (_db: StoreData, id: string) => {
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  fail(error);
};

export const listWishlist = (db: StoreData, customerId: string): Product[] => {
  const byId = new Map(db.products.map((product) => [product.id, product]));
  return db.wishlist
    .filter((item) => item.customer_id === customerId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .flatMap((item) => {
      const product = byId.get(item.product_id);
      return product ? [product] : [];
    });
};

export const isWishlisted = (db: StoreData, customerId: string, productId: string): boolean =>
  db.wishlist.some((item) => item.customer_id === customerId && item.product_id === productId);

export const toggleWishlist = async (db: StoreData, customerId: string, productId: string): Promise<boolean> => {
  const existing = db.wishlist.find((item) => item.customer_id === customerId && item.product_id === productId);
  if (existing) {
    const { error } = await supabase.from('wishlist').delete().eq('id', existing.id);
    fail(error);
    return false;
  }
  const { error } = await supabase.from('wishlist').insert({
    id: uuid(),
    customer_id: customerId,
    product_id: productId,
  });
  fail(error);
  return true;
};

export const listOrders = (db: StoreData, customerId?: string): Order[] =>
  customerId ? db.orders.filter((order) => order.customer_id === customerId) : db.orders;

export const getOrder = (db: StoreData, id: string): Order | null =>
  db.orders.find((order) => order.id === id) ?? null;

export const getOrderItems = (db: StoreData, orderId: string): OrderItem[] =>
  db.order_items.filter((item) => item.order_id === orderId);

export interface PlaceOrderInput {
  lines: CartLine[];
  address: Address;
  couponCode?: string | null;
}

export const placeOrder = async (_db: StoreData, input: PlaceOrderInput): Promise<Order> => {
  if (input.lines.length === 0) throw new Error('Your cart is empty.');
  const { data: orderId, error } = await supabase.rpc('place_order', {
    p_lines: input.lines.map(({ product, quantity }) => ({ product_id: product.id, quantity })),
    p_address: input.address,
    p_coupon_code: input.couponCode?.trim() || null,
  });
  fail(error);
  if (!orderId) throw new Error('Supabase did not return the new order ID.');
  const { data: order, error: orderError } = await supabase.from('orders').select('*').eq('id', orderId).single();
  fail(orderError);
  return order;
};

export const updateOrderStatus = async (_db: StoreData, id: string, status: Order['status']) => {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  fail(error);
};

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStock: Product[];
  recentOrders: Order[];
  topProducts: { name: string; sold: number }[];
}

export const getDashboardStats = (db: StoreData): DashboardStats => {
  const soldByProduct = new Map<string, { name: string; sold: number }>();
  db.order_items.forEach((item) => {
    const current = soldByProduct.get(item.product_id) ?? { name: item.product_name, sold: 0 };
    current.sold += item.quantity;
    soldByProduct.set(item.product_id, current);
  });
  return {
    totalRevenue: db.orders.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + order.total, 0),
    totalOrders: db.orders.length,
    totalCustomers: db.customers.filter((customer) => customer.role === 'customer').length,
    totalProducts: db.products.length,
    lowStock: [...db.products].filter((product) => product.stock <= 10).sort((a, b) => a.stock - b.stock).slice(0, 5),
    recentOrders: db.orders.slice(0, 5),
    topProducts: [...soldByProduct.values()].sort((a, b) => b.sold - a.sold).slice(0, 5),
  };
};
