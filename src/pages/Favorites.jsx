import React, { useState } from "react";
import VideoCard from "../components/VideoCard.jsx";

/**
 * صفحة المفضلة — عرض وإدارة الفيديوهات المحفوظة
 */
export default function Favorites({ favorites, onPlay, onFav, isFav }) {
  const [sortBy, setSortBy] = useState("date");

  const sorted = [...(favorites || [])].sort((a, b) => {
    if (sortBy === "name") return (a.title || "").localeCompare(b.title || "", "ar");
    return new Date(b.addedAt || b.publishedAt || 0) - new Date(a.addedAt || a.publishedAt || 0);
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">❤️ المفضلة ({sorted.length})</h1>
      </div>

      {sorted.length > 0 && (
        <div className="fav-sort">
          <button className={`filter-btn ${sortBy === "date" ? "active" : ""}`} onClick={() => setSortBy("date")}>
            حسب التاريخ
          </button>
          <button className={`filter-btn ${sortBy === "name" ? "active" : ""}`} onClick={() => setSortBy("name")}>
            حسب الاسم
          </button>
        </div>
      )}

      {sorted.length > 0 ? (
        <div className="fav-grid">
          {sorted.map((v) => (
            <VideoCard key={v.id} video={v} onPlay={onPlay} onFav={onFav} isFav={isFav(v.id)} />
          ))}
        </div>
      ) : (
        <div className="fav-empty">
          <div style={{ fontSize: "4rem", marginBottom: 16 }}>💔</div>
          <div style={{ fontSize: "1.1rem", marginBottom: 8 }}>لم تضف أي فيديو للمفضلة بعد</div>
          <div style={{ fontSize: "0.9rem" }}>اضغط على 🤍 في أي فيديو لإضافته هنا</div>
        </div>
      )}
    </div>
  );
}
