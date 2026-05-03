# StreamIQ — بث ذكي مجاني 🎬

منصة بث عربية مجانية وقانونية تجمع المحتوى من YouTube بواجهة احترافية.

![StreamIQ](https://img.shields.io/badge/StreamIQ-v1.0.0-6c63ff?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-6-646cff?style=for-the-badge&logo=vite)

## ✨ المميزات

- 🎬 **8 فئات محتوى** — أفلام، مسلسلات، أنمي، وثائقيات، كوميديا، رعب، أطفال
- 🔥 **محتوى رائج** — يُحدّث تلقائياً
- 🔍 **بحث ذكي** — بالذكاء الاصطناعي (Claude AI)
- ❤️ **مفضلة** — احفظ ما تحب
- 🕐 **سجل المشاهدة** — أكمل من حيث توقفت
- 📱 **PWA** — ثبته كتطبيق على هاتفك
- 🌙 **تصميم داكن** — مريح للعين
- 🌐 **عربي بالكامل** — RTL

## 🚀 التشغيل

```bash
# تثبيت المكتبات
npm install

# تشغيل محلي
npm run dev

# بناء للنشر
npm run build
```

## 🔑 الإعدادات

أنشئ ملف `.env` في جذر المشروع:

```env
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
VITE_ANTHROPIC_API_KEY=your_claude_api_key_here
```

أو أدخل المفاتيح من صفحة الإعدادات ⚙️ داخل التطبيق.

### الحصول على YouTube API Key:
1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. أنشئ مشروع جديد
3. فعّل **YouTube Data API v3**
4. أنشئ **API Key** من Credentials

## 📱 تثبيت كتطبيق (PWA)

### أندرويد:
1. افتح الموقع في Chrome
2. اضغط **⋮** ← "إضافة إلى الشاشة الرئيسية"

### آيفون:
1. افتح الموقع في Safari
2. اضغط **مشاركة** ← "إضافة إلى الشاشة الرئيسية"

## 🛠️ التقنيات

| التقنية | الاستخدام |
|---|---|
| React 18 | واجهة المستخدم |
| Vite 6 | بناء وتطوير |
| YouTube Data API v3 | جلب المحتوى |
| Claude AI | المساعد الذكي |
| CSS Variables | التصميم |
| localStorage | التخزين المحلي |
| Service Worker | PWA |

## 📄 الترخيص

MIT License — مفتوح المصدر

---

صنع بـ ❤️ بواسطة StreamIQ
