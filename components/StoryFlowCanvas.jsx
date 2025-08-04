// components/StoryFlowCanvas.jsx

import React from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";

// The main React Flow canvas that renders nodes + edges
export default function StoryFlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeDragStop,
  setSelectedChapterId,
  handleSelectChapter,
  setSelectedOptionEdge,
  bookId,
  chapters,
  setChapters,
}) {
  return (
    <ReactFlow
      nodes={nodes}                         // all nodes to render
      edges={edges}                         // all connections
      onNodesChange={onNodesChange}         // for drag/update/changes
      onEdgesChange={onEdgesChange}         // for updating edge visuals
      onNodeDragStop={onNodeDragStop}       // save node position on drag stop

      // when a node is clicked
      onNodeClick={(_, node) => {
        handleSelectChapter(node.id);       // open chapter editor panel
      }}

      // when an edge is clicked
      onEdgeClick={(_, edge) => {
        setSelectedOptionEdge(edge);        // open edge option panel
      }}
    >
      {/* dotted background for graph look */}
      <Background variant="dots" gap={24} size={1} color="#ffffff" />

      {/* zoom/pan controls */}
      <Controls style={{ backgroundColor: "#2a2a2a" }} showInteractive={false} />
    </ReactFlow>
  );
}
