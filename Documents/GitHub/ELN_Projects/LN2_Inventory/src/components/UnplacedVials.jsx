// UnplacedVials.jsx

import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import Vial from './Vial';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

const ItemTypes = { VIAL: 'vial', VIAL_BATCH: 'vial_batch' };

// Group vials by batchId
const groupVialsByBatch = (vials) => {
    const batches = {};
    vials.forEach(vial => {
        const batchId = vial.batchId || 'unbatched';
        if (!batches[batchId]) {
            batches[batchId] = {
                header: vial.experimentName || 'Unnamed Batch',
                vials: [],
                batchId,
            };
        }
        batches[batchId].vials.push(vial);
    });
    return Object.values(batches);
};

export default function UnplacedVials({ 
    unplacedVials,

    // ⭐ NEW selection handlers (coming from App.jsx)
    onSelectVial,
    onSelectVialMulti,
    onSelectBatch 
}) {

    const [openBatches, setOpenBatches] = useState({});

    const toggleBatch = (batchId) => {
        setOpenBatches(prev => ({
            ...prev,
            [batchId]: !prev[batchId]
        }));
    };

    const batchedVials = groupVialsByBatch(unplacedVials);

    // =============================
    // ⭐ BATCH HEADER
    // =============================
    const BatchHeader = ({ batch, isOpen, toggleBatch }) => {
        const [{ isDragging }, drag] = useDrag(
            () => ({
                type: ItemTypes.VIAL_BATCH,
                item: { batchId: batch.batchId, vials: batch.vials },
                collect: (monitor) => ({
                    isDragging: monitor.isDragging(),
                }),
            }),
            [batch]
        );

        return (
            <div
                ref={drag}
                style={{
                    padding: '8px 10px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    cursor: 'move',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: isDragging ? 0.4 : 1,
                }}

                // ⭐ NEW — Click batch → select entire batch
                onClick={(e) => {
                    // If clicking while dragging, ignore
                    if (isDragging) return;

                    onSelectBatch(batch.batchId);  // FULL batch selection
                    toggleBatch(batch.batchId);
                    e.stopPropagation();
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {isOpen ? <FaChevronDown style={{ marginRight: 8 }} /> : <FaChevronRight style={{ marginRight: 8 }} />}
                    {batch.header} ({batch.vials.length})
                </div>
            </div>
        );
    };

    // =============================
    // ⭐ MAIN RENDER
    // =============================
    return (
        <div style={{ border: '1px solid #ccc', padding: 15, borderRadius: 8, maxHeight: 400, overflowY: 'auto' }}>
            
            {batchedVials.length === 0 ? (
                <p style={{ color: '#666' }}>No vials waiting for placement.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    
                    {batchedVials.map(batch => {
                        const isOpen = openBatches[batch.batchId];

                        return (
                            <div 
                                key={batch.batchId} 
                                style={{ border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden' }}
                            >
                                <BatchHeader 
                                    batch={batch} 
                                    isOpen={isOpen} 
                                    toggleBatch={toggleBatch} 
                                />

                                {isOpen && (
                                    <div style={{ padding: 5, backgroundColor: '#fff' }}>
                                        {batch.vials.map(vial => (
                                            <div
                                                key={vial.id}

                                                // ⭐ NEW — vial click selection
                                                onClick={(e) => {
                                                    if (e.shiftKey) {
                                                        onSelectVialMulti(vial);   // Add/remove from multi-select
                                                    } else {
                                                        onSelectVial(vial);        // Single selection
                                                    }
                                                    e.stopPropagation();
                                                }}

                                                // ⭐ Keep drag and click separate:
                                                style={{
                                                    cursor: 'pointer',
                                                    padding: 4,
                                                    borderRadius: 4,
                                                    marginBottom: 3,
                                                }}
                                            >
                                                <Vial vialData={vial} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                </div>
            )}
        </div>
    );
}
