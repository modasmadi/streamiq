import React from "react";

/**
 * قسم Hero — العرض الرئيسي للمحتوى المميز
 */
export default function Hero({ video, onPlay, onFav, isFav }) {
  if (!video) {
    return (
      <div className="hero">
        <div className="hero-grid" />
        <div className="hero-content">
          <div className="hero-badge">✨ مرحباً بك في StreamIQ</div>
          <h1 className="hero-title">شاهد المحتوى العربي المجاني</h1>
          <p className="hero-desc">
            أفلام، مسلسلات، أنمي — كل شيء في مكان واحد. محتوى قانوني 100% من YouTube.
            ابدأ بإدخال مفتاح YouTube API في الإعدادات.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="hero">
      <div
        className="hero-bg"
        style={{ backgroundImage: `url(${video.thumbnail})` }}
      />
      <div className="hero-grid" />
      <div className="hero-content">
        <div className="hero-badge">⭐ محتوى مميز</div>
        <h1 className="hero-title">{video.title}</h1>
        <p className="hero-desc">{video.description}</p>
        <div className="hero-actions">
          <button className="btn-play" onClick={() => onPlay(video)} id="hero-play-btn">
            ▶ تشغيل الآن
          </button>
          <button
            className={`btn-fav ${isFav ? "active" : ""}`}
            onClick={() => onFav(video)}
            id="hero-fav-btn"
          >
            {isFav ? "❤️" : "🤍"} {isFav ? "في المفضلة" : "إضافة للمفضلة"}
          </button>
        </div>
      </div>
    </div>
  );
}
