// ═══════════════════════════════════════
// StreamIQ — useYouTube Hook
// إدارة بيانات YouTube مع الكاش
// ═══════════════════════════════════════

import { useState, useCallback, useRef } from "react";
import { searchVideos, getTrending } from "../api/youtube.js";
import { useCachedData } from "./useLocalStorage.js";

/**
 * Hook مخصص لجلب فيديوهات YouTube حسب الفئة
 * يستخدم الكاش لتقليل استدعاءات API
 */
export function useYouTube(apiKey) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const activeRequests = useRef(new Set());

  /**
   * جلب فيديوهات فئة معينة مع الكاش
   */
  const fetchCategory = useCallback(
    async (category) => {
      const cacheKey = `cat_${category.id}`;
      const { getCached, setCached } = useCachedData(cacheKey);

      // تحقق من الكاش أولاً
      const cached = getCached();
      if (cached) return cached;

      // منع الطلبات المكررة
      if (activeRequests.current.has(cacheKey)) return null;
      activeRequests.current.add(cacheKey);

      setLoading(true);
      setError(null);

      try {
        // اختيار استعلام عشوائي من استعلامات الفئة
        const query =
          category.queries[Math.floor(Math.random() * category.queries.length)];
        const result = await searchVideos(query, apiKey, { maxResults: 20 });
        setCached(result.videos);
        return result.videos;
      } catch (err) {
        setError(err.message);
        return [];
      } finally {
        setLoading(false);
        activeRequests.current.delete(cacheKey);
      }
    },
    [apiKey]
  );

  /**
   * جلب الفيديوهات الرائجة مع الكاش
   */
  const fetchTrending = useCallback(async () => {
    const cacheKey = "trending";
    const { getCached, setCached } = useCachedData(cacheKey);

    const cached = getCached();
    if (cached) return cached;

    if (activeRequests.current.has(cacheKey)) return null;
    activeRequests.current.add(cacheKey);

    setLoading(true);
    setError(null);

    try {
      const videos = await getTrending(apiKey);
      setCached(videos);
      return videos;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
      activeRequests.current.delete(cacheKey);
    }
  }, [apiKey]);

  /**
   * بحث مباشر (بدون كاش)
   */
  const search = useCallback(
    async (query, options = {}) => {
      setLoading(true);
      setError(null);
      try {
        const result = await searchVideos(query, apiKey, options);
        return result;
      } catch (err) {
        setError(err.message);
        return { videos: [], nextPageToken: null };
      } finally {
        setLoading(false);
      }
    },
    [apiKey]
  );

  return {
    loading,
    error,
    fetchCategory,
    fetchTrending,
    search,
  };
}
