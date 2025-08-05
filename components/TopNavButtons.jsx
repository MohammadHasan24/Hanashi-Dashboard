// components/TopNavButtons.jsx

import React from "react";
import { useRouter } from "next/router";

// Top nav button: Goes to Book Description page
export default function TopNavButtons() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/bookDescription/${router.query.id}`)}
      style={{
        position: "absolute",
        top: "1rem",
        left: "1rem",
        zIndex: 10,
        padding: "0.5rem 1rem",
        backgroundColor: "#444",
        color: "#fff",
        border: "none",
      }}
    >
      ← Back to Book Info
    </button>
  );
}
