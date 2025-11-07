// VialForm.jsx 🧪 (Updated for Batch Creation)

import React, { useState, useEffect } from "react";
import { FaPlus, FaTimes } from 'react-icons/fa'; // Import necessary icons

const CELL_TYPES = ["DC", "DE", "HSC", "iPSC", "NK", "PBMC", "T-Cells"];
const SPECIES_TYPES = ["Human", "Mouse", "Other"];
const CONC_OPTIONS = ["1e7", "1e6", "5e5", "Other"];

const initialVialState = {
  experimentName: "",
  cellType: CELL_TYPES[0],
  species: SPECIES_TYPES[0],
  conc: CONC_OPTIONS[0],
  freezeDate: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
  owner: "",
  // ⭐ NEW: Add quantity property for batch creation
  quantity: 1, 
};

export default function VialForm({ onSubmitVial, editingVial, onCancelEdit }) {
  const [formState, setFormState] = useState(initialVialState);
  // We'll treat the form as primarily for ADDING batches, simplifying the editing logic flow here.
  const isEditing = !!editingVial; 

  // Load data if editing an existing vial
  useEffect(() => {
    if (isEditing) {
      // ⭐ If editing, load the data but ensure quantity isn't accidentally set.
      const { quantity, ...editingData } = editingVial;
      setFormState({ ...initialVialState, ...editingData });
    } else {
      setFormState(initialVialState);
    }
  }, [editingVial, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // ⭐ Handle quantity input to ensure it's a number >= 1
    const finalValue = name === 'quantity' ? Math.max(1, parseInt(value, 10) || 1) : value;
    
    setFormState({ ...formState, [name]: finalValue });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // ⭐ PASS THE FULL FORM STATE, including quantity, to the App.jsx handler.
    onSubmitVial(formState, isEditing);
    
    // Reset form for adding new vial
    if (!isEditing) {
      setFormState(initialVialState); 
    }
    // If it was an edit, onCancelEdit or parent state update handles cleanup.
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h4>{isEditing ? `Editing Vial: ${editingVial.experimentName}` : "Create New Vial Batch"}</h4>
      
      {/* ------------------ VIAL METADATA FIELDS ------------------ */}

      <label>Experiment Name:
        <input type="text" name="experimentName" value={formState.experimentName} onChange={handleChange} required />
      </label>

      <label>Cell Type:
        <select name="cellType" value={formState.cellType} onChange={handleChange}>
          {CELL_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </label>

      <label>Species:
        <select name="species" value={formState.species} onChange={handleChange}>
          {SPECIES_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </label>

      <label>Conc:
        <select name="conc" value={formState.conc} onChange={handleChange}>
          {CONC_OPTIONS.map(conc => <option key={conc} value={conc}>{conc}</option>)}
        </select>
      </label>
      
      <label>Freeze Date:
        <input type="date" name="freezeDate" value={formState.freezeDate} onChange={handleChange} required />
      </label>

      <label>Owner (Contact):
        <input type="text" name="owner" value={formState.owner} onChange={handleChange} required />
      </label>

      {/* ------------------ BATCH QUANTITY FIELD ------------------ */}
      {!isEditing && (
        <label style={{ marginTop: 10, borderTop: '1px solid #ddd', paddingTop: 10 }}>
            **Batch Quantity:**
            <input 
                type="number" 
                name="quantity" 
                value={formState.quantity} 
                onChange={handleChange} 
                required 
                min="1"
                style={{ fontSize: '1.2em', padding: '5px', marginTop: '5px' }}
            />
        </label>
      )}

      {/* ------------------ SUBMIT/CANCEL BUTTONS ------------------ */}
      <div style={{ marginTop: 15, display: 'flex', justifyContent: 'space-between' }}>
        <button type="submit" style={{ padding: 8, backgroundColor: isEditing ? '#22c55e' : '#3b82f6', color: 'white', border: 'none', borderRadius: 4 }}>
          {isEditing ? (
            <>Save Changes</>
          ) : (
            <><FaPlus style={{ marginRight: 5 }} /> Create {formState.quantity} Vial{formState.quantity > 1 ? 's' : ''}</>
          )}
        </button>
        {isEditing && (
          <button type="button" onClick={onCancelEdit} style={{ padding: 8, backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: 4 }}>
            <FaTimes style={{ marginRight: 5 }} /> Cancel
          </button>
        )}
      </div>
    </form>
  );
}