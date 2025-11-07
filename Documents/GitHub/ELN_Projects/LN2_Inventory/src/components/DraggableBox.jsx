// DraggableBox.jsx (Finalized for Dragging)

import { useDrag } from "react-dnd";

// The corrected item type
export const ITEM_TYPE = "box"; 

export default function DraggableBox({ box, towerId, slotIndex }) {
  // We removed onSelectBox and onDrop from props since this component's sole job is dragging.
  // The drop handling happens in TowerSlot.jsx, and selection handling happens in TowerSlot.jsx onClick.

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { 
        // Payload must carry enough info to identify source and destination
        box: box, 
        towerId: towerId, 
        slotIndex: slotIndex 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [box, towerId, slotIndex]);

  return (
    <div
      // ⭐ CRITICAL 1: Apply the drag ref directly to the box container
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab", // Use grab cursor to indicate drag
        padding: 8,
        border: "1px solid gray",
        borderRadius: 4,
        backgroundColor: "#f3f4f6",
        color: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        userSelect: "none",
        width: '100%' // Ensure it fills the slot for easier grabbing
      }}
    >
      {/* ⭐ CRITICAL 2: The content should be simple and not interfere */}
      <span>{box.label}</span>
    </div>
  );
}