import React, { useState } from 'react';
import type { Product } from '../types';

const imageForProduct = (product: Product): string => {
  const name = product.name.toLowerCase();
  if (name.includes('headphone')) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85';
  if (name.includes('speaker')) return 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1000&q=85';
  if (name.includes('earbud')) return 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1000&q=85';
  if (name.includes('watch') || name.includes('ring') || name.includes('tracker')) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=85';
  if (name.includes('bulb') || name.includes('thermostat')) return 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1000&q=85';
  if (name.includes('vacuum')) return 'https://images.unsplash.com/photo-1558317374-067fb5f2a0ba?auto=format&fit=crop&w=1000&q=85';
  if (name.includes('cable')) return 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=1000&q=85';
  if (name.includes('sleeve')) return 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=85';
  if (name.includes('backpack')) return 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=85';
  return product.image_url;
};

const ProductImage: React.FC<{ product: Product; className?: string }> = ({ product, className = '' }) => {
  const [failed, setFailed] = useState(false);
  const imageUrl = product.image_url.includes('picsum.photos') ? imageForProduct(product) : product.image_url;

  if (failed) {
    return (
      <div role="img" aria-label={product.name} className={`flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 p-6 text-center ${className}`}>
        <span className="font-display text-lg font-bold text-brand-800">{product.name}</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={product.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export default ProductImage;
