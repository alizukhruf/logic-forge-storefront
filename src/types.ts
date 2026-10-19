export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  category_id: string;
  image_url: string;
  stock: number;
  sku: string;
  rating: number;
  review_count: number;
  is_active: number; // Stored as 0/1 in PostgreSQL.
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  created_at: string;
}

export interface Address {
  first_name: string;
  last_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface StoreSettings {
  id: number;
  hero_eyebrow: string;
  hero_title: string;
  hero_description: string;
  hero_image_url: string;
  hero_cta_text: string;
  offer_title: string;
  offer_description: string;
  offer_coupon_code: string;
  offer_cta_text: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
}

export const defaultStoreSettings: StoreSettings = {
  id: 1,
  hero_eyebrow: 'Thoughtfully selected technology',
  hero_title: 'Make room for better tech.',
  hero_description: 'Useful everyday essentials, from personal audio to connected home and wearable technology.',
  hero_image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1400&q=85',
  hero_cta_text: 'Shop the collection',
  offer_title: '10% off with',
  offer_description: 'Enter the code at checkout.',
  offer_coupon_code: 'WELCOME10',
  offer_cta_text: 'Browse products',
  contact_email: 'logicforge.admin@gmail.com',
  contact_phone: '03440418249',
  contact_address: '',
};

export interface Order {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  coupon_code: string | null;
  shipping_address: Address;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  active: number;
  expires_at: string | null;
  min_subtotal: number;
}

export interface Review {
  id: string;
  product_id: string;
  customer_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  customer_id: string;
  product_id: string;
  created_at: string;
}

export interface StoreData {
  settings: StoreSettings;
  categories: Category[];
  products: Product[];
  customers: Customer[];
  orders: Order[];
  order_items: OrderItem[];
  coupons: Coupon[];
  reviews: Review[];
  wishlist: WishlistItem[];
}

export interface CartLine {
  product: Product;
  quantity: number;
}
