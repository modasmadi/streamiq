import React, { useRef } from "react";
import VideoCard from "./VideoCard.jsx";
import SkeletonLoader from "./SkeletonLoader.jsx";

/**
 * صف أفقي لعرض فيديوهات فئة معينة
 */
export default function CategoryRow({ title, icon, videos, loading, onPlay, onFav, isFav }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = dir === "left" ? -400 : 400;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <div className="cat-row">
      <div className="cat-header">
        <div className="cat-title">
          <span className="cat-title-icon">{icon}</span>
          {title}
          {videos && <span className="cat-count">({videos.length})</span>}
        </div>
      </div>

      <div className="cat-scroll-wrap">
        <button className="cat-arrow cat-arrow-right" onClick={() => scroll("right")}>
          ←
        </button>

        <div className="cat-scroll" ref={scrollRef}>
          {loading ? (
            <SkeletonLoader count={8} />
          ) : videos && videos.length > 0 ? (
            videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onPlay={onPlay}
                onFav={onFav}
                isFav={isFav(video.id)}
              />
            ))
          ) : (
            <div style={{ padding: "20px", color: "var(--muted)", fontSize: "0.9rem" }}>
              لا توجد نتائج
            </div>
          )}
        </div>

        <button className="cat-arrow cat-arrow-left" onClick={() => scroll("left")}>
          →
        </button>
      </div>
    </div>
  );
}
