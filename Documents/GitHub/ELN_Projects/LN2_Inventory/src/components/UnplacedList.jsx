import React from "react";
import DraggableBox from "./DraggableBox";

export default function UnplacedList({ unplacedBoxes, onSelectBox }) {
  if (!unplacedBoxes.length) {
    return (
      <div
        style={{
          padding: 16,
          border: "1px solid #ccc",
          borderRadius: 8,
          minHeight: 100,
          color: "#666",
          fontStyle: "italic",
        }}
      >
        No unplaced boxes
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 12,
        maxHeight: 300,
        overflowY: "auto",
        backgroundColor: "#fafafa",
        color: "#000"
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>Unplaced Items</h3>
      {unplacedBoxes.map((box) => (
        <div
          key={box.id}
          onClick={() => onSelectBox({ tower: null, slot: null, box })}
          style={{
            marginBottom: 8,
            cursor: "pointer",
            color: "#000"
          }}
        >
            <span style={{ flexGrow: 1 }}>{box.label}</span>
            <button
                onClick={() => onSelectBox({ tower: null, slot: null, box })}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16 }}
                title="Edit box"
            >
                🖉
            </button>
          <DraggableBox
            box={box}
            towerId={null} // indicate unplaced
            slotIndex={null}
          />
        </div>
      ))}
    </div>
  );
}
