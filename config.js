// ═══════════════════════════════════════
// StreamIQ — ملف الإعدادات الرئيسي
// ═══════════════════════════════════════

export const CONFIG = {
  YOUTUBE_API_KEY: import.meta.env.VITE_YOUTUBE_API_KEY || "YOUR_YOUTUBE_API_KEY",
  ANTHROPIC_API_KEY: import.meta.env.VITE_ANTHROPIC_API_KEY || "YOUR_ANTHROPIC_API_KEY",
  APP_NAME: "StreamIQ",
  APP_VERSION: "1.0.0",
};

export const CATEGORIES = [
  {
    id: "arabic_movies",
    label: "أفلام عربية",
    icon: "🎬",
    queries: [
      "فيلم عربي كامل 2024",
      "أفلام مصرية كاملة",
      "أفلام خليجية كاملة",
      "Arabic full movie",
    ],
  },
  {
    id: "arabic_series",
    label: "مسلسلات عربية",
    icon: "📺",
    queries: [
      "مسلسل عربي كامل",
      "مسلسلات رمضان 2024",
      "Arabic series full episodes",
    ],
  },
  {
    id: "anime_dubbed",
    label: "أنمي مدبلج",
    icon: "⚡",
    queries: [
      "انمي مدبلج عربي كامل",
      "انمي عربي الموسم كامل",
    ],
  },
  {
    id: "anime_sub",
    label: "أنمي مترجم",
    icon: "🌸",
    queries: [
      "انمي مترجم عربي كامل الحلقات",
      "anime arabic sub full season",
    ],
  },
  {
    id: "documentaries",
    label: "وثائقيات",
    icon: "🌍",
    queries: [
      "وثائقي عربي كامل",
      "وثائقيات مترجمة عربي",
    ],
  },
  {
    id: "kids",
    label: "أطفال",
    icon: "🧸",
    queries: [
      "كرتون عربي كامل",
      "قصص أطفال عربي",
      "رسوم متحركة عربية",
    ],
  },
  {
    id: "comedy",
    label: "كوميديا",
    icon: "😂",
    queries: [
      "برامج كوميديا عربية",
      "stand up comedy عربي",
    ],
  },
  {
    id: "horror",
    label: "رعب",
    icon: "👻",
    queries: [
      "أفلام رعب مترجمة عربي كاملة",
      "horror movies arabic full",
    ],
  },
];
