// pages/writerDashboard/[id].js

// Core React and hooks
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

// React Flow imports for graph UI
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

// Firebase Firestore methods
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

// Custom Components
import ChapterEditorPanel from "../../components/ChapterEditorPanel";
import EdgeOptionPanel from "../../components/EdgeOptionPanel";
import StoryFlowCanvas from "../../components/StoryFlowCanvas";
import TopNavButtons from "../../components/TopNavButtons";

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
  const [selectedOptionEdge, setSelectedOptionEdge] = useState(null);

  // Add a new chapter instantly with blank content and temporary ID
  const handleAddNewChapter = async () => {
    const tempId = `temp-${Date.now()}`;
    const tempChapter = {
      id: tempId,
      title: "",
      body: [""],
      options: [{ text: "", nextChapterId: "" }],
      position: { x: 100, y: chapters.length * 200 },
    };
    setChapters((prev) => [...prev, tempChapter]);
    setSelectedChapterId(tempId);
    setChapterTitle("");
    setBodyText("");
    setOptions([{ text: "", nextChapterId: "" }]);

    const docRef = await addDoc(collection(db, "stories", bookId, "chapters"), {
      title: "",
      body: [""],
      options: [{ text: "", nextChapterId: "" }],
      createdAt: serverTimestamp(),
      position: tempChapter.position,
    });

    setChapters((prev) =>
      prev.map((c) =>
        c.id === tempId ? { ...c, id: docRef.id } : c
      )
    );
  };

  // Add a chapter linked from another
  const handleAddLinkedChapter = async (node) => {
    const tempId = `temp-${Date.now()}`;
    const newChapter = {
      id: tempId,
      title: "",
      body: [""],
      options: [],
      position: { x: node.position.x, y: node.position.y + 200 },
    };

    const chapterRef = doc(db, "stories", bookId, "chapters", node.id);
    const chapterSnap = await getDoc(chapterRef);
    const currentData = chapterSnap.data();
    const currentOptions = currentData?.options || [];
    const updatedOptions = [...currentOptions, { text: "", nextChapterId: tempId }];

    setChapters((prev) =>
      prev.map((c) =>
        c.id === node.id ? { ...c, options: updatedOptions } : c
      ).concat(newChapter)
    );

    const docRef = await addDoc(collection(db, "stories", bookId, "chapters"), {
      title: "",
      body: [""],
      options: [],
      createdAt: serverTimestamp(),
      position: newChapter.position,
    });

    setChapters((prev) =>
      prev.map((c) =>
        c.id === tempId
          ? { ...c, id: docRef.id }
          : c.id === node.id
          ? {
              ...c,
              options: c.options.map((opt) =>
                opt.nextChapterId === tempId ? { ...opt, nextChapterId: docRef.id } : opt
              ),
            }
          : c
      )
    );

    await updateDoc(chapterRef, {
      options: updatedOptions.map((opt) =>
        opt.nextChapterId === tempId ? { ...opt, nextChapterId: docRef.id } : opt
      ),
    });
  };

  // Fetch chapters
  useEffect(() => {
    if (!bookId) return;
    const fetchChapters = async () => {
      const bookDoc = await getDoc(doc(db, "stories", bookId));
      const bookData = bookDoc.data();
      setStartChapterId(bookData?.startChapterId || null);

      const snapshot = await getDocs(collection(db, "stories", bookId, "chapters"));
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

// 🔹 Save updates to chapter (title, body, options)
const handleSaveChapter = async () => {
  if (!selectedChapterId) return;

  await updateDoc(doc(db, "stories", bookId, "chapters", selectedChapterId), {
    title: chapterTitle,
    body: bodyText.split("\n\n"),
    options: options,
  });

  setChapters((prev) =>
    prev.map((chap) =>
      chap.id === selectedChapterId
        ? { ...chap, title: chapterTitle, body: bodyText.split("\n\n"), options }
        : chap
    )
  );
};

// 🔹 Delete chapter and remove from state
const handleDeleteChapter = async () => {
  if (!selectedChapterId) return;

  await deleteDoc(doc(db, "stories", bookId, "chapters", selectedChapterId));

  setChapters((prev) => prev.filter((chap) => chap.id !== selectedChapterId));
  setSelectedChapterId(null);
  setChapterTitle("");
  setBodyText("");
  setOptions([{ text: "", nextChapterId: "" }]);
};


// 🔹 Set a chapter as the start chapter
const handleSetStartChapter = async (chapterId) => {
  await updateDoc(doc(db, "stories", bookId), {
    startChapterId: chapterId,
  });
  setStartChapterId(chapterId);
};


  // 🔹 Handle selecting a chapter node
const handleSelectChapter = async (id) => {
  setSelectedOptionEdge(null);
  setSelectedChapterId(id);

  const chapterDoc = await getDoc(doc(db, "stories", bookId, "chapters", id));
  const chapterData = chapterDoc.data();

  setChapterTitle(chapterData.title || "");
  setBodyText((chapterData.body || [""]).join("\n\n"));
  setOptions(chapterData.options || [{ text: "", nextChapterId: "" }]);
};


  // Create flow graph
  useEffect(() => {
    const chapterIdSet = new Set(chapters.map((chap) => chap.id));

    const newNodes = chapters.map((chap, index) => {
      const isEnding = !chap.options || chap.options.every((o) => !o.nextChapterId);
      const isDeadEnd = chap.options?.some((o) => o.nextChapterId && !chapterIdSet.has(o.nextChapterId));
      const isStart = chap.id === startChapterId;

      const handleNodeDragStop = async (_, node) => {
  if (!node?.id) return;

  await updateDoc(doc(db, "stories", bookId, "chapters", node.id), {
    position: node.position,
  });

  setChapters((prev) =>
    prev.map((chap) =>
      chap.id === node.id ? { ...chap, position: node.position } : chap
    )
  );
};

      return {
        id: chap.id,
        data: {
          label: (
            <div
              className="chapter-node"
              style={{ position: "relative", textAlign: "center", padding: "1rem" }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget.querySelector(".floating-plus");
                if (btn) {
                  btn.style.display = "block";
                  btn.style.opacity = "1";
                  btn.style.transform = "translate(-50%, 0px)";
                }
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget.querySelector(".floating-plus");
                if (btn) {
                  btn.style.opacity = "0";
                  btn.style.transform = "translate(-50%, -10px)";
                  setTimeout(() => (btn.style.display = "none"), 300);
                }
              }}
            >
              <div>
                {isStart && <span style={{ color: "#00cc66", marginRight: 4 }}>🟢</span>}
                {isEnding && <span style={{ color: "#ff4444", marginRight: 4 }}>🔥</span>}
                {chap.title || ""}
              </div>
              <button
                className="floating-plus"
                onClick={() => handleAddLinkedChapter(chap)}
                style={{
                  position: "absolute",
                  bottom: -22,
                  left: "50%",
                  transform: "translate(-50%, -10px)",
                  background: "#fff",
                  color: "#000",
                  border: "1px solid #999",
                  borderRadius: "6px",
                  padding: "6px 10px",
                  fontSize: "16px",
                  display: "none",
                  opacity: 0,
                  zIndex: 10,
                  cursor: "pointer",
                  transition: "opacity 0.3s ease, transform 0.3s ease",
                }}
              >
                +
              </button>
            </div>
          ),
        },
        position: chap.position || { x: 100, y: 100 + index * 200 },
        style: {
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
      chap.options?.forEach((opt, i) => {
        if (opt.nextChapterId) {
          newEdges.push({
            id: `${chap.id}-${opt.nextChapterId}-${i}`,
            source: chap.id,
            target: opt.nextChapterId,
            label: opt.text,
            animated: true,
            style: {
              stroke: opt.remember ? "#00ff99" : "#ffcc00",
              filter: opt.remember ? "drop-shadow(0 0 8px #00ff99)" : "none",
              strokeWidth: 3,
            },
            labelStyle: {
              fill: opt.remember ? "#00ff99" : "#ffcc00",
              fontSize: 12,
              fontWeight: "bold",
            },
            remember: opt.remember || false,
          });
        }
      });
    });
    setEdges(newEdges);
  }, [chapters, startChapterId]);

const handleNodeDragStop = async (_, node) => {
  if (!node?.id) return;

  await updateDoc(doc(db, "stories", bookId, "chapters", node.id), {
    position: node.position,
  });

  setChapters((prev) =>
    prev.map((chap) =>
      chap.id === node.id ? { ...chap, position: node.position } : chap
    )
  );
};



  return (
    <ReactFlowProvider>
      <div style={{ display: "flex", height: "100vh", backgroundColor: "#121212", color: "#eee" }}>
        {/* Top buttons */}
        <TopNavButtons router={router} onAddNewChapter={handleAddNewChapter} />

        {bookId && (
  <StoryFlowCanvas
    bookId={bookId}
    chapters={chapters}
    setChapters={setChapters}
    nodes={nodes}
    setNodes={setNodes}
    onNodesChange={onNodesChange}
    edges={edges}
    setEdges={setEdges}
    onEdgesChange={onEdgesChange}
    startChapterId={startChapterId}
    setSelectedChapterId={setSelectedChapterId}
    setSelectedOptionEdge={setSelectedOptionEdge}
    onNodeDragStop={handleNodeDragStop}
    handleSelectChapter={handleSelectChapter}
  />
)}


        {/* Right panel: chapter editor */}
        {selectedChapterId && (
          <ChapterEditorPanel
            chapterTitle={chapterTitle}
            setChapterTitle={setChapterTitle}
            bodyText={bodyText}
            setBodyText={setBodyText}
            options={options}
            setOptions={setOptions}
            chapters={chapters}
            onClose={() => setSelectedChapterId(null)}
            onSetStartChapter={handleSetStartChapter}
            onSave={handleSaveChapter}
            onDelete={handleDeleteChapter}
          />
        )}

        {/* Right floating panel: edge editor */}
        {selectedOptionEdge && (
          <EdgeOptionPanel
            edge={selectedOptionEdge}
            edges={edges}
            setEdges={setEdges}
            onClose={() => setSelectedOptionEdge(null)}
            setSelectedEdge={setSelectedOptionEdge}
          />
        )}
      </div>
    </ReactFlowProvider>
  );
}

