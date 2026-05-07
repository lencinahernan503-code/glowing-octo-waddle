"use client";
import { useState } from "react";

interface Props {
  value: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
}

export default function StarRating({ value, max = 5, size = 20, interactive = false, onChange }: Props) {
  const [hovered, setHovered] = useState(0);

  const display = hovered || value;

  return (
    <div className="flex items-center gap-0.5" role={interactive ? "radiogroup" : undefined}>
      {Array.from({ length: max }).map((_, i) => {
        const star = i + 1;
        const filled = display >= star;
        const half = !filled && display >= star - 0.5;

        return (
          <span
            key={star}
            role={interactive ? "radio" : undefined}
            aria-checked={interactive ? value === star : undefined}
            style={{ fontSize: size, lineHeight: 1, cursor: interactive ? "pointer" : "default" }}
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => interactive && setHovered(0)}
            onClick={() => interactive && onChange?.(star)}
            className="select-none"
          >
            {filled ? (
              <span className="text-yellow-400">★</span>
            ) : half ? (
              <span className="text-yellow-400">⯨</span>
            ) : (
              <span className="text-gray-300">★</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
