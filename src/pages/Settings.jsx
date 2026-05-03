import React, { useState } from "react";
import { CONFIG } from "../config.js";
import { testApiKey } from "../api/youtube.js";
import { clearAllCache } from "../hooks/useLocalStorage.js";

/**
 * صفحة الإعدادات — مفاتيح API + مسح البيانات
 */
export default function Settings({ settings, onSave }) {
  const [ytKey, setYtKey] = useState(settings.ytKey || "");
  const [aiKey, setAiKey] = useState(settings.aiKey || "");
  const [showYt, setShowYt] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  const handleSave = () => {
    onSave({ ...settings, ytKey, aiKey });
    setTestStatus({ type: "success", msg: "✅ تم حفظ الإعدادات" });
    setTimeout(() => setTestStatus(null), 3000);
  };

  const handleTest = async () => {
    if (!ytKey) { setTestStatus({ type: "error", msg: "أدخل مفتاح YouTube API أولاً" }); return; }
    setTesting(true);
    const ok = await testApiKey(ytKey);
    setTestStatus(ok
      ? { type: "success", msg: "✅ المفتاح يعمل بنجاح!" }
      : { type: "error", msg: "❌ المفتاح غير صالح" }
    );
    setTesting(false);
  };

  const handleClear = () => {
    clearAllCache();
    setTestStatus({ type: "success", msg: "✅ تم مسح الكاش" });
    setTimeout(() => setTestStatus(null), 3000);
  };

  const handleClearAll = () => {
    if (confirm("هل أنت متأكد؟ سيتم حذف المفضلة والتاريخ والكاش.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">⚙️ الإعدادات</h1>
      </div>

      <div className="settings-section">
        {/* YouTube API */}
        <div className="settings-card">
          <div className="settings-card-title">🔑 مفتاح YouTube API</div>
          <div className="settings-field">
            <label className="settings-label">YouTube Data API v3 Key</label>
            <div className="settings-input-wrap">
              <input
                className="settings-input"
                type={showYt ? "text" : "password"}
                value={ytKey}
                onChange={(e) => setYtKey(e.target.value)}
                placeholder="AIza..."
                id="yt-api-input"
              />
              <button className="settings-toggle-vis" onClick={() => setShowYt(!showYt)}>
                {showYt ? "🙈" : "👁"}
              </button>
            </div>
          </div>
          <div className="settings-actions">
            <button className="settings-btn settings-btn-primary" onClick={handleTest} disabled={testing}>
              {testing ? "جاري الاختبار..." : "اختبار الاتصال"}
            </button>
          </div>
        </div>

        {/* Claude API */}
        <div className="settings-card">
          <div className="settings-card-title">🤖 مفتاح Claude API</div>
          <div className="settings-field">
            <label className="settings-label">Anthropic API Key (اختياري — للمساعد الذكي)</label>
            <div className="settings-input-wrap">
              <input
                className="settings-input"
                type={showAi ? "text" : "password"}
                value={aiKey}
                onChange={(e) => setAiKey(e.target.value)}
                placeholder="sk-ant-..."
                id="ai-api-input"
              />
              <button className="settings-toggle-vis" onClick={() => setShowAi(!showAi)}>
                {showAi ? "🙈" : "👁"}
              </button>
            </div>
          </div>
        </div>

        {/* حفظ */}
        <button className="settings-btn settings-btn-primary" onClick={handleSave} style={{ width: "100%", textAlign: "center", padding: 14, fontSize: "1rem" }}>
          💾 حفظ الإعدادات
        </button>

        {testStatus && (
          <div className={`settings-status ${testStatus.type}`}>{testStatus.msg}</div>
        )}

        {/* إدارة البيانات */}
        <div className="settings-card" style={{ marginTop: 20 }}>
          <div className="settings-card-title">🗑️ إدارة البيانات</div>
          <div className="settings-actions">
            <button className="settings-btn settings-btn-secondary" onClick={handleClear}>مسح الكاش</button>
            <button className="settings-btn settings-btn-danger" onClick={handleClearAll}>مسح كل البيانات</button>
          </div>
        </div>

        {/* معلومات */}
        <div className="settings-version">
          {CONFIG.APP_NAME} v{CONFIG.APP_VERSION} — بث ذكي مجاني وقانوني
        </div>
      </div>
    </div>
  );
}
