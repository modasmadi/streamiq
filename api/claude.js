// ═══════════════════════════════════════
// StreamIQ — Claude AI Layer
// استدعاءات Anthropic Claude API
// ═══════════════════════════════════════

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `أنت مساعد ذكي لمنصة StreamIQ لبث المحتوى العربي المجاني. تساعد المستخدمين في:
- البحث الذكي عن محتوى بالوصف
- توصيات مخصصة بناءً على تاريخ المشاهدة
- معلومات عن أفلام ومسلسلات وأنمي
- مقترحات مشابهة
أجب دائماً بالعربية. كن موجزاً ومفيداً. إذا طلب المستخدم بحثاً، أعطه مصطلحات بحث YouTube مناسبة بصيغة JSON مثل:
{"searchTerms": ["مصطلح بحث 1", "مصطلح بحث 2"]}`;

/**
 * محادثة مع Claude AI
 * @param {Array} messages - قائمة الرسائل [{role: "user"|"assistant", content: "..."}]
 * @param {string} apiKey - مفتاح Anthropic API
 * @returns {string} رد المساعد
 */
export async function chat(messages, apiKey) {
  if (!apiKey || apiKey === "YOUR_ANTHROPIC_API_KEY") {
    throw new Error("يرجى إدخال مفتاح Claude API في الإعدادات");
  }

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `خطأ في Claude API: ${res.status}`);
    }

    const data = await res.json();
    return data.content?.[0]?.text || "لم أتمكن من الرد.";
  } catch (err) {
    console.error("Claude API Error:", err);
    throw err;
  }
}

/**
 * اقتراحات بحث ذكية من Claude
 * المستخدم يصف ما يريد → Claude يعطي مصطلحات بحث YouTube
 */
export async function getSearchSuggestions(userInput, apiKey) {
  if (!apiKey || apiKey === "YOUR_ANTHROPIC_API_KEY") {
    return { arabicQuery: userInput, englishQuery: userInput };
  }

  try {
    const prompt = `المستخدم يريد: "${userInput}"
أعطني مصطلحات بحث مناسبة لـ YouTube بالعربية والإنجليزية.
أجب بـ JSON فقط بالصيغة التالية:
{"arabicQuery": "مصطلح البحث بالعربية", "englishQuery": "english search term"}`;

    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 256,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      return { arabicQuery: userInput, englishQuery: userInput };
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "";

    // محاولة استخراج JSON من الرد
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        arabicQuery: parsed.arabicQuery || userInput,
        englishQuery: parsed.englishQuery || userInput,
      };
    }

    return { arabicQuery: userInput, englishQuery: userInput };
  } catch (err) {
    console.error("Claude Suggestions Error:", err);
    return { arabicQuery: userInput, englishQuery: userInput };
  }
}

/**
 * توصيات بناءً على تاريخ المشاهدة
 */
export async function getRecommendations(watchHistory, apiKey) {
  if (!apiKey || apiKey === "YOUR_ANTHROPIC_API_KEY") {
    return [];
  }

  if (!watchHistory || watchHistory.length === 0) {
    return ["أفلام عربية جديدة", "أنمي مدبلج 2024", "مسلسلات رمضان"];
  }

  try {
    const titles = watchHistory.slice(0, 10).map((v) => v.title).join("، ");
    const prompt = `المستخدم شاهد هذه الفيديوهات مؤخراً: ${titles}
اقترح 5 مصطلحات بحث YouTube مناسبة لمحتوى قد يعجبه.
أجب بـ JSON array فقط، مثال:
["مصطلح 1", "مصطلح 2", "مصطلح 3", "مصطلح 4", "مصطلح 5"]`;

    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 256,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const text = data.content?.[0]?.text || "";

    const arrMatch = text.match(/\[[\s\S]*?\]/);
    if (arrMatch) {
      return JSON.parse(arrMatch[0]);
    }

    return [];
  } catch (err) {
    console.error("Claude Recommendations Error:", err);
    return [];
  }
}
