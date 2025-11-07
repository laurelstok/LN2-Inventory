// TowerSlot.jsx (Final Corrected Version)

import React from "react";
import { useDrop } from "react-dnd";
import DraggableBox from "./DraggableBox";

// Hardcoding the ITEM_TYPE value to ensure acceptance is 'box'
const BOX_ITEM_TYPE = "box";

export default function TowerSlot({
  box,
  towerId,
  slotIndex,
  onDropBox,
  isSelected,
  onSelectSlot,
}) {
    const [{ canDrop, isOver }, drop] = useDrop({
        // ACCEPT THE EXPLICIT STRING 'BOX' instead of imported constant
    accept: BOX_ITEM_TYPE,

    canDrop: (item) => {
        // Correctly prevents dropping if the slot is occupied
        return !box; 
    },
    drop: (item) => {
        // Item payload is: { box, towerId, slotIndex } from DraggableBox.jsx
        
        // Pass the required SOURCE and DESTINATION objects to App.jsx's moveBox handler
        onDropBox(
            { box: item.box, towerId: item.towerId, slotIndex: item.slotIndex },
            // Destination
            { towerId: towerId, slotIndex: slotIndex }
        );
    },
    collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
    }),
    });

  const isActive = canDrop && isOver;

  return (
    <div
      ref={drop}
      onClick={() => onSelectSlot({ tower: towerId, slot: slotIndex })}
      style={{
        padding: 8,
        marginBottom: 6,
        height: 50,
        
        // --- BACKGROUND COLOR FIX ---
        backgroundColor: isActive
          ? "#a3d8f4"    // Active drop target (Light Blue)
          : isSelected
          ? "#bae6fd"    // Selected (Even Lighter Blue)
          : box
          ? "#f3f4f6"    // Contains Box (Light Grey)
          : "#6b7280",   // ⭐ FIX: Medium Grey for Empty Slots - makes it distinct
          
        border: isSelected ? "2px solid #2563eb" : "1px solid #cccccc",
        borderRadius: 4,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        
        // --- TEXT COLOR FIX ---
        // ⭐ FIX: White text for empty slots (on dark grey background)
        color: box ? "#000" : "#fff", 
        userSelect: "none",
      }}
    >
      {box ? <DraggableBox box={box} towerId={towerId} slotIndex={slotIndex} /> : "Empty"}
    </div>
  );
}