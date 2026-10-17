import React from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { deleteReview, listAdminReviews } from '../../db/repo';
import { StarRating } from '../../components/StarRating';
import { Loader } from '../../components/Loader';

export const AdminReviews: React.FC = () => {
  const { db, ready, refresh } = useDatabase();
  const [error, setError] = React.useState('');
  if (!ready || !db) return <Loader />;

  const reviews = listAdminReviews(db);

  const remove = async (id: string) => {
    if (!confirm('Remove this review from the store?')) return;
    setError('');
    try {
      await deleteReview(db, id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the review.');
    }
  };

  return (
    <div>
      <div className="admin-page-heading">
        <div><span className="lf-eyebrow">Customer feedback</span><h1 className="admin-page-title">Reviews</h1><p className="admin-page-description">Read and moderate product reviews.</p></div>
        <span className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-800">{reviews.length} total</span>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {reviews.length === 0 ? (
        <div className="lf-panel px-5 py-10 text-center"><p className="text-sm text-gray-500">No reviews yet.</p></div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <article key={r.id} className="lf-panel p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-brand-950">{r.product_name}</p>
                  <p className="mt-1 text-xs text-gray-500">Reviewed by {r.customer_name} · {new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StarRating rating={r.rating} size={14} />
                  <button aria-label={`Remove review by ${r.customer_name}`} onClick={() => { void remove(r.id); }} className="lf-button-secondary min-h-9 px-3 py-1 text-red-700 hover:border-red-200 hover:text-red-800">
                    Remove
                  </button>
                </div>
              </div>
              {r.comment && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">{r.comment}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
