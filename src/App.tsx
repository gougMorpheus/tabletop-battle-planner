import Board from "./components/Board";
import { useBoardStore } from "./store/boardStore";
import { useUnitsStore } from "./store/unitsStore";

const App = () => {
  const showGrid = useBoardStore((state) => state.showGrid);
  const toggleGrid = useBoardStore((state) => state.toggleGrid);
  const boardWidthIn = useBoardStore((state) => state.widthIn);
  const boardHeightIn = useBoardStore((state) => state.heightIn);
  const addUnit = useUnitsStore((state) => state.addUnit);
  const duplicateUnit = useUnitsStore((state) => state.duplicateUnit);
  const deleteUnit = useUnitsStore((state) => state.deleteUnit);
  const selectedUnitId = useUnitsStore((state) => state.selectedUnitId);

  const handleAddUnit = () => {
    addUnit({ x: boardWidthIn / 2, y: boardHeightIn / 2 });
  };

  const handleDuplicateUnit = () => {
    if (selectedUnitId) {
      duplicateUnit(selectedUnitId);
    }
  };

  const handleDeleteUnit = () => {
    if (selectedUnitId) {
      deleteUnit(selectedUnitId);
    }
  };

  return (
    <div className="app">
      <header className="top-bar">
        <div className="top-bar__title">Tabletop Battle Planner</div>
        <button className="top-bar__button" type="button" onClick={toggleGrid}>
          {showGrid ? "Grid: On" : "Grid: Off"}
        </button>
      </header>
      <main className="board-shell">
        <Board />
      </main>
      <div className="fab">
        <button className="fab__button" type="button" onClick={handleAddUnit}>
          Add Unit
        </button>
        <button
          className="fab__button"
          type="button"
          onClick={handleDuplicateUnit}
          disabled={!selectedUnitId}
        >
          Duplicate
        </button>
        <button
          className="fab__button fab__button--danger"
          type="button"
          onClick={handleDeleteUnit}
          disabled={!selectedUnitId}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default App;