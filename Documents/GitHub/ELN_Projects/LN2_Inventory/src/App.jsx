// App.jsx (Complete — unified selection + unplaced-only vial editing)

import { useState, useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { v4 as uuidv4 } from 'uuid'; 

import TowersContainer from "./components/TowersContainer";
import TabbedManagementForm from "./components/TabbedManagementForm";
import UnplacedList from "./components/UnplacedList"; 
import UnplacedVials from "./components/UnplacedVials";
import ConfirmDialog from "./components/ConfirmDialog";
import BoxContentsEditor from "./components/BoxContentsEditor";

// --- INITIAL DATA & UTILITIES ---
const DEFAULT_BOX_SIZE = "9x9";
const DEFAULT_TOWER_CAPACITY = 15; 

function generateNewTower(id, name, capacity = DEFAULT_TOWER_CAPACITY) {
  return {
    id,
    name: name,
    capacity: capacity, 
    slots: Array.from({ length: capacity }, () => null),
  };
}

function generateInitialTowers() {
  return [
    generateNewTower(1, "Tower 1", DEFAULT_TOWER_CAPACITY),
    generateNewTower(2, "Tower 2", 10),
  ];
}

const getInitialContents = (dimensions) => {
    const size = dimensions === '10x10' ? 10 : 9;
    
    return Array.from({ length: size }, () => 
        Array.from({ length: size }, () => null)
    );
};

const INITIAL_UNPLACED_VIALS = (() => {
    const batchId1 = uuidv4();
    const batchId2 = uuidv4();
    return [
        { id: uuidv4(), batchId: batchId1, label: "DE-LS01-1", experimentName: "DE-LS01", cellType: "DE", passage: "7", conc: "1e6 cells/mL", freezeDate: "2025-10-25", owner: "Jane Doe" },
        { id: uuidv4(), batchId: batchId1, label: "DE-LS01-2", experimentName: "DE-LS01", cellType: "DE", passage: "7", conc: "1e6 cells/mL", freezeDate: "2025-10-25", owner: "Jane Doe" },
        { id: uuidv4(), batchId: batchId2, label: "Mouse PBMC-1", experimentName: "Mouse PBMC TEST", cellType: "PBMC", passage: "5", conc: "1e6 cells/mL", freezeDate: "2025-10-24", owner: "John Smith" },
        { id: uuidv4(), batchId: batchId2, label: "Mouse PBMC-2", experimentName: "Mouse PBMC TEST", cellType: "PBMC", passage: "5", conc: "1e6 cells/mL", freezeDate: "2025-10-24", owner: "John Smith" },
    ];
})();


export default function App() {
  const [freezerStructure, setFreezerStructure] = useState({
    tank: "Tank Alpha",
    towers: generateInitialTowers(),
  });

  const [unplacedBoxes, setUnplacedBoxes] = useState([]);
  const [unplacedVials, setUnplacedVials] = useState(INITIAL_UNPLACED_VIALS); 
  
  const [currentBoxLocation, setCurrentBoxLocation] = useState({
    tower: 1,
    slot: 0,
  });

  // Keep selectedBox for code paths that expect it (box editing / box contents)
  // We'll keep it in sync with editingTarget when a box is selected.
  const [selectedBox, setSelectedBox] = useState(null);

  // Vial selection list (unplaced only). Empty when no vials selected.
  const [selectedVials, setSelectedVials] = useState([]);

  // Unified editing target:
  // { type: 'box' | 'vial' | 'vial_multi' | 'vial_batch', data: ... }
  const [editingTarget, setEditingTarget] = useState(null);

  const [editingMode, setEditingMode] = useState(null); // e.g. 'contents' for box content editor

  // States for confirmation dialog 
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState(null);


  // --- CORE UI/SELECTION HANDLERS ---

  const onExitContentEditor = () => {
    setEditingMode(null);
  };
  
  const onClearSelection = () => {
    setSelectedBox(null);
    setSelectedVials([]);
    setEditingTarget(null);
    setEditingMode(null);
    setCurrentBoxLocation({ tower: null, slot: null });
  };
  
  // Select a box (placed or unplaced) — clears any vial selection
  const onSelectBox = (loc) => {
    let boxData = null;
    
    if (loc.towerId !== null && loc.slotIndex !== null) {
      const tower = freezerStructure.towers.find(t => t.id === loc.towerId);
      boxData = tower?.slots[loc.slotIndex] || null;
    } else if (loc.boxId) {
      boxData = unplacedBoxes.find(box => box.id === loc.boxId) || null;
    }
    
    if (boxData) {
      // normalize selection types and clear vials
      setSelectedVials([]);
      setEditingTarget({
        type: "box",
        data: boxData,
        location: { tower: loc.towerId, slot: loc.slotIndex }
      });
      setSelectedBox({
        type: "box",
        data: boxData,
        location: { tower: loc.towerId, slot: loc.slotIndex }
      });
      onExitContentEditor();
      setCurrentBoxLocation({ tower: loc.towerId, slot: loc.slotIndex });
    } else {
      onClearSelection();
    }
  };

  // --- VIAL SELECTION (UNPLACED ONLY) ---
  // Single click selects one vial (clears box selection)
  const onSelectVial = (vial) => {
    setSelectedVials([vial]);
    setEditingTarget({
      type: "vial",
      data: vial
    });
    setCurrentBoxLocation({ tower: null, slot: null });
  };

  // Shift-click toggles multiselect (unplaced only). Clears box selection.
  const onSelectVialMulti = (vial) => {
    setSelectedVials(prev => {
      const exists = prev.find(v => v.id === vial.id);
      const updated = exists ? prev.filter(v => v.id !== vial.id) : [...prev, vial];

      setEditingTarget({
        type: updated.length === 1 ? "vial" : "vial_multi",
        data: updated
      });

      return updated;
    });
    setCurrentBoxLocation({ tower: null, slot: null });
  };

  // Select entire batch (unplaced only)
  const onSelectBatch = (batchId) => {
    const vials = unplacedVials.filter(v => v.batchId === batchId);
    setSelectedVials(vials);

    setEditingTarget({
      type: "vial_batch",
      data: {
        batchId,
        vials
      }
    });

    setCurrentBoxLocation({ tower: null, slot: null });
  };

  // Apply metadata edits to selected vials (single / multi / batch)
  const onUpdateVials = (newMetadata) => {
    if (!editingTarget) return;

    // Helper: update a single vial by id both in unplacedVials and inside boxes
    const updateSingleVial = (id, patch) => {
      // Update unplaced vials
      setUnplacedVials(prev => prev.map(v => v.id === id ? { ...v, ...patch } : v));

      // Update placed vials (boxes)
      setFreezerStructure(prev => {
        const newTowers = prev.towers.map(tower => ({
          ...tower,
          slots: tower.slots.map(box => {
            if (!box) return box;
            // map contents 2D array
            const newContents = box.contents.map(row =>
              row.map(cell => (cell && cell.id === id ? { ...cell, ...patch } : cell))
            );
            return { ...box, contents: newContents };
          })
        }));
        return { ...prev, towers: newTowers };
      });
    };

    if (editingTarget.type === "vial") {
      updateSingleVial(editingTarget.data.id, newMetadata);
    } else if (editingTarget.type === "vial_multi") {
      editingTarget.data.forEach(vial => updateSingleVial(vial.id, newMetadata));
    } else if (editingTarget.type === "vial_batch") {
      editingTarget.data.vials.forEach(vial => updateSingleVial(vial.id, newMetadata));
    }

    // clear selection after applying edits
    setSelectedVials([]);
    setEditingTarget(null);
  };


  // --- DELETE AND MOVE HANDLERS ---
  
  // Handler for opening the delete confirmation dialog
  const showDeleteConfirm = (box) => { 
    // Expects an object such as { type: 'box', data: boxObj, location: ... }
    setPendingDeleteItem(box.data); 
    setConfirmDeleteOpen(true);
  };

  const cancelDelete = () => { 
    setConfirmDeleteOpen(false);
    setPendingDeleteItem(null);
  };

  // Confirm delete logic (top-level)
  function handleConfirmDelete() {
    if (!pendingDeleteItem) {
      cancelDelete();
      return;
    }

    const boxId = pendingDeleteItem.id;

    // Flatten contents and filter out nulls to get vials to return
    const vialsToReturn = (pendingDeleteItem.contents || []).flat().filter(vial => vial !== null);

    // 1. Return Vials to Unplaced List (if any exist)
    if (vialsToReturn.length > 0) {
        setUnplacedVials(prev => [...prev, ...vialsToReturn]);
    }

    // 2. Remove the Box from its location
    if (pendingDeleteItem.towerId) {
      // Box is PLACED: Remove from Tower
      const { towerId, slotIndex } = pendingDeleteItem;

      setFreezerStructure(prevStructure => {
        const newTowers = prevStructure.towers.map(t => ({ ...t, slots: [...t.slots] }));
        const tower = newTowers.find(t => t.id === towerId);

        if (tower && tower.slots[slotIndex]?.id === boxId) {
          tower.slots[slotIndex] = null;
        }
        return { ...prevStructure, towers: newTowers };
      });
    } else {
      // Box is UNPLACED: Remove from Unplaced List
      setUnplacedBoxes(prevUnplaced => 
        prevUnplaced.filter(box => box.id !== boxId)
      );
    }

    // 3. Reset states
    cancelDelete();
    onClearSelection(); 
  }

  // ⭐ FIX: Logic for moving a placed box back to the unplaced list
  const moveToUnplaced = (boxToMove) => { 
    if (!boxToMove || !boxToMove.towerId) return; // Only move placed boxes

    const boxId = boxToMove.id;
    const { towerId, slotIndex } = boxToMove;

    // 1. Clear the box from the tower slot in freezerStructure
    setFreezerStructure(prevStructure => {
      const newTowers = prevStructure.towers.map(t => ({ ...t, slots: [...t.slots] }));
      const tower = newTowers.find(t => t.id === towerId);

      if (tower && tower.slots[slotIndex]?.id === boxId) {
        tower.slots[slotIndex] = null;
      }

      return { ...prevStructure, towers: newTowers };
    });

    // 2. Add the box to unplacedBoxes with cleared coordinates
    const unplacedBox = { 
        ...boxToMove, 
        towerId: null, 
        slotIndex: null 
    };
    setUnplacedBoxes(prev => [...prev, unplacedBox]);
    
    // 3. Update the selectedBox/editingTarget and clear location
    setSelectedBox({ type: "box", data: unplacedBox, location: { tower: null, slot: null } });
    setEditingTarget({ type: "box", data: unplacedBox, location: { tower: null, slot: null } });
  };

  // --- TOWER MANAGEMENT FUNCTIONS (Abbreviated) ---
  const onAddTower = (name, capacity) => { /* ... */ };
  const onRenameTower = (towerId, newName) => { /* ... */ };
  const onEditTowerCapacity = (towerId, newCapacity) => { /* ... */ };

  // --- BOX & VIAL MANAGEMENT FUNCTIONS ---

  const addNewBox = (label, dimensions = "9x9") => {
    const newBox = {
      id: uuidv4(),
      label,
      dimensions,
      towerId: null,
      slotIndex: null,
      contents: getInitialContents(dimensions),
    };
    setUnplacedBoxes((prev) => [...prev, newBox]);

    // Select the new box for editing (consistent lowercase 'box')
    setSelectedBox({ type: "box", data: newBox, location: { tower: null, slot: null } });
    setEditingTarget({ type: "box", data: newBox, location: { tower: null, slot: null } });

    onExitContentEditor();
    setCurrentBoxLocation({ tower: null, slot: null });
  };
  
  const handleAddNewVial = (vialBatchData) => {
    const { quantity, ...metadata } = vialBatchData;
    const newVials = [];
    const uniqueBatchId = uuidv4(); // Unique batch ID for this batch of vials
    for (let i = 0; i < quantity; i++) {
      const newVial = {
        id: uuidv4(),
        batchId: uniqueBatchId,
        ...metadata,
        batchIndex: i + 1
      };
      newVials.push(newVial);
    }
    setUnplacedVials(prevVials => [...prevVials, ...newVials]);
    console.log(`Successfully added ${newVials.length} new vials.`);
  };
  
  // FINAL FIX: Box movement handler (now handles unplaced-to-tower reliably)
  const moveBox = useCallback((source, destination) => {
    
    // 1. If moving from Unplaced List, remove from unplacedBoxes state first.
    if (!source.towerId) {
        setUnplacedBoxes(prevUnplaced => 
            prevUnplaced.filter(box => box.id !== source.box.id)
        );
    }
    
    // 2. Update the freezerStructure state
    setFreezerStructure(prevStructure => {
        const newTowers = prevStructure.towers.map(t => ({ ...t, slots: [...t.slots] }));
        
        const destTower = newTowers.find(t => t.id === destination.towerId);
        if (!destTower || destTower.slots[destination.slotIndex] !== null) {
            // Drop should have been prevented by canDrop, but safety return
            return prevStructure; 
        }

        let boxToMove;

        // A. Remove box from source
        if (source.towerId) {
            // Moving from Tower Slot to Tower Slot
            const srcTower = newTowers.find(t => t.id === source.towerId);
            if (!srcTower || !srcTower.slots[source.slotIndex]) {
                return prevStructure; // Should not happen
            }
            
            boxToMove = srcTower.slots[source.slotIndex];
            srcTower.slots[source.slotIndex] = null; // Clear source slot
            
        } else {
            // Moving from Unplaced List to Tower Slot (boxToMove is already in source.box)
            boxToMove = source.box;
        }

        // B. Place box at destination
        const newBox = { 
            ...boxToMove, 
            towerId: destination.towerId, 
            slotIndex: destination.slotIndex 
        };
        destTower.slots[destination.slotIndex] = newBox;

        // C. Update selected box state if needed
        if (selectedBox?.data?.id === boxToMove.id) {
            setSelectedBox(prev => ({ 
                ...prev, 
                data: newBox, 
                location: { tower: newBox.towerId, slot: newBox.slotIndex }
            }));
            setEditingTarget(prev => prev && prev.type === 'box' ? ({ ...prev, data: newBox, location: { tower: newBox.towerId, slot: newBox.slotIndex } }) : prev);
        }

        return { ...prevStructure, towers: newTowers };
    });
  }, [selectedBox]);

  // HANDLER: Saves the contents of the box currently in the editor
  const onSaveBoxContents = (boxId, newContents) => {
    
    const updateBox = (prevStructure) => {
        let found = false;
        
        // 1. Check and update boxes placed in towers
        const updatedTowers = prevStructure.towers.map(tower => ({
            ...tower,
            slots: tower.slots.map(box => {
                if (box?.id === boxId) {
                    found = true;
                    return { ...box, contents: newContents };
                }
                return box;
            })
        }));
        
        if (found) {
            return { ...prevStructure, towers: updatedTowers };
        }
        
        // 2. If not found in towers, update unplaced boxes
        setUnplacedBoxes(prevUnplaced => 
            prevUnplaced.map(box => 
                box.id === boxId ? { ...box, contents: newContents } : box
            )
        );
        
        return prevStructure; 
    };
    
    setFreezerStructure(updateBox); 
    
    // 3. Update the selectedBox state to reflect saved contents
    setSelectedBox(prev => prev ? { 
        ...prev, 
        data: { 
            ...prev.data, 
            contents: newContents 
        } 
    } : null);

    // Also sync editingTarget if it's the same box
    setEditingTarget(prev => prev && prev.type === 'box' && prev.data.id === boxId
      ? { ...prev, data: { ...prev.data, contents: newContents } }
      : prev
    );
    
    // 4. Exit the editor after saving
    onExitContentEditor();
  };
  
  // HANDLER: Clears all vials from the box and returns them to unplacedVials
  const onClearBoxContents = (currentContents) => {
    if (!selectedBox) return;

    // 1. Flatten the 2D array into a list of actual vial objects
    const vialsToReturn = currentContents.flat().filter(vial => vial !== null);

    // 2. Add them back to the unplaced list
    setUnplacedVials(prev => [...prev, ...vialsToReturn]);

    // 3. Create an empty content grid based on the box's dimensions
    const emptyContents = getInitialContents(selectedBox.data.dimensions);

    // 4. Update the box contents in the global state 
    const updateBox = (prevStructure) => {
        let found = false;
        
        const updatedTowers = prevStructure.towers.map(tower => ({
            ...tower,
            slots: tower.slots.map(box => {
                if (box?.id === selectedBox.data.id) {
                    found = true;
                    return { ...box, contents: emptyContents };
                }
                return box;
            })
        }));
        
        if (found) {
            return { ...prevStructure, towers: updatedTowers };
        }
        
        setUnplacedBoxes(prevUnplaced => 
            prevUnplaced.map(box => 
                box.id === selectedBox.data.id ? { ...box, contents: emptyContents } : box
            )
        );
        
        return prevStructure; 
    };
    
    setFreezerStructure(updateBox); 

    // 5. Update the selected box state to reflect the empty contents
    setSelectedBox(prev => prev ? { 
        ...prev, 
        data: { 
            ...prev.data, 
            contents: emptyContents 
        } 
    } : null);

    // sync editingTarget if it referenced the same box
    setEditingTarget(prev => prev && prev.type === 'box' && prev.data.id === selectedBox.data.id
      ? { ...prev, data: { ...prev.data, contents: emptyContents } }
      : prev
    );
  };


  const onEditBoxContents = () => {
    if (selectedBox) {
      setEditingMode('contents');
    }
  };
  

  const onUpdateBoxMetadata = (formValues, isUpdate) => { /* ... */ };
  // function handleConfirmDelete() { /* ... */ } // Logic moved above

  const isEditingContents = editingMode === 'contents';

  // Handler when a vial is dropped into a box slot (removes from unplaced list)
  const onVialPlaced = (vialId) => {
      setUnplacedVials(prev => prev.filter(vial => vial.id !== vialId));
  };

  // Handler when a vial is removed from a box slot (adds back to unplaced list)
  const onVialRemoved = (vialData) => {
      setUnplacedVials(prev => [...prev, vialData]);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: "flex", gap: 24, padding: 20 }}>
        
        {/* ---------------------------------------------------- */}
        {/* --- LEFT PANEL: Management Forms & Unplaced Lists --- */}
        {/* ---------------------------------------------------- */}
        <div
          style={{ width: 320, display: "flex", flexDirection: "column", gap: 24 }}
        >
          {/* 1. TABBED MANAGEMENT FORM (Always Visible) */}
          <TabbedManagementForm
            editingTarget={editingTarget}
            isEditingContents={isEditingContents}
            onEditBoxContents={onEditBoxContents}
            onSubmit={onUpdateBoxMetadata}
            onUpdateVials={onUpdateVials}            // NEW: handler for editing vials
            onClearSelection={onClearSelection}
            onAddNewBox={addNewBox}
            onAddNewVial={handleAddNewVial}
            // Pass the functions to TabbedManagementForm
            moveToUnplaced={selectedBox ? () => moveToUnplaced(selectedBox.data) : null}
            showDeleteConfirm={selectedBox ? () => showDeleteConfirm(selectedBox) : null}
            onAddTower={onAddTower} 
            onRenameTower={onRenameTower}
            onEditTowerCapacity={onEditTowerCapacity}
          />
          
          {/* 2. DYNAMIC UNPLACED LISTS */}
          {!isEditingContents && (
            <UnplacedList unplacedBoxes={unplacedBoxes} onSelectBox={onSelectBox} />  
          )}

          {/*3. UNPLACED VIALS */}
          <UnplacedVials
            unplacedVials={unplacedVials}
            editingTarget={editingTarget}
            onSelectVial={onSelectVial}
            onSelectVialMulti={onSelectVialMulti}
            onSelectBatch={onSelectBatch}
            style={{ borderTop: '1px solid #ccc', paddingTop: 10 }}
          />
        </div>

        {/* ------------------------------------------------------ */}
        {/* --- RIGHT PANEL: Freezer Structure or Box Editor --- */}
        {/* ------------------------------------------------------ */}
        <div style={{ flex: 2 }}>
          <h1>LN2 Inventory Starter</h1>
          <h2>{freezerStructure.tank}</h2>
          
          {/* CONDITIONAL RENDERING: Show Towers or Box Editor */}
          {!isEditingContents && (
              <TowersContainer
                  towers={freezerStructure.towers}
                  currentBoxLocation={currentBoxLocation}
                  onDropBox={moveBox} // The fixed box movement function
                  onSelectBox={onSelectBox}
                  onRenameTower={onRenameTower}
                  onAddTower={onAddTower}
                  onEditTowerCapacity={onEditTowerCapacity}
              />
          )}
          
          {isEditingContents && selectedBox?.data && (
            <BoxContentsEditor 
              box={selectedBox.data} 
              isEditingContents={isEditingContents}
              unplacedVials={unplacedVials}
              onExit={onExitContentEditor}
              onSaveContents={onSaveBoxContents} 
              onVialPlaced={onVialPlaced}
              onVialRemoved={onVialRemoved}
              onClearContents={onClearBoxContents}
              // NOTE: placed vials are NOT selectable per Option B (do not pass selection handlers)
            />
          )}
        </div>

        <ConfirmDialog
          open={confirmDeleteOpen}
          message={`Are you sure you want to delete "${pendingDeleteItem?.label}"? This action is permanent and will return all contained vials to the Unplaced Vials list.`}
          onConfirm={handleConfirmDelete}
          onCancel={cancelDelete}
        />
      </div>
    </DndProvider>
  );
}
