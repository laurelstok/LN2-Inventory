import React, { useState } from "react";
import { FaEdit, FaCheck, FaTimes, FaPlus, FaSave } from "react-icons/fa";
import TowerSlot from "./TowerSlot";

// Define a new component for the Add Tower button/form
const AddTowerButton = ({ onAddTower }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState('');
    const [capacity, setCapacity] = useState(15);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim() && capacity > 0) {
            onAddTower(name.trim(), parseInt(capacity, 10));
            setName('');
            setCapacity(15);
            setIsAdding(false);
        }
    };
    
    if (isAdding) {
        return (
            <div style={{ 
                width: 240, background: "#f3f4f6", padding: 12, borderRadius: 8, 
                boxShadow: "0 0 5px #aaa" 
            }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <h4 style={{ margin: 0 }}>New Tower</h4>
                    <input 
                        type="text" 
                        placeholder="Tower Name (e.g., Tower 3)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <input 
                        type="number" 
                        placeholder="Capacity (Slots)"
                        min="1"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        required
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                        <button type="submit" style={{ background: '#22c55e', color: 'white', border: 'none', padding: 5 }}>
                            <FaSave style={{ marginRight: 5 }} /> Add
                        </button>
                        <button type="button" onClick={() => setIsAdding(false)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: 5 }}>
                            <FaTimes style={{ marginRight: 5 }} /> Cancel
                        </button>
                    </div>
                </form>
            </div>
        );
    }
    
    return (
        <button 
            onClick={() => setIsAdding(true)} 
            style={{ 
                width: 240, height: 100, border: '2px dashed #9ca3af', 
                background: 'transparent', borderRadius: 8, cursor: 'pointer', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', 
                justifyContent: 'center', color: '#6b7280'
            }}
        >
            <FaPlus size={20} />
            Add New Tower
        </button>
    );
};


export default function TowersContainer({
  towers,
  onSelectBox,
  currentBoxLocation,
  onDropBox,
  onRenameTower,
  onAddTower,
  onEditTowerCapacity,
}) {
  const [editingTowerId, setEditingTowerId] = useState(null);
  const [editTowerName, setEditTowerName] = useState("");
  const [editTowerCapacity, setEditTowerCapacity] = useState("");

  const startEditing = (tower) => {
    setEditingTowerId(tower.id);
    setEditTowerName(tower.name);
    setEditTowerCapacity(tower.capacity);
  };

  const cancelEditing = () => {
    setEditingTowerId(null);
    setEditTowerName("");
    setEditTowerCapacity("");
  };

  const saveEditing = (towerId) => {
    // 1. Handle Rename
    if (editTowerName.trim() && editTowerName.trim() !== towers.find(t => t.id === towerId)?.name) {
      onRenameTower(towerId, editTowerName.trim());
    }
    
    // 2. Handle Capacity Change
    const newCapacity = parseInt(editTowerCapacity, 10);
    const currentCapacity = towers.find(t => t.id === towerId)?.capacity;
    
    if (!isNaN(newCapacity) && newCapacity > 0 && newCapacity !== currentCapacity) {
        onEditTowerCapacity(towerId, newCapacity);
    }
    
    setEditingTowerId(null);
    setEditTowerName("");
    setEditTowerCapacity("");
  };

  return (
    <div style={{ display: "flex", gap: 24, flexWrap: 'wrap' }}>
      {towers.map((tower) => (
        <div
          key={tower.id}
          style={{
            width: 240,
            background: "#f3f4f6",
            padding: 8,
            borderRadius: 8,
            boxShadow: "0 0 5px #ccc",
            marginBottom: 20
          }}
        >
          {/* --- Tower Name/Edit Section --- */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            {/* ... (Editing/Display Mode logic remains the same) ... */}
            {editingTowerId === tower.id ? (
              <div style={{ flexGrow: 1 }}>
                <input
                  type="text"
                  value={editTowerName}
                  onChange={(e) => setEditTowerName(e.target.value)}
                  placeholder="Tower Name"
                  style={{ width: '100%', padding: 5, fontSize: '1.2em', marginBottom: 5 }}
                />
                <input
                  type="number"
                  value={editTowerCapacity}
                  onChange={(e) => setEditTowerCapacity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEditing(tower.id);
                    if (e.key === "Escape") cancelEditing();
                  }}
                  placeholder="Capacity"
                  min="1"
                  style={{ width: '100%', padding: 5 }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 5 }}>
                    <button 
                        onClick={() => saveEditing(tower.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22c55e', marginRight: 4 }}
                        title="Save Changes"
                    >
                        <FaCheck />
                    </button>
                    <button 
                        onClick={cancelEditing}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                        title="Cancel Edit"
                    >
                        <FaTimes />
                    </button>
                </div>
              </div>
            ) : (
              <>
                <h3 style={{ color: "#2563eb", margin: 0, flexGrow: 1 }}>
                  {tower.name} <small style={{ fontWeight: 'normal', color: '#6b7280' }}>({tower.capacity} slots)</small>
                </h3>
                <button
                  onClick={() => startEditing(tower)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb' }}
                  title="Edit Tower Name and Capacity"
                >
                  <FaEdit />
                </button>
              </>
            )}
          </div>
          {/* --- End Tower Name/Edit Section --- */}
          
          {/* --- Tower Slots (Boxes) --- */}
          <div 
              style={{ 
                  maxHeight: 400, // <--- Fixed height for the slots container
                  overflowY: 'auto', // <--- Enables vertical scrolling
                  paddingRight: 5 // Optional: Adds padding so scrollbar doesn't hide content
              }}
          >
            {tower.slots.map((box, i) => {
              const isSelected =
                currentBoxLocation.tower === tower.id &&
                currentBoxLocation.slot === i;

              return (
                <TowerSlot
                  key={i}
                  box={box}
                  towerId={tower.id}
                  slotIndex={i}
                  onDropBox={onDropBox}
                  isSelected={isSelected}
                  onSelectSlot={({ tower, slot }) => onSelectBox({
                    towerId: tower,
                    slotIndex: slot})}
                />
              );
            })}
          </div>
        </div>
      ))}
      
      {/* NEW: Add Tower Button/Form */}
      <AddTowerButton onAddTower={onAddTower} />

    </div>
  );
}