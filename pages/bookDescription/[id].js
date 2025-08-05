// 🔹 React & Firebase Imports
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebaseConfig";

// 🔸 Component Start
export default function BookDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  // 🔹 State for book data and form
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false); // toggles edit mode

  // editable fields
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTag, setNewTag] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // 🔄 Load the book info on first load
  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const snap = await getDoc(doc(db, "stories", id));
      if (snap.exists()) {
        const data = snap.data();
        setBook(data);
        setNewTitle(data.title || "");
        setNewDescription(data.description || "");
        setNewTag((data.tags || [])[0] || "");
        setPreviewUrl(data.coverImage || "");
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  // 🧠 Handle image upload preview
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 💾 Save the edits to Firestore
  const handleSave = async () => {
    let updatedFields = {
      title: newTitle,
      description: newDescription,
      tags: newTag ? [newTag] : [],
    };

    // ⬆️ If a new image was selected, upload and update
    if (coverFile) {
      const path = `covers/${id}`;
      const snap = await uploadBytes(ref(storage, path), coverFile);
      const downloadUrl = await getDownloadURL(snap.ref);
      updatedFields.coverImage = downloadUrl;
    }

    await updateDoc(doc(db, "stories", id), updatedFields);
    setBook((prev) => ({ ...prev, ...updatedFields }));
    setEditing(false); // close edit mode
  };

  // 🔁 Loading & not-found fallback
  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;
  if (!book) return <p style={{ padding: 20 }}>Book not found.</p>;

  // 🔳 Render
  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "1000px",
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      {/* 🔙 Back to Dashboard */}
      <button
        onClick={() => router.push("/writerDashboard")}
        style={{
          marginBottom: "1rem",
          padding: "0.5rem 1rem",
          background: "#333",
          color: "#ffcc00",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        ← Back to Dashboard
      </button>

      {/* 📖 Book Details Grid */}
      <div style={{ display: "flex", gap: "2rem" }}>
        {/* 🖼 LEFT: Info & Editing */}
        <div style={{ flex: 1 }}>
          {/* Book Cover */}
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Cover"
              style={{
                width: "100%",
                maxWidth: "400px",
                borderRadius: "8px",
                marginBottom: "1rem",
              }}
            />
          )}

          {/* Upload input in edit mode */}
          {editing && (
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ marginBottom: "1rem" }}
            />
          )}

          {/* Title field */}
          <h2>Title</h2>
          {editing ? (
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={inputStyle}
            />
          ) : (
            <p>{book.title}</p>
          )}

          {/* Description field */}
          <h2>Description</h2>
          {editing ? (
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              style={textareaStyle}
            />
          ) : (
            <p>{book.description || "No description."}</p>
          )}

          {/* Genre (Tag) Dropdown */}
          <h2>Genre</h2>
          {editing ? (
            <select
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select genre</option>
              <option value="horror">Horror</option>
              <option value="drama">Drama</option>
              <option value="romance">Romance</option>
              <option value="sci-fi">Sci-Fi</option>
              <option value="fantasy">Fantasy</option>
            </select>
          ) : (
            <p>{book.tags?.[0] || "No genre set."}</p>
          )}
        </div>

        {/* ➡️ RIGHT: Action Buttons */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
          }}
        >
          {/* Navigate to Chapter Editor */}
          <button
            onClick={() => router.push(`/writerDashboard/${id}`)}
            style={primaryBtnStyle}
          >
            ✏️ Go to Story Editor
          </button>

          {/* Edit Mode Buttons */}
          {editing ? (
            <>
              <button onClick={handleSave} style={greenBtn}>
                ✅ Save Changes
              </button>
              <button onClick={() => setEditing(false)} style={cancelBtn}>
                ❌ Cancel
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} style={editBtn}>
              🛠 Edit Book Info
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// 💅 Styles
const inputStyle = {
  padding: "0.5rem",
  fontSize: "1rem",
  width: "100%",
  borderRadius: "6px",
  border: "1px solid #999",
  marginBottom: "1rem",
};

const textareaStyle = {
  ...inputStyle,
  minHeight: "100px",
};

const primaryBtnStyle = {
  padding: "1rem 2rem",
  background: "#ffcc00",
  color: "#000",
  fontWeight: "bold",
  fontSize: "1.2rem",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  boxShadow: "0 0 10px #ffcc00aa",
};

const greenBtn = {
  ...primaryBtnStyle,
  background: "#00cc66",
  color: "#fff",
};

const cancelBtn = {
  ...primaryBtnStyle,
  background: "#cc0000",
  color: "#fff",
};

const editBtn = {
  ...primaryBtnStyle,
  background: "#333",
  color: "#ffcc00",
};
