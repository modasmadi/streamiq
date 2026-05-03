import React, { useState, useCallback, useMemo, lazy, Suspense } from "react";
import { CONFIG, CATEGORIES } from "./config.js";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { getSearchSuggestions } from "./api/claude.js";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import VideoModal from "./components/VideoModal.jsx";
import AIPanel from "./components/AIPanel.jsx";

// Code splitting للصفحات
const Home = lazy(() => import("./pages/Home.jsx"));
const Search = lazy(() => import("./pages/Search.jsx"));
const Favorites = lazy(() => import("./pages/Favorites.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));

const PageLoader = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh", color: "var(--muted)" }}>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "2rem", marginBottom: 12, animation: "bounce 1s infinite" }}>⏳</div>
      <div>جاري التحميل...</div>
    </div>
  </div>
);

/**
 * التطبيق الرئيسي — يدير التنقل والحالة العامة
 */
export default function App() {
  // الحالة العامة
  const [page, setPage] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [modalVideo, setModalVideo] = useState(null);

  // التخزين المحلي
  const [favorites, setFavorites] = useLocalStorage("streamiq_favorites", []);
  const [history, setHistory] = useLocalStorage("streamiq_history", []);
  const [settings, setSettings] = useLocalStorage("streamiq_settings", {
    ytKey: CONFIG.YOUTUBE_API_KEY,
    aiKey: CONFIG.ANTHROPIC_API_KEY,
  });

  // مفاتيح API
  const ytKey = settings.ytKey || CONFIG.YOUTUBE_API_KEY;
  const aiKey = settings.aiKey || CONFIG.ANTHROPIC_API_KEY;

  // التنقل
  const navigate = useCallback((p) => {
    setPage(p);
    setActiveCategory(null);
    if (p !== "search") setSearchQuery("");
  }, []);

  const selectCategory = useCallback((catId) => {
    const cat = CATEGORIES.find((c) => c.id === catId);
    if (cat) {
      setActiveCategory(catId);
      setSearchQuery(cat.queries[0]);
      setPage("search");
    }
  }, []);

  // البحث
  const handleSearch = useCallback((q) => {
    setSearchQuery(q);
    setPage("search");
  }, []);

  const handleAISearch = useCallback(async (q) => {
    try {
      const suggestions = await getSearchSuggestions(q, aiKey);
      setSearchQuery(suggestions.arabicQuery);
      setPage("search");
    } catch {
      setSearchQuery(q);
      setPage("search");
    }
  }, [aiKey]);

  // المفضلة
  const toggleFav = useCallback((video) => {
    setFavorites((prev) => {
      const exists = prev.find((v) => v.id === video.id);
      if (exists) return prev.filter((v) => v.id !== video.id);
      return [{ ...video, addedAt: new Date().toISOString() }, ...prev];
    });
  }, [setFavorites]);

  const checkFav = useCallback((videoId) => {
    return favorites.some((v) => v.id === videoId);
  }, [favorites]);

  // تشغيل فيديو
  const playVideo = useCallback((video) => {
    setModalVideo(video);
    // إضافة للتاريخ (آخر 50)
    setHistory((prev) => {
      const filtered = prev.filter((v) => v.id !== video.id);
      return [{ ...video, watchedAt: new Date().toISOString() }, ...filtered].slice(0, 50);
    });
  }, [setHistory]);

  // عرض الصفحة الحالية
  const renderPage = () => {
    switch (page) {
      case "search":
        return <Search query={searchQuery} apiKey={ytKey} onPlay={playVideo} onFav={toggleFav} isFav={checkFav} />;
      case "favorites":
        return <Favorites favorites={favorites} onPlay={playVideo} onFav={toggleFav} isFav={checkFav} />;
      case "settings":
        return <Settings settings={settings} onSave={setSettings} />;
      default:
        return <Home apiKey={ytKey} onPlay={playVideo} onFav={toggleFav} isFav={checkFav} history={history} />;
    }
  };

  return (
    <>
      <Sidebar
        activePage={page}
        activeCategory={activeCategory}
        onNavigate={navigate}
        onCategorySelect={selectCategory}
      />

      <div className="main-content">
        <Topbar onSearch={handleSearch} onAISearch={handleAISearch} />
        <Suspense fallback={<PageLoader />}>
          {renderPage()}
        </Suspense>
      </div>

      {/* نافذة الفيديو */}
      {modalVideo && (
        <VideoModal
          video={modalVideo}
          apiKey={ytKey}
          onClose={() => setModalVideo(null)}
          onFav={toggleFav}
          isFav={checkFav(modalVideo.id)}
          onPlay={playVideo}
          isFavCheck={checkFav}
        />
      )}

      {/* المساعد الذكي */}
      <AIPanel apiKey={aiKey} onSearchFromAI={handleSearch} />
    </>
  );
}
