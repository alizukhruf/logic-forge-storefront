import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Loader } from './components/Loader';
import { RequireAuth, RequireAdmin } from './components/ProtectedRoute';
import { AdminLayout } from './components/AdminLayout';
import { useDatabase } from './context/DatabaseContext';

import { Home } from './pages/Home';
import { ProductList } from './pages/ProductList';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Account } from './pages/Account';
import { Wishlist } from './pages/Wishlist';

import { Dashboard } from './pages/admin/Dashboard';
import { AdminProducts } from './pages/admin/Products';
import { AdminCategories } from './pages/admin/Categories';
import { AdminInventory } from './pages/admin/Inventory';
import { AdminOrders } from './pages/admin/Orders';
import { AdminCustomers } from './pages/admin/Customers';
import { AdminCoupons } from './pages/admin/Coupons';
import { AdminReviews } from './pages/admin/Reviews';

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
    {children}
  </motion.div>
);

const App: React.FC = () => {
  const { ready, error } = useDatabase();
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      {error ? (
        <motion.div
          key="store-error"
          className="flex min-h-screen items-center justify-center bg-gray-50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div role="alert" className="lf-panel max-w-lg p-8 text-center">
            <span className="lf-eyebrow">Logic Forge</span>
            <h1 className="font-display text-2xl font-extrabold text-brand-950">We couldn’t connect to the store</h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">{error}</p>
            <button onClick={() => window.location.reload()} className="lf-button-primary mt-5">Try again</button>
          </div>
        </motion.div>
      ) : !ready ? (
        <motion.div
          key="store-loader"
          className="min-h-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <Loader variant="screen" />
        </motion.div>
      ) : (
        <motion.div
          key="store"
          className="flex min-h-screen flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <Navbar />
          <main className="flex-1">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageTransition><Home /></PageTransition>} />
                <Route path="/shop" element={<PageTransition><ProductList /></PageTransition>} />
                <Route path="/product/:slug" element={<PageTransition><ProductDetail /></PageTransition>} />
                <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
                <Route path="/checkout" element={<PageTransition><Checkout /></PageTransition>} />
                <Route path="/order-confirmation/:orderId" element={<PageTransition><OrderConfirmation /></PageTransition>} />
                <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
                <Route path="/account" element={<RequireAuth><PageTransition><Account /></PageTransition></RequireAuth>} />
                <Route path="/wishlist" element={<RequireAuth><PageTransition><Wishlist /></PageTransition></RequireAuth>} />

                <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                  <Route index element={<Dashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="inventory" element={<AdminInventory />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="reviews" element={<AdminReviews />} />
                </Route>

                <Route path="*" element={<PageTransition><div className="lf-page"><div className="lf-panel mx-auto max-w-lg px-6 py-12 text-center"><span className="lf-eyebrow">404 error</span><h1 className="font-display text-2xl font-bold text-brand-950">Page not found</h1><p className="mt-2 text-sm text-gray-500">This page doesn’t exist or may have moved.</p><a href="/" className="lf-button-primary mt-5">Back to home</a></div></div></PageTransition>} />
              </Routes>
            </AnimatePresence>
          </main>
          <Footer />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default App;
