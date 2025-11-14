// BoxContentsEditor.jsx (with vial click + multi-select support)

import React, { useState, useEffect } from 'react';
import BoxSlot from './BoxSlot'; 
import { FaSave, FaTimes } from 'react-icons/fa';
import { ItemTypes } from './Vial'; 

const COL_LABELS = ['1','2','3','4','5','6','7','8','9','10'];
const ROW_LABELS = ['A','B','C','D','E','F','G','H','I','J'];

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
    onClearContents,
    
    // ⭐ NEW: selection callbacks injected from App.jsx
    onSelectVial,
    onSelectVialMulti
}) {
    
    const [rows, cols] = box.dimensions.split('x').map(Number);
    
    const [contents, setContents] = useState(
        box.contents?.length > 0 ? box.contents : getInitialContents(box.dimensions)
    );

    useEffect(() => {
        setContents(
            box.contents?.length > 0 ? box.contents : getInitialContents(box.dimensions)
        );
    }, [box.id, box.dimensions, box.contents]);

    const handleClearContents = () => {
        onClearContents(contents);
        setContents(getInitialContents(box.dimensions));
    };

    // --- DROP HANDLERS (unchanged except comments) ---
    const handleDrop = (droppedItem, type, targetCoords) => {
        
        if (type === ItemTypes.VIAL) {
            const vialData = droppedItem;
            const { rowIndex, colIndex } = targetCoords;
            
            setContents(prev => {
                const newContents = prev.map((row, rIdx) => 
                    rIdx === rowIndex ? [...row] : row
                );
                newContents[rowIndex][colIndex] = vialData;
                return newContents;
            });
            
            if (unplacedVials.some(v => v.id === vialData.id)) {
                onVialPlaced(vialData.id);
            }
            
        } else if (type === ItemTypes.VIAL_BATCH) {
            const batchVials = droppedItem.vials;
            const startRow = targetCoords.rowIndex;
            const startCol = targetCoords.colIndex;
            
            setContents(prev => {
                const newContents = prev.map(row => [...row]);

                let vialIndex = 0;
                let placedVialIds = [];

                for (let c = startCol; c < cols; c++) {
                    if (vialIndex >= batchVials.length) break;
                    if (newContents[startRow][c] !== null) continue;

                    const vial = batchVials[vialIndex];
                    newContents[startRow][c] = vial;
                    placedVialIds.push(vial.id);
                    vialIndex++;
                }

                for (let r = startRow + 1; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        if (vialIndex >= batchVials.length) break;
                        if (newContents[r][c] !== null) continue;

                        const vial = batchVials[vialIndex];
                        newContents[r][c] = vial;
                        placedVialIds.push(vial.id);
                        vialIndex++;
                    }
                }

                placedVialIds.forEach(id => onVialPlaced(id));

                return newContents;
            });
        }
    };
    
    const handleClearSlot = (rowIndex, colIndex) => { 
        setContents(prev => {
            const newContents = prev.map((row, rIdx) => {
                if (rIdx !== rowIndex) return row;
                const newRow = [...row];
                newRow[colIndex] = null;
                return newRow;
            });
            return newContents;
        });
    };
    
    const handleRemoveVial = (vialId) => { 
        let removed = null;
        const newContents = contents.map(row =>
            row.map(slot => {
                if (slot?.id === vialId) {
                    removed = slot;
                    return null;
                }
                return slot;
            })
        );
        setContents(newContents);
        if (removed) onVialRemoved(removed);
    };

    // ⭐ NEW — Vial click (single or multi-select)
    const handleVialClick = (e, vial) => {
        if (e.shiftKey) {
            onSelectVialMulti(vial);
        } else {
            onSelectVial(vial);
        }
        e.stopPropagation();
    };

    // --- RENDER ---

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
                
                <div style={{ width: 55 }} /> 
                {activeColLabels.map(label => (
                    <div key={label} style={{ textAlign: 'center', fontWeight: 'bold', padding: 5, fontSize: '0.8em' }}>
                        {label}
                    </div>
                ))}
                
                {activeRowLabels.map((rowLabel, rowIndex) => (
                    <React.Fragment key={rowLabel}>
                        
                        <div 
                            style={{ 
                                fontWeight: 'bold', padding: '0 5px', textAlign: 'right', 
                                lineHeight: '55px', fontSize: '0.8em'
                            }}
                        >
                            {rowLabel}
                        </div>
                        
                        {contents[rowIndex]?.slice(0, cols).map((slotContent, colIndex) => (
                            <BoxSlot 
                                key={`${rowLabel}-${colIndex}`}
                                row={rowLabel}
                                col={colIndex + 1}
                                content={slotContent}

                                onDropVial={(item, type) => handleDrop(item, type, { 
                                    rowIndex, 
                                    colIndex 
                                })}
                                onRemoveVial={handleRemoveVial}
                                onDragClear={() => handleClearSlot(rowIndex, colIndex)} 
                                currentCoords={{ rowIndex, colIndex }} 

                                // ⭐ Pass down vial click handler
                                onClickVial={(e, vial) => handleVialClick(e, vial)}
                            />
                        ))}
                    </React.Fragment>
                ))}
            </div>

            <div style={{ marginTop: 15, display: 'flex', gap: 10 }}>
                
                <button 
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
