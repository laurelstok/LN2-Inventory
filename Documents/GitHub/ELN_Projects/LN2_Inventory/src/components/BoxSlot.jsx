import React from 'react';
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
        
        // ⭐ THE FIX: Use Flexbox to perfectly center the circular Vial
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center', 
        
        // Drop highlight
        boxShadow: isOver && canDrop ? '0 0 5px 3px #3b82f6' : 'none', 
        borderColor: isOver && canDrop ? '#3b82f6' : '#ccc',
    };

    const dragRef = drop;

    // Check if the slot should display a vial
    const shouldDisplayVial = isValidVial(content);

    return (
        <div ref={dragRef} style={slotStyle} title={`Slot ${row}${col}`}>
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
