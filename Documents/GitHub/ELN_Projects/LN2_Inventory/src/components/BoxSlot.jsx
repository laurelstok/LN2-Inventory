import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import Vial, { ItemTypes } from './Vial';

// Helper: check if content is a valid vial object
const isValidVial = (content) => {
    return content && typeof content === 'object' && Object.keys(content).length > 0;
};

export default function BoxSlot({ 
    row, 
    col, 
    content, 
    onDropVial, 
    onRemoveVial, 
    onDragClear,
    currentCoords,

    // ⭐ NEW: selection handlers
    onClickVial,
}) {
    
    const [isHovered, setIsHovered] = useState(false);

    const [{ isOver, canDrop }, drop] = useDrop(
        () => ({
            accept: [ItemTypes.VIAL, ItemTypes.VIAL_BATCH],
            drop: (item, monitor) => {
                if (!isValidVial(content)) {
                    onDropVial(item, monitor.getItemType());
                    return { row: currentCoords.rowIndex, col: currentCoords.colIndex };
                }
                return undefined;
            },
            canDrop: () => !isValidVial(content),
            collect: (monitor) => ({
                isOver: monitor.isOver(),
                canDrop: monitor.canDrop(),
            }),
        }),
        [content, onDropVial]
    );

    const slotStyle = {
        width: '55px',
        height: '55px',
        border: '1px solid #ccc',
        backgroundColor: '#f1f5f9',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: isHovered ? 150 : 1,
        boxShadow: isOver && canDrop ? '0 0 5px 3px #3b82f6' : 'none',
        borderColor: isOver && canDrop ? '#3b82f6' : '#ccc',
    };

    const shouldDisplayVial = isValidVial(content);

    return (
        <div
            ref={drop}
            style={slotStyle}
            title={`Slot ${row}${col}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {shouldDisplayVial && (
                <div
                    // ⭐ NEW: Capture click for vial selection
                    onClick={(e) => {
                        // Do NOT trigger when the X button is clicked
                        if (e.target.closest('.vial-remove-btn')) return;

                        if (onClickVial) {
                            onClickVial(e, content);
                        }
                        e.stopPropagation();
                    }}
                    style={{ width: '100%', height: '100%' }}
                >
                    <Vial
                        vialData={content}
                        isPlaced={true}
                        onRemove={() => onRemoveVial(content.id)}
                        onDragClear={onDragClear}
                        currentCoords={currentCoords}
                    />
                </div>
            )}

            {!shouldDisplayVial && isOver && canDrop && (
                <span style={{ fontSize: '0.6rem', color: '#3b82f6' }}>Drop Here</span>
            )}
        </div>
    );
}
