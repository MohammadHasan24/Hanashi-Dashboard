// components/TopNavButtons.jsx

import React from "react";
import { useRouter } from "next/router";

// Top nav buttons: Back to creator + Add new chapter
export default function TopNavButtons({ onAddChapter }) {
  const router = useRouter();

  return (
    <>
      {/* go back to story creator screen */}
      <button
        onClick={() => router.push("/addStory")}
        style={{
          position: "absolute",
          top: "1rem",
          right: "7rem",
          zIndex: 10,
          padding: "0.5rem 1rem",
          backgroundColor: "#444",
          color: "#fff",
          border: "none",
        }}
      >
        ← Back to Book Creator
      </button>

      {/* create a new blank chapter */}
      <button
        onClick={onAddChapter}
        style={{
          position: "absolute",
          top: "1rem",
          left: "1rem",
          zIndex: 10,
          padding: "0.5rem 1rem",
          backgroundColor: "#333",
          color: "#ffcc00",
          border: "none",
        }}
      >
        + New Chapter
      </button>
    </>
  );
}
