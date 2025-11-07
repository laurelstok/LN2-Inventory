// Vial.jsx

import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { FaMicroscope, FaTimes } from 'react-icons/fa'; 

// Define the type for the draggable item (must match the drop target)
const ItemTypes = {
  VIAL: 'vial',
  VIAL_BATCH: 'vial_batch', // New type for vial batches
};

// Export ItemTypes so other D&D components can reference it
export { ItemTypes };

// Styling for the hover tooltip (defined outside for clarity and performance)
const tooltipStyle = {
    position: 'absolute',
    left: '100%', 
    top: '50%',
    transform: 'translate(10px, -50%)', 
    zIndex: 10,
    backgroundColor: '#334155', 
    color: 'white',
    padding: '8px 12px',
    borderRadius: '6px',
    minWidth: '180px', 
    pointerEvents: 'none', 
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
};

export default function Vial({ vialData, isPlaced = false, onRemove, onDragClear, currentCoords }) {
    
  // State to control the visibility of the tooltip
  const [isHovered, setIsHovered] = useState(false);

  // Helper to format the date
  const formatDate = (dateString) => {
    // Guard against missing vialData or date string
    if (!vialData || !dateString) return 'N/A'; 
    try {
        return new Date(dateString).toLocaleDateString();
    } catch (e) {
        return dateString;
    }
  };

  // 1. Setup Drag Hook 
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.VIAL,
    // Safely use an empty object if vialData is undefined during lifecycle cleanup
    item: vialData || {}, 
    
    // Logic to clear source slot only after a successful drop
    end: (item, monitor) => {
        const dropResult = monitor.getDropResult();
        if (dropResult?.row && dropResult?.col) {
            if (isPlaced && onDragClear) {
                onDragClear(); 
            }
        } 
    },
    
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [vialData, isPlaced, onDragClear, currentCoords]); 
  
  // 2. Conditional Styling
  const style = {
    // Styling for circular shape (FIXED)
    width: isPlaced ? '80%' : 'auto', 
    height: isPlaced ? 'auto' : 'auto', 
    aspectRatio: isPlaced ? '1/1' : 'auto', 

    padding: isPlaced ? 0 : '4px 8px', 
    margin: isPlaced ? 'auto' : '4px', 

    borderRadius: isPlaced ? '50%' : '4px', 

    backgroundColor: isPlaced ? '#10b981' : '#2563eb', 
    color: 'white',
    cursor: 'move',
    // Drag visibility fix: make it semi-transparent
    opacity: isDragging ? 0.4 : 1, 
    
    // Drag visibility fix: Ensure it's on top
    zIndex: isDragging ? 100 : 1,

    display: 'flex',
    alignItems: 'center',
    justifyContent: isPlaced ? 'center' : 'flex-start',
    fontSize: isPlaced ? '0.6rem' : '0.8rem',
    fontWeight: 'bold',
    position: 'relative', 
    boxShadow: 'none', 
  };
  
  const dragRef = drag;

  return (
    <div 
        ref={dragRef} 
        style={style}
        // ADD HOVER HANDLERS HERE
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      
      {isPlaced ? (
        <>
            {/* Use optional chaining everywhere for stability */}
            {/* Show only a small identifier when placed */}
            {vialData?.experimentName ? vialData.experimentName.substring(0, 3).toUpperCase() : 'V'}
            
            {/* CONDITIONAL TOOLTIP RENDER */}
            {isHovered && (
                <div style={tooltipStyle}>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.8rem' }}>
                        {vialData?.experimentName || 'Unnamed Vial'}
                    </p>
                    <hr style={{ margin: '4px 0', borderColor: '#475569' }}/>
                    
                    {/* Species and Cell Type */}
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem' }}>
                        **Species:** {vialData?.species || 'N/A'}
                    </p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem' }}>
                        **Cell Type:** {vialData?.cellType || 'N/A'}
                    </p>

                    {/* NEW FIELDS ADDED HERE */}
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem' }}>
                        **Frozen:** {formatDate(vialData?.freezeDate)}
                    </p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem' }}>
                        **Conc.:** {vialData?.concentration || 'N/A'}
                    </p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem' }}>
                        **Owner:** {vialData?.owner || 'N/A'}
                    </p>
                </div>
            )}
            
            {/* Remove Button for Placed Vials (X button logic) */}
            {onRemove && (
                <button 
                  onClick={(e) => {
                      e.stopPropagation(); // Prevents drag from starting
                      onRemove();
                  }}
                  style={{ 
                    position: 'absolute',
                    top: -1,
                    right: -1,
                    // Visible dark red background fix
                    background: 'rgba(220, 38, 38, 0.7)', 
                    border: 'none', 
                    color: 'white', 
                    cursor: 'pointer',
                    fontSize: '0.6rem',
                    padding: 0,
                    lineHeight: '10px',
                    borderRadius: '9999px', 
                    width: '12px',
                    height: '12px',
                  }}
                  title="Remove Vial"
                >
                  <FaTimes />
                </button>
            )}
        </>
      ) : (
        <>
            {/* Full content for unplaced vials */}
            <FaMicroscope style={{ marginRight: 5 }} />
            {vialData?.experimentName || 'Unnamed Vial'}
        </>
      )}
    </div>
  );
}
