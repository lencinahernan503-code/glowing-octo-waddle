"use client";
import { useEffect } from "react";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface Props {
  productId: number;
  size?: number;
  className?: string;
}

export default function FavoriteButton({ productId, size = 18, className = "" }: Props) {
  const { user } = useAuth();
  const { load, toggle, isFav } = useFavorites();
  const router = useRouter();
  const fav = isFav(productId);

  useEffect(() => { if (user) load(); }, [user, load]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { router.push("/auth/login"); return; }
    await toggle(productId);
  };

  return (
    <button
      onClick={handleClick}
      className={`transition-colors ${fav ? "text-red-500" : "text-gray-300 hover:text-red-400"} ${className}`}
      title={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      <Heart size={size} fill={fav ? "currentColor" : "none"} />
    </button>
  );
}
