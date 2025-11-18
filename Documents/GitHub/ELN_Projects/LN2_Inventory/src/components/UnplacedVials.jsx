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
    // only add if id not already present
    if (!batches[batchId].vials.find(v => v.id === vial.id)) {
      batches[batchId].vials.push(vial);
    }
  });
  return Object.values(batches);
};


export default function UnplacedVials({ 
    unplacedVials,
    editingTarget,             // ⭐ MUST BE PASSED FROM APP
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
    // BATCH HEADER COMPONENT
    // =============================
    const BatchHeader = ({ batch, isOpen, toggleBatch }) => {

        const isBatchSelected =
            editingTarget?.type === "vial_batch" &&
            editingTarget?.data?.batchId === batch.batchId;

        const [{ isDragging }, drag] = useDrag(
            () => ({
                type: ItemTypes.VIAL_BATCH,
                item: { batchId: batch.batchId, vials: batch.vials },
                collect: monitor => ({
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
                    backgroundColor: isBatchSelected ? '#1d4ed8' : '#2563eb',
                    color: 'white',
                    cursor: 'move',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: isDragging ? 0.4 : 1,
                    border: isBatchSelected ? '2px solid #93c5fd' : '2px solid transparent'
                }}
                onClick={(e) => {
                    if (isDragging) return;
                    onSelectBatch(batch.batchId);
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
    // MAIN RENDER
    // =============================
    console.log("UNPLACED VIALS", unplacedVials);
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
                                style={{
                                    border: '1px solid #ddd',
                                    borderRadius: 4,
                                    overflow: 'hidden'
                                }}
                            >
                                <BatchHeader 
                                    batch={batch}
                                    isOpen={isOpen}
                                    toggleBatch={toggleBatch}
                                />

                                {isOpen && (
                                    <div style={{ padding: 5, backgroundColor: '#fff' }}>
                                        {batch.vials.map(vial => {

                                            // compute whether this vial is selected
                                            const isSelected =
                                                (editingTarget?.type === "vial" && editingTarget.data.id === vial.id) ||
                                                (editingTarget?.type === "vial_multi" && Array.isArray(editingTarget.data) && editingTarget.data.some(v => v.id === vial.id)) ||
                                                (editingTarget?.type === "vial_batch" && Array.isArray(editingTarget.data?.vials) && editingTarget.data.vials.some(v => v.id === vial.id));


                                            return (
                                                <div
                                                    key={vial.id}
                                                    onClick={(e) => {
                                                        if (e.shiftKey){
                                                            onSelectVialMulti(vial);
                                                        } else {
                                                            onSelectVial(vial);
                                                        }
                                                        e.stopPropagation();
                                                    }}
                                                    style={{
                                                        cursor: 'pointer',
                                                        padding: 4,
                                                        borderRadius: 4,
                                                        marginBottom: 3,
                                                        background: isSelected
                                                            ? 'rgba(0, 150, 255, 0.25)'
                                                            : 'transparent',
                                                        border: isSelected
                                                            ? '1px solid #0096ff'
                                                            : '1px solid transparent'
                                                    }}
                                                >
                                                    <Vial vialData={vial} />
                                                </div>
                                            );
                                        })}
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
