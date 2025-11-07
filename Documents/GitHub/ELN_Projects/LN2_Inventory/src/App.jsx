// App.jsx (Final Comprehensive Version)

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
        { id: uuidv4(), batchId: batchId1, label: "DE-LS01-1", experimentName: "DE-LS01", cellType: "DE", species: "Human", conc: "1e6 cells/mL", freezeDate: "2025-10-25", owner: "Jane Doe" },
        { id: uuidv4(), batchId: batchId1, label: "DE-LS01-2", experimentName: "DE-LS01", cellType: "DE", species: "Human", conc: "1e6 cells/mL", freezeDate: "2025-10-25", owner: "Jane Doe" },
        { id: uuidv4(), batchId: batchId2, label: "Mouse PBMC-1", experimentName: "Mouse PBMC TEST", cellType: "PBMC", species: "Mouse", conc: "1e6 cells/mL", freezeDate: "2025-10-24", owner: "John Smith" },
        { id: uuidv4(), batchId: batchId2, label: "Mouse PBMC-2", experimentName: "Mouse PBMC TEST", cellType: "PBMC", species: "Mouse", conc: "1e6 cells/mL", freezeDate: "2025-10-24", owner: "John Smith" },
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

  const [selectedBox, setSelectedBox] = useState(null); 
  const [editingMode, setEditingMode] = useState(null); 

  // States for confirmation dialog (Abbreviated)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState(null);

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
      slotIndex: null, // Added for clarity
      contents: getInitialContents(dimensions), // Use utility function
    };
    setUnplacedBoxes((prev) => [...prev, newBox]);
    setSelectedBox({ type: "Box", data: newBox, location: { tower: null, slot: null } });
    setEditingMode(null);
    setCurrentBoxLocation({ tower: null, slot: null });
  };
  
  const onAddNewVial = (vialBatchData) => { /* ... batch creation logic ... */ };
  
  // ⭐ FINAL FIX: Box movement handler (now handles unplaced-to-tower reliably)
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
        }

        return { ...prevStructure, towers: newTowers };
    });
  }, [selectedBox]); // Dependencies include selectedBox

  // ⭐ HANDLER: Saves the contents of the box currently in the editor
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
    
    // 4. Exit the editor after saving
    setEditingMode(null);
  };
  
  // ⭐ HANDLER: Clears all vials from the box and returns them to unplacedVials
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
};


  const showDeleteConfirm = (box) => { /* ... */ };
  const deleteBox = (boxToDelete) => { /* ... */ };
  const cancelDelete = () => { /* ... */ };
  const moveToUnplaced = (boxToMove) => { /* ... */ };
  const onSelectBox = (loc) => { /* ... */ };

  const onEditBoxContents = () => {
    if (selectedBox) {
      setEditingMode('contents');
    }
  };
  
  const onExitContentEditor = () => {
    setEditingMode(null);
  };

  const onUpdateBoxMetadata = (formValues, isUpdate) => { /* ... */ };
  const onClearSelection = () => { /* ... */ };
  function handleConfirmDelete() { /* ... */ }

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
            editingTarget={selectedBox}
            isEditingContents={isEditingContents}
            onEditBoxContents={onEditBoxContents}
            onSubmit={onUpdateBoxMetadata}
            onClearSelection={onClearSelection}
            onAddNewBox={addNewBox}
            onAddNewVial={onAddNewVial}
            moveToUnplaced={moveToUnplaced}
            showDeleteConfirm={showDeleteConfirm}
            onAddTower={onAddTower} 
            onRenameTower={onRenameTower}
            onEditTowerCapacity={onEditTowerCapacity}
          />
          
          {/* 2. DYNAMIC UNPLACED LISTS */}
          {isEditingContents ? (
              // If editing contents, show unplaced vials
              <UnplacedVials 
                  unplacedVials={unplacedVials} 
              />
          ) : (
              // Otherwise, show unplaced boxes
              <UnplacedList unplacedBoxes={unplacedBoxes} onSelectBox={onSelectBox} />
          )}
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
              unplacedVials={unplacedVials}
              onExit={onExitContentEditor}
              onSaveContents={onSaveBoxContents} 
              onVialPlaced={onVialPlaced}
              onVialRemoved={onVialRemoved}
              onClearContents={onClearBoxContents}
            />
          )}
        </div>

        <ConfirmDialog
          open={confirmDeleteOpen}
          message={`Are you sure you want to delete "${pendingDeleteItem?.label}"?`}
          onConfirm={handleConfirmDelete}
          onCancel={cancelDelete}
        />
      </div>
    </DndProvider>
  );
}