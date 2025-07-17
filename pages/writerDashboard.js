import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { db, storage, auth } from "../firebaseConfig";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { signOut } from "firebase/auth";
import { useUserRole } from "../hooks/useUserRole";

export default function WriterDashboard() {
  const [stories, setStories] = useState([]);
  const router = useRouter();
  const { user, roles, loading } = useUserRole();

  useEffect(() => {
    if (!loading && (!user || !roles?.includes("writer"))) {
      router.push("/login");
    }
  }, [user, roles, loading, router]);

  useEffect(() => {
    const fetchStories = async () => {
      const querySnapshot = await getDocs(collection(db, "stories"));
      const storyList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data()),
      }));
      setStories(storyList);
    };

    if (roles?.includes("writer")) {
      fetchStories();
    }
  }, [roles]);

  const handleDelete = async (story) => {
    const confirmDelete = confirm("Are you sure you want to delete this book?");
    if (!confirmDelete) return;

    try {
      if (story.coverImage) {
        const imageRef = ref(storage, story.coverImage);
        await deleteObject(imageRef);
      }
      await deleteDoc(doc(db, "stories", story.id));
      setStories((prev) => prev.filter((s) => s.id !== story.id));
    } catch (error) {
      console.error("Error deleting book:", error);
      alert("Failed to delete book.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (loading || !roles?.includes("writer")) return null;

  return (
    <>
      <button
        onClick={handleLogout}
        style={{
          position: "fixed",
          top: "1rem",
          left: "1rem",
          backgroundColor: "#333",
          color: "#ffcc00",
          border: "none",
          borderRadius: "6px",
          padding: "0.5rem 1rem",
          fontWeight: "bold",
          zIndex: 1000,
          cursor: "pointer",
        }}
      >
        🚪 Logout
      </button>

      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>📚 Your Books</h1>
          <button style={styles.addButton} onClick={() => router.push("/addStory")}>➕ Add New Book</button>
        </div>

        <div style={styles.grid}>
          {stories.map((item) => (
            <div
              key={item.id}
              style={styles.card}
              onMouseEnter={(e) => e.currentTarget.querySelector(".delete-button").style.display = "block"}
              onMouseLeave={(e) => e.currentTarget.querySelector(".delete-button").style.display = "none"}
            >
              <img
                src={item.coverImage || "/placeholder-cover.png"}
                alt={`${item.title} cover`}
                style={styles.image}
                onClick={() => router.push(`/writerDashboard/${item.id}`)}
              />
              <h2 style={styles.cardTitle}>{item.title}</h2>
              <p style={styles.cardDescription}>{item.description || "No description provided."}</p>
              <button
                className="delete-button"
                onClick={() => handleDelete(item)}
                style={{
                  display: "none",
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  backgroundColor: "#cc0000",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "0.3rem 0.6rem",
                  cursor: "pointer",
                }}
              >
                ❌
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  title: {
    fontSize: "2rem",
    margin: 0,
  },
  addButton: {
    padding: "0.5rem 1rem",
    background: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
    padding: "1rem",
    cursor: "pointer",
    position: "relative",
    transition: "transform 0.2s",
  },
  image: {
    width: "100%",
    height: "200px",
    objectFit: "cover",
    borderRadius: "8px",
    marginBottom: "0.75rem",
  },
  cardTitle: {
    fontSize: "1.2rem",
    margin: "0 0 0.5rem 0",
  },
  cardDescription: {
    fontSize: "0.95rem",
    color: "#555",
  },
};
