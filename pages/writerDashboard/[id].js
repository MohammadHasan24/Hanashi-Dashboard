// pages/writerDashboard/[id].js
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
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
  serverTimestamp,
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
  const [startChapterId, setStartChapterId] = useState(null);

  useEffect(() => {
    if (!bookId) return;
    const fetchChapters = async () => {
      const bookDoc = await getDoc(doc(db, "stories", bookId));
      const bookData = bookDoc.data();
      setStartChapterId(bookData?.startChapterId || null);

      const chaptersRef = collection(db, "stories", bookId, "chapters");
      const snapshot = await getDocs(chaptersRef);
      const chapterList = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          createdAt: data?.createdAt?.seconds || 0,
          position: data.position || null,
          ...data,
        };
      });
      chapterList.sort((a, b) => a.createdAt - b.createdAt);
      setChapters(chapterList);
    };
    fetchChapters();
  }, [bookId]);

  useEffect(() => {
    const chapterIdSet = new Set(chapters.map((chap) => chap.id));
    const incomingMap = {};
    chapters.forEach((chap) => {
      chap.options?.forEach((opt) => {
        if (opt.nextChapterId) {
          incomingMap[opt.nextChapterId] = true;
        }
      });
    });

    const newNodes = chapters.map((chap, index) => {
      const isEnding = !chap.options || chap.options.every((o) => !o.nextChapterId);
      const isDeadEnd = chap.options?.some((o) => o.nextChapterId && !chapterIdSet.has(o.nextChapterId));
      const isStart = chap.id === startChapterId;
      return {
        id: chap.id,
        data: {
          label: (
            <>
              {isStart && <span style={{ color: "#00cc66", marginRight: 4 }}>🟢</span>}
              {isEnding && <span style={{ color: "#ff4444", marginRight: 4 }}>🔥</span>}
              {chap.title || `Untitled (${chap.id.slice(0, 6)})`}
            </>
          ),
        },
        position: chap.position || { x: 100, y: 100 + index * 200 },
        style: {
          padding: "1rem",
          borderRadius: "8px",
          backgroundColor: "#f5f5f5",
          color: "#000000",
          border: isDeadEnd ? "2px dashed red" : isStart ? "2px solid green" : "1px solid #ccc",
        },
      };
    });
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
  }, [chapters, startChapterId]);

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
      createdAt: serverTimestamp(),
    };

    if (selectedChapterId) {
      await updateDoc(doc(db, "stories", bookId, "chapters", selectedChapterId), chapterData);
      setChapters((prev) =>
        prev.map((chap) => (chap.id === selectedChapterId ? { ...chap, ...chapterData } : chap))
      );
    } else {
      const newDoc = await addDoc(collection(db, "stories", bookId, "chapters"), chapterData);
      const newChapter = { id: newDoc.id, ...chapterData };
      setChapters((prev) => [...prev, newChapter]);
      setSelectedChapterId(newDoc.id);
    }
    alert("Chapter saved!");
  };

  const handleAddNewChapter = async () => {
    const newDoc = await addDoc(collection(db, "stories", bookId, "chapters"), {
      title: "",
      body: [""],
      options: [{ text: "", nextChapterId: "" }],
      createdAt: serverTimestamp(),
      position: { x: 100, y: chapters.length * 200 },
    });
    const newChapter = {
      id: newDoc.id,
      title: "",
      body: [""],
      options: [{ text: "", nextChapterId: "" }],
      position: { x: 100, y: chapters.length * 200 },
    };
    setChapters((prev) => [...prev, newChapter]);
    setSelectedChapterId(newDoc.id);
    setChapterTitle("");
    setBodyText("");
    setOptions([{ text: "", nextChapterId: "" }]);
  };

  const handleSetStartChapter = async () => {
    if (!selectedChapterId) return;
    if (startChapterId && selectedChapterId !== startChapterId) {
      const confirmed = confirm("This will change your book’s starting point. Proceed?");
      if (!confirmed) return;
    }
    await updateDoc(doc(db, "stories", bookId), {
      startChapterId: selectedChapterId,
    });
    setStartChapterId(selectedChapterId);
    alert("Start chapter updated!");
  };

  const handleDeleteChapter = async () => {
    if (!selectedChapterId) return;
    const confirmed = confirm("Are you sure you want to delete this chapter?");
    if (!confirmed) return;
    await deleteDoc(doc(db, "stories", bookId, "chapters", selectedChapterId));
    setChapters((prev) => prev.filter((chap) => chap.id !== selectedChapterId));
    setSelectedChapterId(null);
    setChapterTitle("");
    setBodyText("");
    setOptions([{ text: "", nextChapterId: "" }]);
  };

  const handleNodeDragStop = async (_, node) => {
    await updateDoc(doc(db, "stories", bookId, "chapters", node.id), {
      position: node.position,
    });
    setChapters((prev) =>
      prev.map((chap) => (chap.id === node.id ? { ...chap, position: node.position } : chap))
    );
  };

  return (
    <ReactFlowProvider>
      <div style={{ display: "flex", height: "100vh", backgroundColor: "#121212", color: "#eee" }}>
        <div style={{ flex: 1, position: "relative" }}>
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
            onNodeDragStop={handleNodeDragStop}
            onNodeClick={(_, node) => handleSelectChapter(node.id)}
          >
            <Background variant="dots" gap={24} size={1} color="#ffffff" />
            <Controls style={{ backgroundColor: "#2a2a2a" }} showInteractive={false} />
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
            <h2 style={{ marginTop: "3rem" }}>Edit Chapter</h2>
            <button
              onClick={handleSetStartChapter}
              style={{ marginBottom: "1rem", backgroundColor: "#006600", color: "#fff", padding: "0.5rem 1rem", border: "none" }}
            >
              📌 Set as Start Chapter
            </button>

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
