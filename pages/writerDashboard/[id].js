// pages/writerDashboard/[id].js
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

export default function WriterDashboard() {
  const router = useRouter();
  const { id: bookId } = router.query;

  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [chapterTitle, setChapterTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [options, setOptions] = useState([{ text: "", nextChapterId: "" }]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!bookId) return;
    const fetchChapters = async () => {
      const chaptersRef = collection(db, "stories", bookId, "chapters");
      const snapshot = await getDocs(chaptersRef);
      const chapterList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setChapters(chapterList);
    };
    fetchChapters();
  }, [bookId]);

  useEffect(() => {
    const newNodes = chapters.map((chap, index) => ({
      id: chap.id,
      data: { label: chap.title || `Untitled (${chap.id.slice(0, 6)})` },
      position: { x: (index % 5) * 250, y: Math.floor(index / 5) * 200 },
      style: {
        padding: "1rem",
        borderRadius: "8px",
        backgroundColor: "#f5f5f5",
        color: "#000000",
        border: "1px solid #ccc",
      },
    }));
    setNodes(newNodes);

    const newEdges = [];
    chapters.forEach((chap) => {
      chap.options?.forEach((opt) => {
        if (opt.nextChapterId) {
          newEdges.push({
            id: `${chap.id}-${opt.nextChapterId}`,
            source: chap.id,
            target: opt.nextChapterId,
            label: opt.text,
            animated: true,
            style: { stroke: "#ffcc00" },
            labelStyle: { fill: "#ffcc00", fontSize: 12 },
          });
        }
      });
    });
    setEdges(newEdges);
  }, [chapters]);

  const handleSelectChapter = async (id) => {
    setSelectedChapterId(id);
    const chapterDoc = await getDoc(doc(db, "stories", bookId, "chapters", id));
    const chapterData = chapterDoc.data();
    setChapterTitle(chapterData.title || "");
    setBodyText((chapterData.body || [""]).join("\n\n"));
    setOptions(chapterData.options || [{ text: "", nextChapterId: "" }]);
  };

  const handleSaveChapter = async () => {
    const chapterData = {
      title: chapterTitle,
      body: bodyText.split("\n\n").map((p) => p.trim()).filter(Boolean),
      options: options.slice(0, 3).filter((o) => o.text),
    };

    const chaptersRef = collection(db, "stories", bookId, "chapters");

    if (selectedChapterId) {
      await updateDoc(doc(db, "stories", bookId, "chapters", selectedChapterId), chapterData);
      setChapters((prev) =>
        prev.map((chap) => (chap.id === selectedChapterId ? { ...chap, ...chapterData } : chap))
      );
    } else {
      const newDoc = await addDoc(chaptersRef, chapterData);
      const newChapter = { id: newDoc.id, ...chapterData };
      setChapters((prev) => [...prev, newChapter]);
      setSelectedChapterId(newDoc.id);
    }
    alert("Chapter saved!");
  };

  const handleAddNewChapter = async () => {
    const chaptersRef = collection(db, "stories", bookId, "chapters");
    const newDoc = await addDoc(chaptersRef, {
      title: "",
      body: [""],
      options: [{ text: "", nextChapterId: "" }],
    });
    const newChapter = {
      id: newDoc.id,
      title: "",
      body: [""],
      options: [{ text: "", nextChapterId: "" }],
    };
    setChapters((prev) => [...prev, newChapter]);
    setSelectedChapterId(newDoc.id);
    setChapterTitle("");
    setBodyText("");
    setOptions([{ text: "", nextChapterId: "" }]);
  };

  const handleDeleteChapter = async () => {
    if (!selectedChapterId) return;
    await deleteDoc(doc(db, "stories", bookId, "chapters", selectedChapterId));
    setChapters((prev) => prev.filter((chap) => chap.id !== selectedChapterId));
    setSelectedChapterId(null);
    setChapterTitle("");
    setBodyText("");
    setOptions([{ text: "", nextChapterId: "" }]);
  };

  return (
    <ReactFlowProvider>
      <div style={{ display: "flex", height: "100vh", backgroundColor: "#121212", color: "#eee" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <button
            onClick={handleAddNewChapter}
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

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            onNodeClick={(_, node) => handleSelectChapter(node.id)}
          >
            <Background variant="dots" gap={24} size={1} color="#ffffff" />
            <Controls style={{ backgroundColor: "#2a2a2a" }} />
            <MiniMap nodeColor={() => "#999"} style={{ backgroundColor: "#1e1e1e" }} />
          </ReactFlow>
        </div>

        {selectedChapterId && (
          <div style={{ width: "40vw", padding: "2rem", backgroundColor: "#1e1e1e", position: "relative" }}>
            <button
              onClick={() => setSelectedChapterId(null)}
              style={{ position: "absolute", top: "1rem", right: "1rem", fontSize: "1.5rem", background: "none", color: "#ffcc00", border: "none" }}
            >
              ⮘
            </button>
            <h2 style={{ marginTop: "2rem" }}>Edit Chapter</h2>
            <input
              type="text"
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
              placeholder="Chapter Title"
              style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem", backgroundColor: "#2a2a2a", color: "#fff", border: "1px solid #444" }}
            />
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Write your chapter. Use double newlines for paragraph breaks."
              style={{ width: "100%", height: "150px", marginBottom: "1rem", backgroundColor: "#2a2a2a", color: "#fff", border: "1px solid #444" }}
            />
            {options.map((option, idx) => (
              <div key={idx} style={{ marginBottom: "1rem" }}>
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => {
                    const updated = [...options];
                    updated[idx].text = e.target.value;
                    setOptions(updated);
                  }}
                  placeholder="Option text"
                  style={{ width: "45%", marginRight: "1rem", padding: "0.5rem", backgroundColor: "#2a2a2a", color: "#fff", border: "1px solid #444" }}
                />
                <select
                  value={option.nextChapterId}
                  onChange={(e) => {
                    const updated = [...options];
                    updated[idx].nextChapterId = e.target.value;
                    setOptions(updated);
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
            {options.length < 3 && (
              <button
                onClick={() => setOptions([...options, { text: "", nextChapterId: "" }])}
                style={{ padding: "0.5rem 1rem", marginBottom: "1rem", backgroundColor: "#333", color: "#ffcc00", border: "none" }}
              >
                + Add Option
              </button>
            )}
            <div style={{ display: "flex", gap: "1rem" }}>
              <button onClick={handleSaveChapter} style={{ padding: "0.75rem 1.5rem", backgroundColor: "#ffcc00", border: "none", color: "#000" }}>
                Save Chapter
              </button>
              <button onClick={handleDeleteChapter} style={{ padding: "0.75rem 1.5rem", backgroundColor: "#cc0000", border: "none", color: "#fff" }}>
                Delete Chapter
              </button>
            </div>
          </div>
        )}
      </div>
    </ReactFlowProvider>
  );
}