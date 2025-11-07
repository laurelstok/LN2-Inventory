// UnplacedVials.jsx

import React, { useState } from 'react'; // ⭐ FIX: Must import useState
import { useDrag } from 'react-dnd'; // REQUIRED: Import useDrag
import Vial from './Vial';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
// Ensure ItemTypes is accessible here (may need a separate import if it's not from /fa)
// For simplicity, let's assume it's imported correctly
const ItemTypes = { VIAL: 'vial', VIAL_BATCH: 'vial_batch'}; // Define locally if not shared

// Utility to group vials by batchId
const groupVialsByBatch = (vials) => {
    const batches = {};
    vials.forEach(vial => {
        const batchId = vial.batchId || 'unbatched';
        
        // This logic ensures that if multiple batches have the same experimentName, 
        // they are still tracked separately by their unique batchId.
        if (!batches[batchId]) {
            batches[batchId] = {
                // For simplicity, using experimentName as the header
                header: vial.experimentName || 'Unnamed Batch', 
                vials: [],
                batchId: batchId,
            };
        }
        batches[batchId].vials.push(vial);
    });
    return Object.values(batches);
};

export default function UnplacedVials({ unplacedVials }) {

    // ⭐ FIX: useState is now correctly imported and used here.
    // State to track which batch headers are open/closed
    const [openBatches, setOpenBatches] = useState({});

    const toggleBatch = (batchId) => {
        setOpenBatches(prev => ({
            ...prev,
            [batchId]: !prev[batchId]
        }));
    };

    const batchedVials = groupVialsByBatch(unplacedVials);
    
    //-- Batch Header Component (with Drag) ---
    const BatchHeader = ({ batch, isOpen, toggleBatch }) => {
        const [{ isDragging }, drag] = useDrag(() => ({
            type: ItemTypes.VIAL_BATCH, // Define the new drag type
            item: { batchId: batch.batchId, vials: batch.vials }, // The item carries all vials
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
        }), [batch]);
        
        return (
            <div 
            // Apply the drag ref and cursor
                ref={drag}
                onClick={() => toggleBatch(batch.batchId)}
                style={{
                    padding: '8px 10px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    cursor: 'move', // Indicate it's draggable
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: isDragging ? 0.4 : 1, // Visual feedback when draggin
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {isOpen ? <FaChevronDown style={{ marginRight: 8 }} /> : <FaChevronRight style={{ marginRight: 8 }} />}
                    {batch.header} ({batch.vials.length})
                </div>
            </div>
        );
    };

    // --- Main Return Block ---
return (
        <div style={{ border: '1px solid #ccc', padding: 15, borderRadius: 8, maxHeight: 400, overflowY: 'auto' }}>
            {/* ... (Header and empty state check) ... */}
            
            {batchedVials.length === 0 ? (
                <p style={{ color: '#666' }}>No vials waiting for placement.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {batchedVials.map(batch => {
                        const isOpen = openBatches[batch.batchId];
                        return (
                            <div key={batch.batchId} style={{ border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden' }}>
                                
                                {/* ⭐ Use the new draggable BatchHeader component */}
                                <BatchHeader batch={batch} isOpen={isOpen} toggleBatch={toggleBatch} />
                                
                                {/* Vial List (Contents) */}
                                {isOpen && (
                                    <div style={{ padding: 5, backgroundColor: '#fff' }}>
                                        {batch.vials.map(vial => (
                                            <Vial 
                                                key={vial.id} 
                                                vialData={vial} 
                                            />
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