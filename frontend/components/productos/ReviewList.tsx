"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import StarRating from "@/components/ui/StarRating";
import ReviewForm from "./ReviewForm";
import { Trash2 } from "lucide-react";

interface Review {
  id: number;
  product_id: number;
  buyer_id: number;
  buyer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface Summary {
  average: number;
  count: number;
  distribution: Record<number, number>;
}

interface Props {
  productId: number;
  canReview: boolean;
}

export default function ReviewList({ productId, canReview }: Props) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [reviewsRes, summaryRes] = await Promise.all([
      api.get(`/reviews/product/${productId}`),
      api.get(`/reviews/product/${productId}/summary`),
    ]);
    setReviews(reviewsRes.data);
    setSummary(summaryRes.data);

    if (user) {
      try {
        const { data } = await api.get(`/reviews/my-review/${productId}`);
        setMyReview(data);
      } catch {
        setMyReview(null);
      }
    }
    setLoading(false);
  }, [productId, user]);

  useEffect(() => { load(); }, [load]);

  const deleteReview = async (reviewId: number) => {
    if (!confirm("¿Eliminar tu reseña?")) return;
    await api.delete(`/reviews/${reviewId}`);
    load();
  };

  if (loading) return null;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-900">
        Reseñas {summary && summary.count > 0 ? `(${summary.count})` : ""}
      </h2>

      {/* Resumen de puntuaciones */}
      {summary && summary.count > 0 && (
        <div className="card p-5 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="text-center">
            <p className="text-5xl font-bold text-yellow-500">{summary.average}</p>
            <StarRating value={summary.average} size={20} />
            <p className="text-sm text-gray-500 mt-1">{summary.count} reseñas</p>
          </div>

          <div className="flex-1 w-full space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution[star] || 0;
              const pct = summary.count > 0 ? Math.round((count / summary.count) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 w-4 text-right">{star}</span>
                  <span className="text-yellow-400 text-xs">★</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-gray-400 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Formulario para nueva reseña */}
      {canReview && !myReview && user && (
        <ReviewForm productId={productId} onCreated={load} />
      )}

      {/* Lista de reseñas */}
      {reviews.length === 0 ? (
        <p className="text-gray-400 text-sm py-4">
          {canReview
            ? "Sé el primero en reseñar este producto."
            : "Este producto aún no tiene reseñas."}
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-800">{review.buyer_name}</p>
                    <StarRating value={review.rating} size={14} />
                    <span className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString("es-AR", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-600 text-sm mt-2 leading-relaxed">{review.comment}</p>
                  )}
                </div>
                {user && (user.id === review.buyer_id || user.role === "admin") && (
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                    title="Eliminar reseña"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
