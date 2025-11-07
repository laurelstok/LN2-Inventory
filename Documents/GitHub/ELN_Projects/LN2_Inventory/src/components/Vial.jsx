// Vial.jsx

import React, { useState, useRef, useEffect } from 'react';
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
    left: '100%', // Position next to the disc
    top: '50%',
    transform: 'translate(10px, -50%)', // Move slightly to the right and vertically center
    zIndex: 10,
    backgroundColor: '#334155', // Slate gray background
    color: 'white',
    padding: '8px 12px',
    borderRadius: '6px',
    minWidth: '180px', // Increased width to accommodate more data
    pointerEvents: 'none', // Critical: prevents the tooltip from blocking the mouse
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
};

export default function Vial({ vialData, isPlaced = false, onRemove, onDragClear, currentCoords }) {
    
  // State to control the visibility of the tooltip
  const [isHovered, setIsHovered] = useState(false);
  
  // Create a local ref to hold the DOM element
  const domRef = useRef(null);

  // Helper to format the date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch (e) {
        return dateString;
    }
  };

  // 1. Setup Drag Hook
  // Get the 'preview' function from useDrag
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: ItemTypes.VIAL,
    item: vialData, 
    
    // Logic to clear source slot only after a successful drop (prevents immediate disappearance)
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
  
  // 2. Use effect to manually assign the drag preview with a fixed offset
  useEffect(() => {
    if (isPlaced && domRef.current) {
        // Force the drag preview to be ONLY the current DOM element (40x40 circle)
        // Offset by 20px (half of 40px) to center the cursor exactly over the circle, 
        // which prevents the ghosting of neighboring elements.
        preview(domRef.current, { offsetX: 20, offsetY: 20 });
    }
    // FIX: Include domRef.current and preview in dependencies for reliability
  }, [isPlaced, domRef.current, preview]);

  // 3. Conditional Styling (No change here)
  const style = {
    // GUARANTEED FIX for circular shape
    width: isPlaced ? '80%' : 'auto', 
    height: isPlaced ? 'auto' : 'auto', 
    aspectRatio: isPlaced ? '1/1' : 'auto', 

    padding: isPlaced ? 0 : '4px 8px', 
    margin: isPlaced ? 'auto' : '4px', 

    borderRadius: isPlaced ? '50%' : '4px', 

    backgroundColor: isPlaced ? '#10b981' : '#2563eb', 
    color: 'white',
    cursor: 'move',
    opacity: isDragging ? 0.01 : 1, 
    
    display: 'flex',
    alignItems: 'center',
    justifyContent: isPlaced ? 'center' : 'flex-start',
    fontSize: isPlaced ? '0.6rem' : '0.8rem',
    fontWeight: 'bold',
    position: 'relative', // CRITICAL: Tooltip uses this as reference
    boxShadow: isPlaced ? 'none' : '0 1px 3px rgba(0,0,0,0.2)',
  };
  
  // 4. Assign both the drag function and the local ref to the DOM element
  const combinedRef = (el) => {
      drag(el); // Assign to react-dnd drag source
      domRef.current = el; // Store reference for manual preview
  };

  return (
    <div 
        ref={combinedRef} // Use the combined ref
        style={style}
        // ADD HOVER HANDLERS HERE
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      
      {isPlaced ? (
        <>
            {/* Show only a small identifier when placed */}
            {vialData.experimentName ? vialData.experimentName.substring(0, 3).toUpperCase() : 'V'}
            
            {/* CONDITIONAL TOOLTIP RENDER */}
            {isHovered && (
                <div style={tooltipStyle}>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.8rem' }}>
                        {vialData.experimentName || 'Unnamed Vial'}
                    </p>
                    <hr style={{ margin: '4px 0', borderColor: '#475569' }}/>
                    
                    {/* Species and Cell Type */}
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem' }}>
                        **Species:** {vialData.species || 'N/A'}
                    </p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem' }}>
                        **Cell Type:** {vialData.cellType || 'N/A'}
                    </p>

                    {/* NEW FIELDS ADDED HERE */}
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem' }}>
                        **Frozen:** {formatDate(vialData.freezeDate)}
                    </p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem' }}>
                        **Conc.:** {vialData.concentration || 'N/A'}
                    </p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem' }}>
                        **Owner:** {vialData.owner || 'N/A'}
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
                    // THE FIX: Darker red background with some transparency
                    background: 'rgba(220, 38, 38, 0.7)', // Slightly transparent dark red
                    border: 'none', 
                    color: 'white', 
                    cursor: 'pointer',
                    fontSize: '0.6rem',
                    padding: 0,
                    lineHeight: '10px',
                    borderRadius: '9999px', // Keep button round
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
            {vialData.experimentName || 'Unnamed Vial'}
        </>
      )}
    </div>
  );
}
