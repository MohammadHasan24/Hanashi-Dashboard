// components/EdgeOptionPanel.jsx

import React from "react";

// Sidebar for editing a connection between two chapters (an edge)
export default function EdgeOptionPanel({
  edge,              // selected edge data
  edges,             // full list of edges
  setEdges,          // setter to update all edges
  onClose,           // callback to close panel
  setSelectedEdge,   // setter for selected edge (for checkbox update)
}) {
  return (
    <div style={{ width: "30vw", backgroundColor: "#222", padding: "1.5rem", color: "white" }}>
      <h2>Option Details</h2>

      {/* display source chapter ID */}
      <p><strong>From:</strong> {edge.source}</p>

      {/* display target chapter ID */}
      <p><strong>To:</strong> {edge.target}</p>

      {/* show the label/option text */}
      <p><strong>Choice Text:</strong> {edge.label}</p>

      {/* checkbox to mark this option as "remembered" */}
      <label style={{ display: "block", marginTop: "1rem" }}>
        <input
          type="checkbox"
          checked={edge.remember || false}
          onChange={(e) => {
            const updatedEdges = edges.map((ed) =>
              ed.id === edge.id
                ? { ...ed, remember: e.target.checked } // update just this edge
                : ed
            );
            setEdges(updatedEdges); // update state
            setSelectedEdge((prev) => ({ ...prev, remember: e.target.checked })); // also update selected edge
          }}
        />
        Remember this choice for later
      </label>

      {/* close the panel */}
      <button
        style={{ marginTop: "1rem", backgroundColor: "#555", color: "#fff", padding: "0.5rem 1rem" }}
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
}
