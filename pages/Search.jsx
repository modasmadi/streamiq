import React, { useState, useEffect, useCallback } from "react";
import { searchVideos } from "../api/youtube.js";
import VideoCard from "../components/VideoCard.jsx";
import SkeletonLoader from "../components/SkeletonLoader.jsx";

const FILTERS = [
  { key: "relevance", label: "الأكثر صلة" },
  { key: "viewCount", label: "الأكثر مشاهدة" },
  { key: "date", label: "الأحدث" },
];
const DURATION_FILTERS = [
  { key: "any", label: "الكل" },
  { key: "medium", label: "متوسط (4-20 د)" },
  { key: "long", label: "طويل (+20 د)" },
];

/**
 * صفحة البحث — نتائج + فلاتر + تحميل المزيد
 */
export default function Search({ query, apiKey, onPlay, onFav, isFav }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState("relevance");
  const [duration, setDuration] = useState("any");
  const [nextToken, setNextToken] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const doSearch = useCallback(async (reset = true) => {
    if (!query || !apiKey || apiKey === "YOUR_YOUTUBE_API_KEY") return;
    if (reset) { setLoading(true); setVideos([]); }
    else setLoadingMore(true);

    try {
      const r = await searchVideos(query, apiKey, {
        maxResults: 20, order, videoDuration: duration,
        pageToken: reset ? "" : (nextToken || ""),
      });
      if (reset) setVideos(r.videos);
      else setVideos((p) => [...p, ...r.videos]);
      setNextToken(r.nextPageToken);
    } catch {}
    setLoading(false);
    setLoadingMore(false);
  }, [query, apiKey, order, duration, nextToken]);

  useEffect(() => { doSearch(true); }, [query, apiKey, order, duration]);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🔍 نتائج البحث: {query}</h1>
      </div>

      <div className="search-filters">
        {FILTERS.map((f) => (
          <button key={f.key} className={`filter-btn ${order === f.key ? "active" : ""}`} onClick={() => setOrder(f.key)}>
            {f.label}
          </button>
        ))}
        <span style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />
        {DURATION_FILTERS.map((f) => (
          <button key={f.key} className={`filter-btn ${duration === f.key ? "active" : ""}`} onClick={() => setDuration(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="search-grid"><SkeletonLoader count={20} /></div>
      ) : videos.length > 0 ? (
        <>
          <div className="search-grid">
            {videos.map((v) => (
              <VideoCard key={v.id} video={v} onPlay={onPlay} onFav={onFav} isFav={isFav(v.id)} />
            ))}
          </div>
          {nextToken && (
            <div style={{ textAlign: "center", padding: "30px" }}>
              <button className="btn-play" onClick={() => doSearch(false)} disabled={loadingMore}>
                {loadingMore ? "جاري التحميل..." : "تحميل المزيد"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <div className="no-results-text">لا توجد نتائج لـ "{query}"</div>
          <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>جرب كلمات بحث مختلفة أو استخدم البحث الذكي</div>
        </div>
      )}
    </div>
  );
}
