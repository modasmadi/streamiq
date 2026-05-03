import React from "react";

export default function SkeletonLoader({ count = 8 }) {
  return Array.from({ length: count }, (_, i) => (
    <div className="skeleton" key={i}>
      <div className="skeleton-thumb" />
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
    </div>
  ));
}
