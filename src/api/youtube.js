// ═══════════════════════════════════════
// StreamIQ — YouTube API Layer
// جميع استدعاءات YouTube Data API v3
// ═══════════════════════════════════════

const BASE_URL = "https://www.googleapis.com/youtube/v3";

let currentKeyIndex = 0;

/**
 * دالة مساعدة لتشغيل API مع دعم الـ Key Rotation
 * تقوم بتجربة المفتاح الحالي، وإذا تم تجاوز الحد اليومي (Quota Exceeded)
 * تقوم بالتبديل تلقائياً للمفتاح التالي في المصفوفة.
 */
async function withKeyRotation(apiKeyString, apiCallFn) {
  if (!apiKeyString || apiKeyString === "YOUR_YOUTUBE_API_KEY") {
    throw new Error("يرجى إدخال مفتاح YouTube API في الإعدادات");
  }
  
  const keys = apiKeyString.split(",").map(k => k.trim()).filter(Boolean);
  if (keys.length === 0) {
    throw new Error("يرجى إدخال مفتاح YouTube API صالح");
  }

  let attempts = 0;
  let lastError = null;

  while (attempts < keys.length) {
    const activeKey = keys[currentKeyIndex % keys.length];
    try {
      return await apiCallFn(activeKey);
    } catch (err) {
      lastError = err;
      if (err.isQuotaError) {
        console.warn(`[API] مفتاح (${activeKey.substring(0,6)}...) انتهى رصيده. جاري تجربة المفتاح التالي...`);
        currentKeyIndex++;
        attempts++;
      } else {
        throw err; // Throw immediately if it's a normal error (like network issue)
      }
    }
  }
  
  throw new Error("تم تجاوز الحصة اليومية لجميع المفاتيح المدخلة! يرجى إضافة مفاتيح جديدة أو المحاولة غداً.");
}

/**
 * تحليل الرد من يوتيوب لرمي خطأ مخصص إذا كان السبب انتهاء الحصة
 */
async function handleApiError(res) {
  const errData = await res.json().catch(() => ({}));
  const reason = errData?.error?.errors?.[0]?.reason;
  const isQuota = reason === "quotaExceeded" || reason === "keyInvalid" || errData?.error?.code === 403;
  
  const err = new Error(errData?.error?.message || "خطأ في الاتصال بخوادم YouTube");
  err.isQuotaError = isQuota;
  throw err;
}


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
export async function searchVideos(query, apiKeyString, options = {}) {
  const {
    maxResults = 20,
    order = "relevance",
    videoDuration = "any",
    pageToken = "",
  } = options;

  return withKeyRotation(apiKeyString, async (activeKey) => {
    // الخطوة 1: البحث عن الفيديوهات
    const searchParams = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "video",
      maxResults: String(Math.min(maxResults + 10, 50)), // نطلب أكثر للتعويض عن الفلترة
      order,
      videoDuration,
      videoEmbeddable: "true",
      key: activeKey,
      relevanceLanguage: "ar",
    });
    if (pageToken) searchParams.set("pageToken", pageToken);

    const searchRes = await fetch(`${BASE_URL}/search?${searchParams}`);
    if (!searchRes.ok) await handleApiError(searchRes);
    const searchData = await searchRes.json();

    if (!searchData.items || searchData.items.length === 0) {
      return { videos: [], nextPageToken: null };
    }

    // الخطوة 2: جلب تفاصيل الفيديوهات (المدة، المشاهدات)
    const videoIds = searchData.items.map((item) => item.id.videoId).join(",");
    const detailsParams = new URLSearchParams({
      part: "contentDetails,statistics",
      id: videoIds,
      key: activeKey,
    });

    const detailsRes = await fetch(`${BASE_URL}/videos?${detailsParams}`);
    if (!detailsRes.ok) await handleApiError(detailsRes);
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
      .filter((v) => v.durationSeconds >= 60)
      .slice(0, maxResults);

    return {
      videos,
      nextPageToken: searchData.nextPageToken || null,
    };
  });
}

/**
 * جلب تفاصيل فيديو واحد
 */
export async function getVideoDetails(videoId, apiKeyString) {
  return withKeyRotation(apiKeyString, async (activeKey) => {
    const params = new URLSearchParams({
      part: "contentDetails,statistics,snippet",
      id: videoId,
      key: activeKey,
    });

    const res = await fetch(`${BASE_URL}/videos?${params}`);
    if (!res.ok) await handleApiError(res);
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
  });
}

/**
 * البحث في قناة محددة
 */
export async function searchByChannel(channelId, apiKeyString, maxResults = 20) {
  return withKeyRotation(apiKeyString, async (activeKey) => {
    const params = new URLSearchParams({
      part: "snippet",
      channelId,
      type: "video",
      maxResults: String(maxResults),
      order: "date",
      videoEmbeddable: "true",
      key: activeKey,
    });

    const res = await fetch(`${BASE_URL}/search?${params}`);
    if (!res.ok) await handleApiError(res);
    const data = await res.json();

    if (!data.items || data.items.length === 0) return [];

    // جلب التفاصيل
    const videoIds = data.items.map((i) => i.id.videoId).join(",");
    const detParams = new URLSearchParams({
      part: "contentDetails,statistics",
      id: videoIds,
      key: activeKey,
    });
    const detRes = await fetch(`${BASE_URL}/videos?${detParams}`);
    if (!detRes.ok) await handleApiError(detRes);
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
  });
}

/**
 * جلب الفيديوهات الرائجة
 */
export async function getTrending(apiKeyString, regionCode = "SA") {
  return withKeyRotation(apiKeyString, async (activeKey) => {
    const params = new URLSearchParams({
      part: "snippet,contentDetails,statistics",
      chart: "mostPopular",
      regionCode,
      maxResults: "20",
      key: activeKey,
    });

    const res = await fetch(`${BASE_URL}/videos?${params}`);
    if (!res.ok) await handleApiError(res);
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
  });
}

/**
 * اختبار صلاحية مفتاح API
 */
export async function testApiKey(apiKeyString) {
  try {
    return await withKeyRotation(apiKeyString, async (activeKey) => {
      const params = new URLSearchParams({
        part: "snippet",
        q: "test",
        type: "video",
        maxResults: "1",
        key: activeKey,
      });
      const res = await fetch(`${BASE_URL}/search?${params}`);
      if (!res.ok) await handleApiError(res);
      return true;
    });
  } catch {
    return false;
  }
}
