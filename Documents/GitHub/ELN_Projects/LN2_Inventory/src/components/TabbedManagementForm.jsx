// TabbedManagementForm.jsx ✅ Corrected Version

import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus, FaBox, FaVial, FaInfoCircle, FaTimes } from "react-icons/fa";
import VialForm from "./VialForm"; 

export default function TabbedManagementForm({
  editingTarget,
  isEditingContents,
  onEditBoxContents,
  onSubmit, // Box metadata updates
  onClearSelection,
  onAddNewBox,
  onAddNewVial,
  onUpdateVials, // NEW: for editing vials
  moveToUnplaced,
  showDeleteConfirm,
}) {
  const [activeTab, setActiveTab] = useState("add"); 
  const [formState, setFormState] = useState({ label: "", dimensions: "9x9" });
  const [vialFormState, setVialFormState] = useState({
    label: "",
    experimentName: "",
    species: "",
    cellType: "",
    freezeDate: "",
    conc: "",
    owner: "",
    quantity: 1,
  });

  const [vialFormKey, setVialFormKey] = useState(0); // For remounting VialForm

  const isBoxSelected = editingTarget?.type === 'box' && editingTarget.data;
  const isVialSelected = editingTarget?.type === 'vial' && editingTarget.data;
  const isVialBatchSelected = editingTarget?.type === 'vial_batch' && editingTarget.data;
  const isVialMultiSelected = editingTarget?.type === 'vial_multi';

  // Corrected: unified isEditing for VialForm
  const isEditing = editingTarget && ["vial", "vial_multi", "vial_batch"].includes(editingTarget.type);

  // --- EFFECT: Load data when editingTarget changes ---
  useEffect(() => {
    if (isBoxSelected) { 
      setActiveTab("edit");
      setFormState({
        label: editingTarget.data.label || "",
        dimensions: editingTarget.data.dimensions || "9x9"
      });
    } else if (isVialSelected) {
      setActiveTab("vial");
      setVialFormState({ ...editingTarget.data });
    } else if (isVialBatchSelected) {
      setActiveTab("vial");
      setVialFormState(editingTarget.data.vials?.[0] || {}); // first vial as template
    } else if (isVialMultiSelected) {
      setActiveTab("vial");
      setVialFormState(editingTarget.data?.[0] || {});
    } else if (activeTab === "edit" || activeTab === "vial") {
      setActiveTab("add");
      setFormState({ label: "", dimensions: "9x9" });
      setVialFormState({
        label: "",
        experimentName: "",
        species: "",
        cellType: "",
        freezeDate: "",
        conc: "",
        owner: "",
        quantity: 1,
      });
    }
  }, [editingTarget]);

  // --- Handlers ---
  const handleChange = (e) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleAddBoxSubmit = (e) => {
    e.preventDefault();
    onAddNewBox(formState.label, formState.dimensions); 
    setFormState({ label: "", dimensions: "9x9" });
  };

  // Handle VialForm submit (add new or edit)
  const handleVialFormSubmit = (vialData, isUpdate) => {
    if (isUpdate) {
      // Patch vials using onUpdateVials
      const { quantity, ...metadata } = vialData; // remove quantity for edits
      onUpdateVials(metadata);
    } else {
      onAddNewVial(vialData);
    }
    setVialFormKey(prev => prev + 1); // reset form
  };

  // Handle Box metadata inline update
  const handleMetadataUpdate = (newValues) => {
    onSubmit(newValues, true);
  };

  // --- Local Render Functions ---
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
      <button type="submit" style={{ padding: 8, backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: 4 }}>
        <FaPlus style={{ marginRight: 5 }} /> Create Box
      </button>
    </form>
  );

  const renderSelectedBoxActions = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h4 style={{ margin: '0 0 5px 0' }}>Box Actions</h4>
      <p style={{ margin: 0, fontSize: '0.9em', color: '#666' }}>
        Location: {editingTarget.data.towerId ? `Tower ${editingTarget.data.towerId}` : 'Unplaced'}
      </p>

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

      <label style={{ fontWeight: 'bold' }}>Dimensions:
        <select 
          name="dimensions" 
          value={formState.dimensions} 
          onChange={(e) => {
            handleChange(e);
            handleMetadataUpdate({ ...formState, dimensions: e.target.value });
          }}
          style={{ marginTop: 5, padding: 5, width: '100%' }}
        >
          <option value="9x9">9x9</option>
          <option value="10x10">10x10</option>
        </select>
      </label>

      <hr style={{ borderTop: '1px solid #ddd' }}/>

      <button onClick={onEditBoxContents} style={{ padding: 8, backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 4 }}>
        <FaVial style={{ marginRight: 8 }} /> Edit Contents
      </button>
      <button onClick={() => moveToUnplaced(editingTarget.data)} style={{ padding: 8, backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: 4 }}>
        <FaBox style={{ marginRight: 8 }} /> Move to Unplaced
      </button>
      <button onClick={() => showDeleteConfirm(editingTarget.data)} style={{ padding: 8, backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: 4 }}>
        <FaTrash style={{ marginRight: 8 }} /> Delete Box
      </button>
      <button onClick={onClearSelection} style={{ background: 'none', border: 'none', marginTop: 10, color: '#666', cursor: 'pointer' }}>
        <FaTimes style={{ marginRight: 4 }} /> Clear Selection
      </button>
    </div>
  );

  // --- Main Render ---
  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16 }}>
      {/* Tabs */}
      <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
        <button onClick={() => setActiveTab("add")} disabled={isEditingContents} style={{ flex: 1, padding: 8, backgroundColor: activeTab === "add" ? "#2563eb" : "#e0e0e0", color: activeTab === "add" ? "#fff" : "#000", border: "none", borderRadius: 4, cursor: "pointer" }}>Add Box</button>
        <button onClick={() => setActiveTab("edit")} disabled={!isBoxSelected || isEditingContents} style={{ flex: 1, padding: 8, backgroundColor: activeTab === "edit" ? "#2563eb" : "#e0e0e0", color: activeTab === "edit" ? "#fff" : "#000", border: "none", borderRadius: 4, cursor: "pointer" }}>Box Actions</button>
        <button onClick={() => setActiveTab("vial")} style={{ flex: 1, padding: 8, backgroundColor: activeTab === "vial" ? "#2563eb" : "#e0e0e0", color: activeTab === "vial" ? "#fff" : "#000", border: "none", borderRadius: 4, cursor: "pointer" }}>Vial Management</button>
      </div>

      {activeTab === "add" && renderAddBoxForm()}

      {activeTab === "vial" && (
        <VialForm
          key={vialFormKey}
          formState={vialFormState}
          setFormState={setVialFormState}
          onSubmitVial={handleVialFormSubmit}
          isEditing={isEditing}
          onCancelEdit={onClearSelection}
        />
      )}

      {activeTab === "edit" && (
        isBoxSelected ? renderSelectedBoxActions() : (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#666' }}>
            <FaInfoCircle style={{ marginBottom: 5 }} /> <br/>
            Select a box to view its actions.
          </div>
        )
      )}
    </div>
  );
}
