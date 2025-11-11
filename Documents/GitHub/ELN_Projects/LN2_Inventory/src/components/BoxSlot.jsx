import React, { useState } from 'react'; // <-- FIX: MUST IMPORT useState
import { useDrop } from 'react-dnd';
import Vial, { ItemTypes } from './Vial'; // Import ItemTypes from Vial.jsx

// Helper function to check if content is a valid, non-empty vial object
const isValidVial = (content) => {
    // Must be non-null, an object, and have at least one key (data)
    return content && typeof content === 'object' && Object.keys(content).length > 0;
};

export default function BoxSlot({ 
    row, 
    col, 
    content, 
    onDropVial, 
    onRemoveVial, 
    onDragClear,
    currentCoords 
}) {
    
    // ⭐ FIX 1: Add state to track hover for z-index elevation
    const [isHovered, setIsHovered] = useState(false);

    // 1. Setup Drop Hook
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: [ItemTypes.VIAL, ItemTypes.VIAL_BATCH],
        drop: (item, monitor) => {
            // Only handle drop if the slot is empty
            if (!isValidVial(content)) { // Use the robust check here too
                onDropVial(item, monitor.getItemType());
                
                // Return coordinates for the Vial.jsx cleanup logic
                return { row: currentCoords.rowIndex, col: currentCoords.colIndex };
            }
            return undefined;
        },
        canDrop: (item, monitor) => !isValidVial(content), // Only allow drop if the slot is empty
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    }), [content, onDropVial]);

    // 2. Conditional Styling
    const slotStyle = {
        width: '55px',
        height: '55px',
        border: '1px solid #ccc',
        backgroundColor: '#f1f5f9', // Light gray background
        position: 'relative',
        
        // Use Flexbox to perfectly center the circular Vial
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center', 
        
        // ⭐ FIX 2: Elevate the zIndex of the entire slot when its content is hovered.
        // This ensures the Vial's absolute-positioned tooltip floats over adjacent slots.
        zIndex: isHovered ? 150 : 1, 
        
        // Drop highlight
        boxShadow: isOver && canDrop ? '0 0 5px 3px #3b82f6' : 'none', 
        borderColor: isOver && canDrop ? '#3b82f6' : '#ccc',
    };

    const dragRef = drop;

    // Check if the slot should display a vial
    const shouldDisplayVial = isValidVial(content);

    return (
        <div 
            ref={dragRef} 
            style={slotStyle} 
            title={`Slot ${row}${col}`}
            // ⭐ FIX 3: Add hover handlers to the entire slot
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {shouldDisplayVial && (
                <Vial 
                    vialData={content} 
                    isPlaced={true} 
                    onRemove={() => onRemoveVial(content.id)} 
                    onDragClear={onDragClear}
                    currentCoords={currentCoords}
                />
            )}
            {!shouldDisplayVial && isOver && canDrop && (
                <span style={{ fontSize: '0.6rem', color: '#3b82f6' }}>Drop Here</span>
            )}
        </div>
    );
}
