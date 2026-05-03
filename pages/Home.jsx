import React, { useEffect, useState, useCallback } from "react";
import { CATEGORIES } from "../config.js";
import { searchVideos, getTrending } from "../api/youtube.js";
import Hero from "../components/Hero.jsx";
import CategoryRow from "../components/CategoryRow.jsx";

/**
 * الصفحة الرئيسية — Hero + Trending + فئات المحتوى
 */
export default function Home({ apiKey, onPlay, onFav, isFav, history }) {
  const [trending, setTrending] = useState([]);
  const [catData, setCatData] = useState({});
  const [catLoading, setCatLoading] = useState({});
  const [heroVideo, setHeroVideo] = useState(null);
  const [loadedCats, setLoadedCats] = useState(new Set());

  // جلب البيانات مع الكاش
  const getCached = useCallback((key) => {
    try {
      const raw = localStorage.getItem(`cache_${key}`);
      if (!raw) return null;
      const { data, timestamp } = JSON.parse(raw);
      if (Date.now() - timestamp > 3600000) { localStorage.removeItem(`cache_${key}`); return null; }
      return data;
    } catch { return null; }
  }, []);

  const setCache = useCallback((key, data) => {
    try { localStorage.setItem(`cache_${key}`, JSON.stringify({ data, timestamp: Date.now() })); }
    catch {}
  }, []);

  // جلب الترندنج
  useEffect(() => {
    if (!apiKey || apiKey === "YOUR_YOUTUBE_API_KEY") return;
    const cached = getCached("trending");
    if (cached) { setTrending(cached); setHeroVideo(cached[Math.floor(Math.random() * Math.min(5, cached.length))]); return; }
    getTrending(apiKey).then((vids) => {
      setTrending(vids);
      setCache("trending", vids);
      if (vids.length) setHeroVideo(vids[Math.floor(Math.random() * Math.min(5, vids.length))]);
    }).catch(() => {});
  }, [apiKey]);

  // جلب فئة واحدة
  const loadCategory = useCallback(async (cat) => {
    if (loadedCats.has(cat.id)) return;
    const cached = getCached(`cat_${cat.id}`);
    if (cached) { setCatData((p) => ({ ...p, [cat.id]: cached })); setLoadedCats((p) => new Set(p).add(cat.id)); return; }
    setCatLoading((p) => ({ ...p, [cat.id]: true }));
    try {
      const q = cat.queries[Math.floor(Math.random() * cat.queries.length)];
      const r = await searchVideos(q, apiKey, { maxResults: 20 });
      setCatData((p) => ({ ...p, [cat.id]: r.videos }));
      setCache(`cat_${cat.id}`, r.videos);
      setLoadedCats((p) => new Set(p).add(cat.id));
    } catch {}
    setCatLoading((p) => ({ ...p, [cat.id]: false }));
  }, [apiKey, loadedCats, getCached, setCache]);

  // تحميل أول 3 فئات
  useEffect(() => {
    if (!apiKey || apiKey === "YOUR_YOUTUBE_API_KEY") return;
    CATEGORIES.slice(0, 3).forEach((c) => loadCategory(c));
  }, [apiKey]);

  // Lazy load باقي الفئات عند التمرير
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const catId = entry.target.dataset.catid;
          const cat = CATEGORIES.find((c) => c.id === catId);
          if (cat) loadCategory(cat);
        }
      });
    }, { rootMargin: "200px" });

    document.querySelectorAll("[data-catid]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [loadCategory]);

  // سجل المشاهدة
  const recentHistory = (history || []).slice(0, 20);

  return (
    <div className="page">
      <Hero video={heroVideo} onPlay={onPlay} onFav={onFav} isFav={heroVideo ? isFav(heroVideo.id) : false} />

      {/* يُشاهد الآن */}
      <CategoryRow
        title="يُشاهد الآن 🔥"
        icon=""
        videos={trending}
        loading={!trending.length && apiKey && apiKey !== "YOUR_YOUTUBE_API_KEY"}
        onPlay={onPlay}
        onFav={onFav}
        isFav={isFav}
      />

      {/* أكمل المشاهدة */}
      {recentHistory.length > 0 && (
        <CategoryRow
          title="أكمل المشاهدة"
          icon="🕐"
          videos={recentHistory}
          loading={false}
          onPlay={onPlay}
          onFav={onFav}
          isFav={isFav}
        />
      )}

      {/* فئات المحتوى */}
      {CATEGORIES.map((cat) => (
        <div key={cat.id} data-catid={cat.id}>
          <CategoryRow
            title={cat.label}
            icon={cat.icon}
            videos={catData[cat.id] || []}
            loading={catLoading[cat.id]}
            onPlay={onPlay}
            onFav={onFav}
            isFav={isFav}
          />
        </div>
      ))}
    </div>
  );
}
