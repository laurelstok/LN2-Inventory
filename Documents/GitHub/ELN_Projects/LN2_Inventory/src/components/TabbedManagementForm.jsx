// TabbedManagementForm.jsx 🚀 (Finalized Version)

import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus, FaBox, FaVial, FaInfoCircle, FaTimes } from "react-icons/fa";
import VialForm from "./VialForm"; 


export default function TabbedManagementForm({
  editingTarget,
  isEditingContents,
  onEditBoxContents,
  onSubmit, // Used for Box metadata updates
  onClearSelection,
  onAddNewBox, // Used for creating new boxes
  onAddNewVial, // Used for creating new vial batches
  moveToUnplaced,
  showDeleteConfirm,
}) {
    // 'add', 'edit', or 'vial'
    const [activeTab, setActiveTab] = useState("add"); 
    
    // State for the Box metadata/Add New Box form
    const [formState, setFormState] = useState({ 
        label: "", 
        dimensions: "9x9" 
    });
    
    // Check if a box is actively selected
    const boxSelected = editingTarget?.data;
    
    // --- EFFECTS ---

    // Effect to switch tab and load data when a box is selected
    useEffect(() => {
        if (editingTarget?.data) { 
            // Switch to the 'edit' tab to show box actions
            setActiveTab("edit");
            // Load selected box data into local form state for inline editing
            setFormState({
                label: editingTarget.data.label || "",
                dimensions: editingTarget.data.dimensions || "9x9",
            });
        } else if (activeTab === "edit") {
            // If selection is cleared, return to "add" mode
            setActiveTab("add");
            setFormState({ label: "", dimensions: "9x9" });
        }
    }, [editingTarget]);

    // --- HANDLERS ---
    
    const handleChange = (e) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    // Handler for NEW Box creation (from the 'add' tab)
    const handleAddBoxSubmit = (e) => {
        e.preventDefault();
        
        onAddNewBox(formState.label, formState.dimensions); 
        
        // Reset form for new box creation
        setFormState({ label: "", dimensions: "9x9" });
    };
    
    const [vialFormKey, setVialFormKey] = useState(0); // Add a key state

    // Handler for Vial Form submission
    const handleVialSubmit = (vialData, isUpdate) => {
        if (!isUpdate) {
          // 1. Cal the global handler to add the new batch
            onAddNewVial((vialData));
          // 2. Increment the key to force the VialForm component to remount
          // This effectively resets its internal state for the next batch.
          setVialFormKey(prev => prev + 1);

          // You may also want to switch tabs back to 'add' or show a success message
          // setActiveTab("add");
        }
    };

    // Handler for inline metadata changes (calls the global onSubmit/update handler)
    const handleMetadataUpdate = (newValues) => {
        // Use the global onSubmit handler to update the box's metadata
        onSubmit(newValues, true); // true = isUpdate
    };
    
    // --- LOCAL RENDER FUNCTIONS ---
    
    // 🌟 1. Renders the Add New Box form
    const renderAddBoxForm = () => (
        <form onSubmit={handleAddBoxSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h4 style={{ margin: 0 }}>Create New Box</h4>
            
            <label>Label:
                <input type="text" name="label" value={formState.label} onChange={handleChange} required />
            </label>
            
            <label>Dimensions:
                <select name="dimensions" value={formState.dimensions} onChange={handleChange}>
                    <option value="9x9">9x9</option>
                    <option value="10x10">10x10</option>
                </select>
            </label>

            <div style={{ marginTop: 10 }}>
                <button type="submit" style={{ padding: '8px 15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: 4 }}>
                    <FaPlus style={{ marginRight: 5 }} /> Create Box
                </button>
            </div>
        </form>
    );
    
    // 🌟 2. Renders the Box Info and Action Buttons (with inline edit)
    const renderSelectedBoxActions = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h4 style={{ margin: '0 0 5px 0' }}>Box Actions</h4>
            <p style={{ margin: 0, fontSize: '0.9em', color: '#666' }}>
                Location: {editingTarget.data.towerId ? `Tower ${editingTarget.data.towerId}` : 'Unplaced'}
            </p>
            
            {/* Inline Editable Label */}
            <label style={{ fontWeight: 'bold' }}>Label:
                <input 
                    type="text" 
                    name="label" 
                    value={formState.label} 
                    onChange={handleChange} 
                    onBlur={() => handleMetadataUpdate(formState)}
                    required 
                    style={{ marginTop: 5, padding: 5, width: '100%' }}
                />
            </label>

            {/* Inline Editable Dimensions */}
            <label style={{ fontWeight: 'bold' }}>Dimensions:
                <select 
                    name="dimensions" 
                    value={formState.dimensions} 
                    onChange={(e) => {
                        handleChange(e); // Update local state
                        // Update global state immediately on dimension change
                        handleMetadataUpdate({ ...formState, dimensions: e.target.value });
                    }}
                    style={{ marginTop: 5, padding: 5, width: '100%' }}
                >
                    <option value="9x9">9x9</option>
                    <option value="10x10">10x10</option>
                </select>
            </label>
            
            <hr style={{ borderTop: '1px solid #ddd' }}/>

            {/* --- ACTION BUTTONS --- */}

            <button 
                onClick={onEditBoxContents}
                style={{ padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 4 }}
                title="Manage Vials (Grid View)"
                disabled={isEditingContents} 
            >
                <FaVial style={{ marginRight: 8 }} /> Edit Contents
            </button>
            
            <button 
                onClick={() => moveToUnplaced(editingTarget.data)}
                disabled={editingTarget.data.towerId === null || isEditingContents} // Disable if editing contents to prevent conflict
                style={{ padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: 4 }}
                title="Move to Unplaced List"
            >
                <FaBox style={{ marginRight: 8 }} /> Move to Unplaced
            </button>
            
            <button 
                onClick={() => showDeleteConfirm(editingTarget.data)}
                disabled={isEditingContents} // Disable if editing contents
                style={{ padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: 4 }}
                title="Delete Box"
            >
                <FaTrash style={{ marginRight: 8 }} /> Delete Box
            </button>
            
            <button 
                onClick={onClearSelection}
                style={{ background: 'none', border: 'none', marginTop: 10, color: '#666', cursor: 'pointer' }}
            >
                <FaTimes style={{ marginRight: 4 }} /> Clear Selection
            </button>
        </div>
    );

    // --- MAIN RENDER ---

    return (
        <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16 }}>
            
            {/* --- TAB CONTROLS --- */}
            <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                <button
                    onClick={() => setActiveTab("add")}
                    disabled={isEditingContents} // Disabled when editing contents
                    style={{ flex: 1, padding: 8, backgroundColor: activeTab === "add" ? "#2563eb" : "#e0e0e0", color: activeTab === "add" ? "#fff" : "#000", border: "none", borderRadius: 4, cursor: "pointer" }}
                >
                    Add Box
                </button>
                
                <button
                    onClick={() => setActiveTab("edit")}
                    disabled={!boxSelected || isEditingContents} // Disabled when no box selected OR editing contents
                    style={{ flex: 1, padding: 8, backgroundColor: activeTab === "edit" ? "#2563eb" : "#e0e0e0", color: activeTab === "edit" ? "#fff" : "#000", border: "none", borderRadius: 4, cursor: "pointer" }}
                >
                    Box Actions
                </button>
                
                <button
                    onClick={() => setActiveTab("vial")}
                    // ⭐ FIX APPLIED: No longer disabled by isEditingContents 
                    style={{ flex: 1, padding: 8, backgroundColor: activeTab === "vial" ? "#2563eb" : "#e0e0e0", color: activeTab === "vial" ? "#fff" : "#000", border: "none", borderRadius: 4, cursor: "pointer" }}
                >
                    Vial Management
                </button>
            </div>

            {/* --- CONTENT BASED ON ACTIVE TAB --- */}
            
            {activeTab === "add" && renderAddBoxForm()}

            {activeTab === "vial" && <VialForm key={vialFormKey}onSubmitVial={handleVialSubmit} />} 

            {activeTab === "edit" && (
                boxSelected ? renderSelectedBoxActions() : (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#666' }}>
                        <FaInfoCircle style={{ marginBottom: 5 }} /> <br/>
                        Select a box to view its actions.
                    </div>
                )
            )}
        </div>
    );
}