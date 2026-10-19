import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useDatabase } from '../context/DatabaseContext';
import { getDashboardStats, listCategories, listProducts } from '../db/repo';
import type { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import { Loader } from '../components/Loader';

const categoryImages: Record<string, string> = {
  audio: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  wearables: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  home: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
  accessories: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
};

export const Home: React.FC = () => {
  const { db, ready } = useDatabase();
  if (!ready || !db) return <Loader />;

  const categories = listCategories(db);
  const activeProducts = listProducts(db, { activeOnly: true });
  const featured = listProducts(db, { activeOnly: true, sort: 'rating' }).slice(0, 4);
  const newArrivals = [...activeProducts].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 4);
  const stats = getDashboardStats(db);
  const topSellers = stats.topProducts
    .map((item) => activeProducts.find((product) => product.name === item.name))
    .filter((product) => product !== undefined)
    .slice(0, 4);
  const settings = db.settings;
  const offer = db.coupons.find((coupon) =>
    coupon.code === settings.offer_coupon_code &&
    coupon.active &&
    (!coupon.expires_at || new Date(coupon.expires_at) > new Date())
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  return (
    <div>
      <section className="overflow-hidden bg-[#eef3f8]">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 md:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-20">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <span className="lf-eyebrow">{settings.hero_eyebrow}</span>
            <h1 className="max-w-xl whitespace-pre-line font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-brand-950 sm:text-5xl lg:text-6xl">
              {settings.hero_title}
            </h1>
            <p className="mt-5 max-w-lg whitespace-pre-line text-base leading-7 text-gray-600 sm:text-lg">
              {settings.hero_description}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/shop" className="lf-button-primary px-6">{settings.hero_cta_text} <span aria-hidden="true" className="ml-2">→</span></Link>
              <a href="#categories" className="lf-button-secondary px-6">Explore categories</a>
            </div>
            <p className="mt-6 text-xs font-medium text-gray-500">Explore products, check live availability, and manage orders in your account.</p>
          </motion.div>
          <div className="relative min-h-64 sm:min-h-80">
            <div className="absolute -right-10 top-0 h-56 w-56 rounded-full bg-brand-100 sm:h-72 sm:w-72" />
            <img
              src={settings.hero_image_url}
              alt="A curated selection of modern electronic devices"
              className="relative z-10 h-64 w-full rounded-3xl object-cover shadow-xl sm:h-80 lg:h-[390px]"
            />
            <div className="absolute -bottom-3 left-3 z-20 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-lg sm:bottom-5 sm:left-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">The Logic Forge edit</p>
              <p className="mt-1 font-display text-sm font-bold text-brand-950">Technology for everyday life</p>
            </div>
          </div>
        </div>
      </section>

      <section id="categories" className="lf-page scroll-mt-36">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <div className="lf-section-heading">
            <div><span className="lf-eyebrow">Browse by interest</span><h2 className="font-display text-2xl font-extrabold text-brand-950 sm:text-3xl">Find your category</h2></div>
            <Link to="/shop" className="hidden text-sm font-semibold text-brand-700 hover:text-brand-900 sm:inline">Shop all products <span aria-hidden="true">→</span></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {categories.map((category) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: categories.indexOf(category) * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Link to={`/shop?category=${category.id}`} className="group relative aspect-[1.12] overflow-hidden rounded-2xl bg-brand-100 sm:aspect-[1.15]">
                  <img
                    src={categoryImages[category.slug] || 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80'}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-950/85 via-brand-950/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
                    <h3 className="font-display text-base font-bold sm:text-xl">{category.name}</h3>
                    <p className="mt-1 line-clamp-1 text-xs text-white/75">{category.description}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {offer && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-5 rounded-3xl bg-brand-950 px-6 py-7 text-white sm:flex-row sm:items-center sm:px-10 sm:py-9">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Available offer</span>
              <h2 className="mt-2 font-display text-xl font-extrabold sm:text-2xl">{settings.offer_title} <span className="whitespace-nowrap">{offer.code}</span></h2>
              <p className="mt-1 whitespace-pre-line text-sm text-blue-100">{settings.offer_description}</p>
            </div>
            <Link to="/shop" className="inline-flex min-h-11 items-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-950 transition hover:bg-blue-50">{settings.offer_cta_text} <span aria-hidden="true" className="ml-2">→</span></Link>
          </div>
        </section>
      )}

      <section className="lf-page">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <div className="lf-section-heading">
            <div><span className="lf-eyebrow">Picked from the collection</span><h2 className="font-display text-2xl font-extrabold text-brand-950 sm:text-3xl">Featured technology</h2></div>
            <Link to="/shop" className="text-sm font-semibold text-brand-700 hover:text-brand-900">View all <span aria-hidden="true">→</span></Link>
          </div>
          {featured.length ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4"
            >
              {featured.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: featured.indexOf(product) * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <ProductCard product={product} onProductClick={handleProductClick} />
                </motion.div>
              ))}
            </motion.div>
          ) : <p className="lf-panel p-6 text-sm text-gray-500">Products will appear here as they are added to the catalog.</p>}
        </motion.div>
      </section>

      <section className="border-y border-gray-100 bg-white">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }} className="lf-page !py-9 sm:!py-12">
          <div className="lf-section-heading">
            <div><span className="lf-eyebrow">Recently added</span><h2 className="font-display text-2xl font-extrabold text-brand-950 sm:text-3xl">New arrivals</h2></div>
            <Link to="/shop?sort=newest" className="text-sm font-semibold text-brand-700 hover:text-brand-900">See what’s new <span aria-hidden="true">→</span></Link>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4"
          >
            {newArrivals.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: newArrivals.indexOf(product) * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <ProductCard product={product} onProductClick={handleProductClick} />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {topSellers.length > 0 && (
        <section className="lf-page">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
            <div className="lf-section-heading">
              <div><span className="lf-eyebrow">Based on completed store orders</span><h2 className="font-display text-2xl font-extrabold text-brand-950 sm:text-3xl">Customer favorites</h2></div>
              <Link to="/shop" className="text-sm font-semibold text-brand-700 hover:text-brand-900">Shop the collection <span aria-hidden="true">→</span></Link>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4"
            >
              {topSellers.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: topSellers.indexOf(product) * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <ProductCard product={product} onProductClick={handleProductClick} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-px overflow-hidden rounded-3xl border border-gray-100 bg-gray-100 sm:grid-cols-3">
          {[
            { title: 'Curated catalog', body: 'Browse a focused selection of electronics and accessories.' },
            { title: 'Live availability', body: 'Product stock is reflected in the store catalog.' },
            { title: 'Your account, your orders', body: 'Sign in to see your order history and saved wishlist.' },
          ].map((item) => (
            <div key={item.title} className="bg-white p-5 sm:p-7">
              <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-800"><svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m5 12 4 4L19 6" /></svg></span>
              <h3 className="font-display font-bold text-brand-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {selectedProduct && modalOpen && (
        <ProductDetailsModal
          product={selectedProduct}
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
};
