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
  role: 'customer' | 'admin';
  created_at: string;
}

export interface Address {
  line1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

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
