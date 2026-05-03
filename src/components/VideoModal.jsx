import React, { useEffect, useState, useCallback } from "react";
import { getVideoDetails } from "../api/youtube.js";
import { searchVideos } from "../api/youtube.js";
import VideoCard from "./VideoCard.jsx";

/**
 * نافذة عرض الفيديو — مشغل YouTube + معلومات + مشابه
 */
export default function VideoModal({ video, apiKey, onClose, onFav, isFav, onPlay, isFavCheck }) {
  const [details, setDetails] = useState(null);
  const [related, setRelated] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // إغلاق بـ Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // جلب التفاصيل والمحتوى المشابه
  useEffect(() => {
    if (!video || !apiKey || apiKey === "YOUR_YOUTUBE_API_KEY") return;

    getVideoDetails(video.id, apiKey)
      .then(setDetails)
      .catch(() => {});

    setLoadingRelated(true);
    const q = video.title.split(" ").slice(0, 3).join(" ");
    searchVideos(q, apiKey, { maxResults: 6 })
      .then((r) => setRelated(r.videos.filter((v) => v.id !== video.id).slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoadingRelated(false));
  }, [video, apiKey]);

  if (!video) return null;

  const d = details || video;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* مشغل YouTube */}
        <div className="modal-player">
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&hl=ar`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            title={video.title}
          />
        </div>

        <div className="modal-body">
          <h2 className="modal-title">{d.title}</h2>
          <div className="modal-channel">{d.channelTitle}</div>

          <div className="modal-stats">
            <div className="modal-stat">👁 {d.viewsFormatted || "—"} مشاهدة</div>
            <div className="modal-stat">👍 {d.likesFormatted || d.likeCount || "—"}</div>
            <div className="modal-stat">⏱ {d.durationFormatted || "—"}</div>
          </div>

          {d.description && (
            <div className="modal-desc">{d.description}</div>
          )}

          <div className="modal-actions">
            <a
              className="modal-btn modal-btn-primary"
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              ▶ مشاهدة على YouTube
            </a>
            <button
              className={`modal-btn modal-btn-secondary ${isFav ? "active" : ""}`}
              onClick={() => onFav(video)}
            >
              {isFav ? "❤️ في المفضلة" : "🤍 إضافة للمفضلة"}
            </button>
            <button
              className="modal-btn modal-btn-secondary"
              onClick={() => {
                navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${video.id}`);
              }}
            >
              📋 نسخ الرابط
            </button>
          </div>

          {/* قسم المحتوى المشابه */}
          {related.length > 0 && (
            <div className="modal-related">
              <h3 className="modal-related-title">قد يعجبك أيضاً</h3>
              <div className="modal-related-grid">
                {related.map((v) => (
                  <VideoCard
                    key={v.id}
                    video={v}
                    onPlay={(vid) => { onPlay(vid); }}
                    onFav={onFav}
                    isFav={isFavCheck ? isFavCheck(v.id) : false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
