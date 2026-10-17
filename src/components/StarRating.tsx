import React from 'react';

export const StarRating: React.FC<{ rating: number; count?: number; size?: number }> = ({
  rating,
  count,
  size = 16,
}) => {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <div className="flex items-center gap-1" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= rounded;
          const half = !filled && i - 0.5 === rounded;
          return (
            <svg
              key={i}
              width={size}
              height={size}
              viewBox="0 0 20 20"
              className={filled || half ? 'text-amber-400' : 'text-gray-300'}
              fill={filled ? 'currentColor' : half ? 'url(#half)' : 'none'}
              stroke="currentColor"
              strokeWidth={filled ? 0 : 1}
            >
              {half && (
                <defs>
                  <linearGradient id="half">
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              )}
              <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L10 14.9l-5.2 2.8 1-5.9L1.5 7.7l5.9-.8L10 1.5z" />
            </svg>
          );
        })}
      </div>
      {count != null && <span className="text-xs text-gray-500">({count})</span>}
    </div>
  );
};
