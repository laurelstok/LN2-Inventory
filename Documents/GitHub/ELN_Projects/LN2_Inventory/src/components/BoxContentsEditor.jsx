// BoxContentsEditor.jsx (Fully Updated for Batch Auto-Placement at Drop Point)

import React, { useState, useEffect } from 'react';
import BoxSlot from './BoxSlot'; 
import { FaSave, FaTimes } from 'react-icons/fa';
import { ItemTypes } from './Vial'; // Ensure ItemTypes is exported from Vial.jsx

// Helper arrays (remain the same)
const COL_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

// Utility to create an initial empty 2D array (remains the same)
const getInitialContents = (dimensions) => {
    const size = dimensions === '10x10' ? 10 : 9;
    
    return Array.from({ length: size }, () => 
        Array.from({ length: size }, () => null)
    );
};

export default function BoxContentsEditor({ 
    box, 
    unplacedVials, 
    onExit, 
    onSaveContents, 
    onVialPlaced, 
    onVialRemoved,
    onClearContents 
}) {
    
    const [rows, cols] = box.dimensions.split('x').map(Number);
    
    const [contents, setContents] = useState(
        box.contents?.length > 0 ? box.contents : getInitialContents(box.dimensions)
    );
    useEffect(() => {
        setContents(box.contents?.length > 0 ? box.contents : getInitialContents(box.dimensions));
    }, [box.id, box.dimensions, box.contents]);

    // --- HANDLERS ---
    // NEW HANDLER: Resets the local state and calls the global handler
    const handleClearContents = () => {
        // 1. Pass the *current* state of the map to App.jsx for processing (moving vials to unplaced).
        // This is crucial. app.jsx will also update its own global box data to be empty.
        onClearContents(contents);

        // 2. Immediately reset the local contents state to force the map view to empty.
        const emptyContents = getInitialContents(box.dimensions);
        setContents(emptyContents);

    };

    // Handles both single vial and batch drops
    const handleDrop = (droppedItem, type, targetCoords) => {
        
        if (type === ItemTypes.VIAL) {
            // Logic for dropping a single vial (remains the same)
            const vialData = droppedItem;
            const targetRowIndex = targetCoords.rowIndex;
            const targetColIndex = targetCoords.colIndex;
            
            setContents(prevContents => {
                const newContents = prevContents.map((row, rIdx) => 
                    rIdx === targetRowIndex ? [...row] : row
                );
                newContents[targetRowIndex][targetColIndex] = vialData;
                return newContents;
            });
            
            const isFromUnplaced = unplacedVials.some(v => v.id === vialData.id);
            if (isFromUnplaced) {
                onVialPlaced(vialData.id); 
            }
            
        } else if (type === ItemTypes.VIAL_BATCH) {
            
            const batchVials = droppedItem.vials;
            const startRow = targetCoords.rowIndex;
            const startCol = targetCoords.colIndex;
            
            setContents(prevContents => {
                const newContents = prevContents.map(row => [...row]); 

                let vialIndex = 0;
                let placedVialIds = [];

                // ⭐ FIX: Start auto-placement from the dropped slot coordinates
                
                // 1. Handle the slots on the starting row, starting from the drop column
                for (let c = startCol; c < cols; c++) {
                    if (vialIndex >= batchVials.length || newContents[startRow][c] !== null) {
                        continue; // Skip if batch is done or slot is occupied
                    }
                    const vialToPlace = batchVials[vialIndex];
                    newContents[startRow][c] = vialToPlace;
                    placedVialIds.push(vialToPlace.id);
                    vialIndex++;
                }

                // 2. Handle the rest of the rows, starting from the row *after* the drop row
                for (let r = startRow + 1; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        
                        if (vialIndex >= batchVials.length || newContents[r][c] !== null) {
                            continue; // Stop if batch is done or slot is occupied
                        }
                        
                        const vialToPlace = batchVials[vialIndex];
                        newContents[r][c] = vialToPlace;
                        placedVialIds.push(vialToPlace.id);
                        vialIndex++;
                    }
                }
                
                // Notify App.jsx to remove placed vials from the unplaced list
                placedVialIds.forEach(id => onVialPlaced(id));
                
                return newContents;
            });
        }
    };
    
    // Handler for clearing a specific slot (source of a drag move)
    const handleClearSlot = (rowIndex, colIndex) => { 
        setContents(prevContents => {
            const rows = prevContents.length;
            const cols = prevContents[0]?.length || 0;
            
            if (rowIndex < 0 || rowIndex >= rows || colIndex < 0 || colIndex >= cols) {
                console.error("Attempted to clear slot with invalid coordinates.");
                return prevContents;
            }

            const newContents = prevContents.map((row, rIdx) => {
                if (rIdx === rowIndex) {
                    const newRow = [...row];
                    newRow[colIndex] = null;
                    return newRow;
                }
                return row;
            });
            
            return newContents;
        });
    };
    
    // Handler for removing a vial from a slot (called by placed Vial's X button)
    const handleRemoveVial = (vialId) => { 
        let removedVialData = null;
        
        const newContents = contents.map(row => 
            row.map(slot => {
                if (slot?.id === vialId) {
                    removedVialData = slot; 
                    return null;
                }
                return slot;
            })
        );
        setContents(newContents);

        if (removedVialData) {
            onVialRemoved(removedVialData);
        }
    };

    // --- MAIN RENDER ---
    
    const activeColLabels = COL_LABELS.slice(0, cols);
    const activeRowLabels = ROW_LABELS.slice(0, rows);

    return (
        <div style={{ border: '1px solid #ccc', padding: '15px', marginTop: '20px' }}>
            <h3>🔬 Edit Contents: {box.label} ({box.dimensions})</h3>
            
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: `auto repeat(${cols}, 55px)`, 
                gap: 2, 
                maxWidth: 'fit-content',
                margin: '10px 0',
                border: '1px solid #000' 
            }}>
                {/* 1. Top Row (Column Labels) */}
                <div style={{ width: 55 }} /> 
                {activeColLabels.map(label => (
                    <div key={label} style={{ textAlign: 'center', fontWeight: 'bold', padding: 5, fontSize: '0.8em' }}>
                        {label}
                    </div>
                ))}
                
                {/* 2. Grid Slots (Row Labels + Box Slots) */}
                {activeRowLabels.map((rowLabel, rowIndex) => (
                    <React.Fragment key={rowLabel}>
                        {/* Left Column (Row Labels) */}
                        <div 
                            style={{ 
                                fontWeight: 'bold', padding: '0 5px', textAlign: 'right', 
                                lineHeight: '55px', fontSize: '0.8em'
                            }}
                        >
                            {rowLabel}
                        </div>
                        
                        {/* Box Slots */}
                        {contents[rowIndex]?.slice(0, cols).map((slotContent, colIndex) => (
                            <BoxSlot 
                                key={`${rowLabel}-${colIndex}`}
                                row={rowLabel}
                                col={colIndex + 1}
                                content={slotContent}
                                onDropVial={(item, type) => handleDrop(item, type, { 
                                    rowIndex: rowIndex, 
                                    colIndex: colIndex 
                                })}
                                onRemoveVial={handleRemoveVial}
                                onDragClear={() => handleClearSlot(rowIndex, colIndex)} 
                                currentCoords={{ rowIndex, colIndex }} 
                            />
                        ))}
                    </React.Fragment>
                ))}
            </div>

            <div style={{ marginTop: 15, display: 'flex', gap: 10 }}>
                
                {/* ⭐ NEW BUTTON: Clear Box Contents */}
                <button 
                    // Update onClick to call the new local handler
                    onClick={handleClearContents} 
                    style={{ padding: '8px 15px', backgroundColor: '#f97316', color: 'white', border: 'none', borderRadius: 4 }}
                >
                    <FaTimes style={{ marginRight: 5 }} /> Clear All Vials
                </button>
                
                <button 
                    onClick={() => onSaveContents(box.id, contents)}
                    style={{ padding: '8px 15px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: 4 }}
                >
                    <FaSave style={{ marginRight: 5 }} /> Save Contents
                </button>
                <button 
                    onClick={onExit}
                    style={{ padding: '8px 15px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: 4 }}
                >
                    <FaTimes style={{ marginRight: 5 }} /> Exit Editor
                </button>
                    </div>
        </div>  
    );
}