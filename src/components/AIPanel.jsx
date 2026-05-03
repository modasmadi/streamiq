import React, { useState, useRef, useEffect } from "react";
import { chat } from "../api/claude.js";

const QUICK_SUGGESTIONS = [
  "أفلام مضحكة",
  "أنمي أكشن 2024",
  "مسلسلات رومانسية",
  "وثائقي عن الفضاء",
  "كرتون أطفال",
];

/**
 * لوحة المساعد الذكي — واجهة محادثة مع Claude
 */
export default function AIPanel({ apiKey, onSearchFromAI }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "مرحباً! 👋 أنا مساعدك الذكي. اسألني عن أي محتوى تريد مشاهدته وسأساعدك في البحث." },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const msgsRef = useRef(null);

  // تمرير لأسفل عند رسالة جديدة
  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;

    const newMsgs = [...messages, { role: "user", content: userMsg }];
    setMessages(newMsgs);
    setInput("");
    setTyping(true);

    try {
      // إرسال آخر 10 رسائل فقط
      const apiMsgs = newMsgs.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const reply = await chat(apiMsgs, apiKey);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      // محاولة استخراج مصطلحات بحث من الرد
      const searchMatch = reply.match(/\{"searchTerms":\s*\[.*?\]\}/);
      if (searchMatch) {
        try {
          const { searchTerms } = JSON.parse(searchMatch[0]);
          if (searchTerms && searchTerms.length > 0 && onSearchFromAI) {
            onSearchFromAI(searchTerms[0]);
          }
        } catch {}
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${err.message}` },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  if (!open) {
    return (
      <button className="ai-toggle" onClick={() => setOpen(true)} id="ai-toggle-btn">
        🤖
      </button>
    );
  }

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <div className="ai-panel-title">🤖 المساعد الذكي</div>
        <button onClick={() => setOpen(false)} style={{ fontSize: "1.2rem" }}>✕</button>
      </div>

      <div className="ai-messages" ref={msgsRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`ai-msg ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {typing && (
          <div className="ai-typing">
            <span /><span /><span />
          </div>
        )}
      </div>

      <div className="ai-suggestions">
        {QUICK_SUGGESTIONS.map((s, i) => (
          <button key={i} className="ai-suggestion" onClick={() => sendMessage(s)}>
            {s}
          </button>
        ))}
      </div>

      <form className="ai-input-wrap" onSubmit={handleSubmit}>
        <input
          className="ai-input"
          placeholder="اكتب ما تريد مشاهدته..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          id="ai-chat-input"
        />
        <button className="ai-send" type="submit">➤</button>
      </form>
    </div>
  );
}
