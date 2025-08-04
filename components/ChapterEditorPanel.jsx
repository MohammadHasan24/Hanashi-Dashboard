// components/ChapterEditorPanel.jsx

import React from "react";

// Right sidebar panel for editing a chapter
export default function ChapterEditorPanel({
  chapterTitle,          // current chapter title
  setChapterTitle,       // setter for title
  bodyText,              // chapter body as a single string
  setBodyText,           // setter for body text
  options,               // array of { text, nextChapterId }
  setOptions,            // setter for options array
  chapters,              // full list of chapters (for dropdowns)
  onClose,               // callback to close sidebar
  onSetStartChapter,     // callback to mark chapter as start
  onSave,                // callback to save/update
  onDelete,              // callback to delete
}) {
  return (
    <div style={{ width: "40vw", padding: "2rem", backgroundColor: "#1e1e1e", position: "relative" }}>
      {/* close the editor panel */}
      <button
        onClick={onClose}
        style={{ position: "absolute", top: "1rem", right: "1rem", fontSize: "1.5rem", background: "none", color: "#ffcc00", border: "none" }}
      >
        ⮘
      </button>

      <h2 style={{ marginTop: "3rem" }}>Edit Chapter</h2>

      {/* set this chapter as the starting chapter */}
      <button
        onClick={onSetStartChapter}
        style={{ marginBottom: "1rem", backgroundColor: "#006600", color: "#fff", padding: "0.5rem 1rem", border: "none" }}
      >
        📌 Set as Start Chapter
      </button>

      {/* update title text as you type */}
      <input
        type="text"
        value={chapterTitle}
        onChange={(e) => setChapterTitle(e.target.value)}
        placeholder="Chapter Title"
        style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem", backgroundColor: "#2a2a2a", color: "#fff", border: "1px solid #444" }}
      />

      {/* update full body text as you type */}
      <textarea
        value={bodyText}
        onChange={(e) => setBodyText(e.target.value)}
        placeholder="Write your chapter. Use double newlines for paragraph breaks."
        style={{ width: "100%", height: "150px", marginBottom: "1rem", backgroundColor: "#2a2a2a", color: "#fff", border: "1px solid #444" }}
      />

      {/* loop through all current options */}
      {options.map((option, idx) => (
        <div key={idx} style={{ marginBottom: "1rem" }}>
          {/* update the text for this option */}
          <input
            type="text"
            value={option.text}
            onChange={(e) => {
              const updated = [...options];         // copy current options
              updated[idx].text = e.target.value;   // change the text
              setOptions(updated);                  // apply update
            }}
            placeholder="Option text"
            style={{ width: "45%", marginRight: "1rem", padding: "0.5rem", backgroundColor: "#2a2a2a", color: "#fff", border: "1px solid #444" }}
          />

          {/* select where this option leads (chapter) */}
          <select
            value={option.nextChapterId}
            onChange={(e) => {
              const updated = [...options];                  // copy current options
              updated[idx].nextChapterId = e.target.value;   // change target chapter
              setOptions(updated);                           // apply update
            }}
            style={{ width: "45%", padding: "0.5rem", backgroundColor: "#2a2a2a", color: "#fff", border: "1px solid #444" }}
          >
            <option value="">-- Select next chapter --</option>
            {chapters.map((chap) => (
              <option key={chap.id} value={chap.id}>
                {chap.title || `Untitled (${chap.id.slice(0, 6)})`}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* add a new option if less than 3 exist */}
      {options.length < 3 && (
        <button
          onClick={() => setOptions([...options, { text: "", nextChapterId: "" }])}
          style={{ padding: "0.5rem 1rem", marginBottom: "1rem", backgroundColor: "#333", color: "#ffcc00", border: "none" }}
        >
          + Add Option
        </button>
      )}

      {/* save or delete the chapter */}
      <div style={{ display: "flex", gap: "1rem" }}>
        <button onClick={onSave} style={{ padding: "0.75rem 1.5rem", backgroundColor: "#ffcc00", border: "none", color: "#000" }}>
          Save Chapter
        </button>
        <button onClick={onDelete} style={{ padding: "0.75rem 1.5rem", backgroundColor: "#cc0000", border: "none", color: "#fff" }}>
          Delete Chapter
        </button>
      </div>
    </div>
  );
}
