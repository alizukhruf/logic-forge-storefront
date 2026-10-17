import React from 'react';
import { motion } from 'motion/react';

export const Loader: React.FC<{ label?: string }> = ({ label = 'Loading store…' }) => (
  <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
    <motion.div
      className="h-10 w-10 rounded-full border-4 border-brand-100 border-t-brand-600"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
    />
    <p className="text-sm text-gray-500">{label}</p>
  </div>
);
