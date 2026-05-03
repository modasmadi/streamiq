import React, { useState, useRef, useEffect } from "react";

/**
 * شريط البحث العلوي
 */
export default function Topbar({ onSearch, onAISearch }) {
  const [query, setQuery] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const timerRef = useRef(null);

  // Debounce البحث
  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    if (val.trim().length > 2) {
      timerRef.current = setTimeout(() => setShowDrop(true), 500);
    } else {
      setShowDrop(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowDrop(false);
    }
  };

  const handleAI = () => {
    if (query.trim()) {
      onAISearch(query.trim());
      setShowDrop(false);
    }
  };

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const close = () => setShowDrop(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  return (
    <div className="topbar">
      <form className="search-wrap" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <input
          className="search-input"
          type="text"
          placeholder="ابحث عن أفلام، مسلسلات، أنمي..."
          value={query}
          onChange={handleChange}
          id="main-search"
        />
        <span className="search-icon">🔍</span>

        {showDrop && query.trim() && (
          <div className="search-dropdown">
            <div className="search-dropdown-item" onClick={handleSubmit}>
              🔍 بحث عن: {query}
            </div>
            <div className="search-dropdown-item" onClick={handleAI}>
              🤖 بحث ذكي بالذكاء الاصطناعي: {query}
            </div>
            <div className="search-dropdown-item" onClick={() => { onSearch(query + " فيلم كامل"); setShowDrop(false); }}>
              🎬 {query} — فيلم كامل
            </div>
            <div className="search-dropdown-item" onClick={() => { onSearch(query + " مسلسل كامل"); setShowDrop(false); }}>
              📺 {query} — مسلسل كامل
            </div>
          </div>
        )}
      </form>

      <button className="ai-search-btn" onClick={handleAI} id="ai-search-btn">
        🤖 بحث ذكي
      </button>
    </div>
  );
}
