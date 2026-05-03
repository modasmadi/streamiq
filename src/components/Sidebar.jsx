import React from "react";
import { CATEGORIES } from "../config.js";

/**
 * الشريط الجانبي — تصفح الفئات والصفحات
 */
export default function Sidebar({ activePage, activeCategory, onNavigate, onCategorySelect }) {
  return (
    <>
      <aside className="sidebar">
        {/* الشعار */}
        <div className="sidebar-logo">
          <span>Stream</span>IQ
        </div>

        {/* التنقل الرئيسي (في الديسكتوب فقط يظهر كشريط جانبي، في الموبايل يتحول لشريط سفلي) */}
        <nav className="sidebar-nav desktop-only">
          <div
            className={`sidebar-item ${activePage === "home" ? "active" : ""}`}
            onClick={() => onNavigate("home")}
          >
            <span className="sidebar-item-icon">🏠</span>
            <span className="sidebar-item-label">الرئيسية</span>
          </div>

          {/* الفئات (ديسكتوب فقط) */}
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className={`sidebar-item ${activeCategory === cat.id ? "active" : ""}`}
              onClick={() => onCategorySelect(cat.id)}
            >
              <span className="sidebar-item-icon">{cat.icon}</span>
              <span className="sidebar-item-label">{cat.label}</span>
            </div>
          ))}
        </nav>

        {/* الجزء السفلي (في الموبايل يصبح هو الـ Bottom Nav) */}
      <div className="sidebar-bottom">
        <div
          className={`sidebar-item ${activePage === "home" ? "active" : ""} mobile-only`}
          onClick={() => onNavigate("home")}
        >
          <span className="sidebar-item-icon">🏠</span>
          <span className="sidebar-item-label">الرئيسية</span>
        </div>
        <div
          className={`sidebar-item ${activePage === "favorites" ? "active" : ""}`}
          onClick={() => onNavigate("favorites")}
        >
          <span className="sidebar-item-icon">❤️</span>
          <span className="sidebar-item-label">المفضلة</span>
        </div>
        <div
          className={`sidebar-item ${activePage === "ai" ? "active" : ""}`}
          onClick={() => onNavigate("ai")}
        >
          <span className="sidebar-item-icon">🤖</span>
          <span className="sidebar-item-label">مساعد ذكي</span>
        </div>
        <div
          className={`sidebar-item ${activePage === "settings" ? "active" : ""}`}
          onClick={() => onNavigate("settings")}
        >
          <span className="sidebar-item-icon">⚙️</span>
          <span className="sidebar-item-label">الإعدادات</span>
        </div>
      </div>
    </aside>
  );
}
