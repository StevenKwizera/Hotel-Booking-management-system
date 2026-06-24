import { useEffect, useState } from "react";

interface HotelImageProps {
  src: string;
  alt: string;
  className?: string;
  overlay?: boolean;
  fallbackSrc?: string;
}

export function HotelImage({
  src,
  alt,
  className = "",
  overlay = false,
  fallbackSrc,
}: HotelImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={currentSrc}
        alt={alt}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => {
          if (fallbackSrc && currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
          }
        }}
      />
      {overlay && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, oklch(0.22 0.06 155 / 0.85) 0%, oklch(0.22 0.06 155 / 0.25) 50%, transparent 100%)",
          }}
        />
      )}
    </div>
  );
}
