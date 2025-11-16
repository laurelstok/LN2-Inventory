import React from "react";
import { FaPlus, FaTimes } from 'react-icons/fa';

const CELL_TYPES = ["DC", "DE", "HSC", "iPSC", "NK", "PBMC", "T-Cells"];
const CONC_OPTIONS = ["1e7", "1e6", "5e5", "Other"];

const initialVialState = {
  experimentName: "",
  cellType: CELL_TYPES[0],
  passage: 0,
  conc: CONC_OPTIONS[0],
  freezeDate: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
  owner: "",
  quantity: 1,
};

export default function VialForm({ formState, setFormState, onSubmitVial, isEditing, onCancelEdit }) {
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    const finalValue = name === 'quantity' ? Math.max(1, parseInt(value, 10) || 1) : value;
    setFormState(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitVial(formState, isEditing);
    // Optionally clear the form via parent after submit
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h4>{isEditing ? `Editing Vial: ${formState.experimentName}` : "Create New Vial Batch"}</h4>

      <label>Experiment Name:
        <input type="text" name="experimentName" value={formState.experimentName} onChange={handleChange} required />
      </label>

      <label>Cell Type:
        <select name="cellType" value={formState.cellType} onChange={handleChange}>
          {CELL_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </label>

      <label>Passage Number:
        <input type="number" name="passage" value={formState.passage} onChange={handleChange}>
        </input>
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

      <div style={{ marginTop: 15, display: 'flex', justifyContent: 'space-between' }}>
        <button
          type="submit"
          style={{
            padding: 8,
            backgroundColor: isEditing ? '#22c55e' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 4,
          }}
        >
          {isEditing ? (
            <>Save Changes</>
          ) : (
            <>
              <FaPlus style={{ marginRight: 5 }} /> Create {formState.quantity} Vial{formState.quantity > 1 ? 's' : ''}
            </>
          )}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={onCancelEdit}
            style={{
              padding: 8,
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: 4,
            }}
          >
            <FaTimes style={{ marginRight: 5 }} /> Cancel
          </button>
        )}
      </div>
    </form>
  );
}
