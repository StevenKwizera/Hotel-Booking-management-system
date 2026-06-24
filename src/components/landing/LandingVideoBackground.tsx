import { useEffect, useRef, useState } from "react";
import { HOTEL_IMAGES } from "@/lib/hotel-images";

type LandingVideoBackgroundProps = {
  src: string;
  poster?: string;
};

export function LandingVideoBackground({
  src,
  poster = HOTEL_IMAGES.landing,
}: LandingVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || useFallback) return;

    const play = () => {
      video.play().catch(() => setUseFallback(true));
    };

    video.addEventListener("canplay", play);
    play();

    return () => video.removeEventListener("canplay", play);
  }, [useFallback]);

  if (useFallback) {
    return (
      <img
        src={poster}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      poster={poster}
      preload="auto"
      onError={() => setUseFallback(true)}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
