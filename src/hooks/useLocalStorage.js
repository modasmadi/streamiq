// ═══════════════════════════════════════
// StreamIQ — useLocalStorage Hook
// إدارة التخزين المحلي مع React state
// ═══════════════════════════════════════

import { useState, useEffect, useCallback } from "react";

/**
 * Hook مخصص لربط localStorage بـ React state
 * @param {string} key - مفتاح التخزين
 * @param {*} initialValue - القيمة الافتراضية
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (err) {
      console.error(`خطأ في قراءة ${key} من localStorage:`, err);
      return initialValue;
    }
  });

  // حفظ القيمة في localStorage عند التغيير
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (err) {
      console.error(`خطأ في حفظ ${key} في localStorage:`, err);
    }
  }, [key, storedValue]);

  // دالة مساعدة لحذف المفتاح
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (err) {
      console.error(`خطأ في حذف ${key}:`, err);
    }
  }, [key, initialValue]);

  return [storedValue, setStoredValue, removeValue];
}

/**
 * إدارة الكاش مع TTL (مدة الصلاحية)
 * @param {string} key - مفتاح الكاش
 * @param {number} ttlMs - مدة الصلاحية بالمللي ثانية (الافتراضي: 24 ساعة)
 */
export function useCachedData(key, ttlMs = 86400000) {
  // جلب بيانات الكاش إذا كانت صالحة
  const getCached = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(`cache_${key}`);
      if (!raw) return null;
      const { data, timestamp } = JSON.parse(raw);
      if (Date.now() - timestamp > ttlMs) {
        window.localStorage.removeItem(`cache_${key}`);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }, [key, ttlMs]);

  // حفظ بيانات في الكاش
  const setCached = useCallback(
    (data) => {
      try {
        window.localStorage.setItem(
          `cache_${key}`,
          JSON.stringify({ data, timestamp: Date.now() })
        );
      } catch (err) {
        console.error("خطأ في حفظ الكاش:", err);
      }
    },
    [key]
  );

  // مسح الكاش
  const clearCached = useCallback(() => {
    try {
      window.localStorage.removeItem(`cache_${key}`);
    } catch {
      // تجاهل
    }
  }, [key]);

  return { getCached, setCached, clearCached };
}

/**
 * مسح جميع بيانات الكاش
 */
export function clearAllCache() {
  const keys = Object.keys(window.localStorage);
  keys.forEach((key) => {
    if (key.startsWith("cache_")) {
      window.localStorage.removeItem(key);
    }
  });
}
