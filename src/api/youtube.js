// ═══════════════════════════════════════
// StreamIQ — YouTube API Layer
// جميع استدعاءات YouTube Data API v3
// ═══════════════════════════════════════

const BASE_URL = "https://www.googleapis.com/youtube/v3";

/**
 * تحويل مدة ISO 8601 إلى ثوانٍ
 * مثال: PT1H30M15S → 5415
 */
function parseDurationToSeconds(iso) {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || 0);
  const m = parseInt(match[2] || 0);
  const s = parseInt(match[3] || 0);
  return h * 3600 + m * 60 + s;
}

/**
 * تحويل مدة ISO 8601 إلى صيغة مقروءة
 * مثال: PT1H30M15S → "1:30:15"
 */
export function formatDuration(isoDuration) {
  if (!isoDuration) return "0:00";
  const totalSec = parseDurationToSeconds(isoDuration);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * تحويل عدد المشاهدات إلى صيغة مختصرة
 * مثال: 1500000 → "1.5M"
 */
export function formatViews(count) {
  if (!count) return "0";
  const num = typeof count === "string" ? parseInt(count) : count;
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}

/**
 * البحث عن فيديوهات في YouTube
 * يقوم بتصفية الـ Shorts تلقائياً (أقل من 60 ثانية)
 */
export async function searchVideos(query, apiKey, options = {}) {
  const {
    maxResults = 20,
    order = "relevance",
    videoDuration = "any",
    pageToken = "",
  } = options;

  if (!apiKey || apiKey === "YOUR_YOUTUBE_API_KEY") {
    throw new Error("يرجى إدخال مفتاح YouTube API في الإعدادات");
  }

  try {
    // الخطوة 1: البحث عن الفيديوهات
    const searchParams = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "video",
      maxResults: String(Math.min(maxResults + 10, 50)), // نطلب أكثر للتعويض عن الفلترة
      order,
      videoDuration,
      videoEmbeddable: "true",
      key: apiKey,
      relevanceLanguage: "ar",
    });
    if (pageToken) searchParams.set("pageToken", pageToken);

    const searchRes = await fetch(`${BASE_URL}/search?${searchParams}`);
    if (!searchRes.ok) {
      const err = await searchRes.json();
      if (err?.error?.errors?.[0]?.reason === "quotaExceeded") {
        throw new Error("تم تجاوز حصة YouTube API اليومية. حاول غداً.");
      }
      throw new Error(err?.error?.message || "خطأ في البحث");
    }
    const searchData = await searchRes.json();

    if (!searchData.items || searchData.items.length === 0) {
      return { videos: [], nextPageToken: null };
    }

    // الخطوة 2: جلب تفاصيل الفيديوهات (المدة، المشاهدات)
    const videoIds = searchData.items.map((item) => item.id.videoId).join(",");
    const detailsParams = new URLSearchParams({
      part: "contentDetails,statistics",
      id: videoIds,
      key: apiKey,
    });

    const detailsRes = await fetch(`${BASE_URL}/videos?${detailsParams}`);
    if (!detailsRes.ok) throw new Error("خطأ في جلب تفاصيل الفيديوهات");
    const detailsData = await detailsRes.json();

    // بناء خريطة التفاصيل
    const detailsMap = {};
    detailsData.items.forEach((item) => {
      detailsMap[item.id] = {
        duration: item.contentDetails.duration,
        durationSeconds: parseDurationToSeconds(item.contentDetails.duration),
        viewCount: item.statistics?.viewCount || "0",
        likeCount: item.statistics?.likeCount || "0",
      };
    });

    // الخطوة 3: بناء قائمة الفيديوهات مع تصفية Shorts
    const videos = searchData.items
      .map((item) => {
        const details = detailsMap[item.id.videoId] || {};
        return {
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail:
            item.snippet.thumbnails?.high?.url ||
            item.snippet.thumbnails?.medium?.url ||
            item.snippet.thumbnails?.default?.url,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          duration: details.duration || "",
          durationFormatted: formatDuration(details.duration),
          durationSeconds: details.durationSeconds || 0,
          viewCount: details.viewCount,
          viewsFormatted: formatViews(details.viewCount),
          likeCount: details.likeCount,
        };
      })
      // تصفية Shorts (أقل من 60 ثانية)
      .filter((v) => v.durationSeconds >= 60)
      .slice(0, maxResults);

    return {
      videos,
      nextPageToken: searchData.nextPageToken || null,
    };
  } catch (err) {
    console.error("YouTube Search Error:", err);
    throw err;
  }
}

/**
 * جلب تفاصيل فيديو واحد
 */
export async function getVideoDetails(videoId, apiKey) {
  if (!apiKey || apiKey === "YOUR_YOUTUBE_API_KEY") {
    throw new Error("يرجى إدخال مفتاح YouTube API في الإعدادات");
  }

  const params = new URLSearchParams({
    part: "contentDetails,statistics,snippet",
    id: videoId,
    key: apiKey,
  });

  const res = await fetch(`${BASE_URL}/videos?${params}`);
  if (!res.ok) throw new Error("خطأ في جلب تفاصيل الفيديو");
  const data = await res.json();

  if (!data.items || data.items.length === 0) {
    throw new Error("الفيديو غير موجود أو محجوب");
  }

  const item = data.items[0];
  return {
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnail:
      item.snippet.thumbnails?.maxres?.url ||
      item.snippet.thumbnails?.high?.url ||
      item.snippet.thumbnails?.default?.url,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    tags: item.snippet.tags || [],
    duration: item.contentDetails.duration,
    durationFormatted: formatDuration(item.contentDetails.duration),
    durationSeconds: parseDurationToSeconds(item.contentDetails.duration),
    viewCount: item.statistics?.viewCount || "0",
    viewsFormatted: formatViews(item.statistics?.viewCount),
    likeCount: item.statistics?.likeCount || "0",
    likesFormatted: formatViews(item.statistics?.likeCount),
  };
}

/**
 * البحث في قناة محددة
 */
export async function searchByChannel(channelId, apiKey, maxResults = 20) {
  if (!apiKey || apiKey === "YOUR_YOUTUBE_API_KEY") {
    throw new Error("يرجى إدخال مفتاح YouTube API في الإعدادات");
  }

  const params = new URLSearchParams({
    part: "snippet",
    channelId,
    type: "video",
    maxResults: String(maxResults),
    order: "date",
    videoEmbeddable: "true",
    key: apiKey,
  });

  const res = await fetch(`${BASE_URL}/search?${params}`);
  if (!res.ok) throw new Error("خطأ في البحث في القناة");
  const data = await res.json();

  if (!data.items || data.items.length === 0) return [];

  // جلب التفاصيل
  const videoIds = data.items.map((i) => i.id.videoId).join(",");
  const detParams = new URLSearchParams({
    part: "contentDetails,statistics",
    id: videoIds,
    key: apiKey,
  });
  const detRes = await fetch(`${BASE_URL}/videos?${detParams}`);
  const detData = await detRes.json();

  const detMap = {};
  detData.items?.forEach((d) => {
    detMap[d.id] = {
      duration: d.contentDetails.duration,
      durationSeconds: parseDurationToSeconds(d.contentDetails.duration),
      viewCount: d.statistics?.viewCount || "0",
    };
  });

  return data.items
    .map((item) => {
      const det = detMap[item.id.videoId] || {};
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.default?.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        duration: det.duration || "",
        durationFormatted: formatDuration(det.duration),
        durationSeconds: det.durationSeconds || 0,
        viewCount: det.viewCount,
        viewsFormatted: formatViews(det.viewCount),
      };
    })
    .filter((v) => v.durationSeconds >= 60);
}

/**
 * جلب الفيديوهات الرائجة
 */
export async function getTrending(apiKey, regionCode = "SA") {
  if (!apiKey || apiKey === "YOUR_YOUTUBE_API_KEY") {
    throw new Error("يرجى إدخال مفتاح YouTube API في الإعدادات");
  }

  const params = new URLSearchParams({
    part: "snippet,contentDetails,statistics",
    chart: "mostPopular",
    regionCode,
    maxResults: "20",
    key: apiKey,
  });

  const res = await fetch(`${BASE_URL}/videos?${params}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || "خطأ في جلب الفيديوهات الرائجة");
  }
  const data = await res.json();

  return data.items
    .map((item) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail:
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      duration: item.contentDetails.duration,
      durationFormatted: formatDuration(item.contentDetails.duration),
      durationSeconds: parseDurationToSeconds(item.contentDetails.duration),
      viewCount: item.statistics?.viewCount || "0",
      viewsFormatted: formatViews(item.statistics?.viewCount),
      likeCount: item.statistics?.likeCount || "0",
    }))
    .filter((v) => v.durationSeconds >= 60);
}

/**
 * اختبار صلاحية مفتاح API
 */
export async function testApiKey(apiKey) {
  try {
    const params = new URLSearchParams({
      part: "snippet",
      q: "test",
      type: "video",
      maxResults: "1",
      key: apiKey,
    });
    const res = await fetch(`${BASE_URL}/search?${params}`);
    return res.ok;
  } catch {
    return false;
  }
}
