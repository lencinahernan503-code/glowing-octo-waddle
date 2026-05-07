"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import StarRating from "@/components/ui/StarRating";

interface Props {
  productId: number;
  onCreated: () => void;
}

export default function ReviewForm({ productId, onCreated }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError("Seleccioná una puntuación"); return; }
    setLoading(true);
    setError("");
    try {
      await api.post("/reviews", { product_id: productId, rating, comment: comment || null });
      setRating(0);
      setComment("");
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al enviar la reseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-3">
      <h3 className="font-semibold text-gray-800">Dejar una reseña</h3>

      <div>
        <p className="text-sm text-gray-500 mb-1">Tu puntuación</p>
        <StarRating value={rating} interactive onChange={setRating} size={28} />
      </div>

      <div>
        <label className="text-sm text-gray-500">Comentario (opcional)</label>
        <textarea
          className="input mt-1 h-24 resize-none"
          placeholder="Contá tu experiencia con este producto..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
        />
        <p className="text-xs text-gray-400 text-right mt-0.5">{comment.length}/500</p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button type="submit" disabled={loading || rating === 0} className="btn-primary text-sm">
        {loading ? "Enviando..." : "Publicar reseña"}
      </button>
    </form>
  );
}
