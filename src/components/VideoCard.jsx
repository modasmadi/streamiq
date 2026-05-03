import React, { useMemo } from "react";

/**
 * بطاقة فيديو — تعرض الصورة المصغرة والمعلومات
 */
export default function VideoCard({ video, onPlay, onFav, isFav }) {
  // تحقق إذا الفيديو جديد (أقل من 7 أيام)
  const isNew = useMemo(() => {
    if (!video.publishedAt) return false;
    const diff = Date.now() - new Date(video.publishedAt).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  }, [video.publishedAt]);

  return (
    <div className="vcard" onClick={() => onPlay(video)}>
      <div className="vcard-thumb-wrap">
        <img
          className="vcard-thumb"
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
        />
        {video.durationFormatted && (
          <span className="vcard-dur">{video.durationFormatted}</span>
        )}
        {isNew && <span className="vcard-new">جديد</span>}
        <button
          className={`vcard-fav-btn ${isFav ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onFav(video);
          }}
          title={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
        >
          {isFav ? "❤️" : "🤍"}
        </button>
      </div>
      <div className="vcard-info">
        <div className="vcard-title">{video.title}</div>
        <div className="vcard-meta">
          <span>{video.channelTitle}</span>
          {video.viewsFormatted && (
            <>
              <span>•</span>
              <span>{video.viewsFormatted} مشاهدة</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
