import { useState } from "react";
import Board from "./components/Board";
import { useBoardStore } from "./store/boardStore";
import { useUnitsStore } from "./store/unitsStore";
import { useMeasurementStore } from "./store/measurementStore";

const App = () => {
  const showGrid = useBoardStore((state) => state.showGrid);
  const toggleGrid = useBoardStore((state) => state.toggleGrid);
  const boardWidthIn = useBoardStore((state) => state.widthIn);
  const boardHeightIn = useBoardStore((state) => state.heightIn);
  const addUnit = useUnitsStore((state) => state.addUnit);
  const duplicateUnit = useUnitsStore((state) => state.duplicateUnit);
  const deleteUnit = useUnitsStore((state) => state.deleteUnit);
  const selectedUnitId = useUnitsStore((state) => state.selectedUnitId);
  const units = useUnitsStore((state) => state.units);
  const addRange = useUnitsStore((state) => state.addRange);
  const removeRange = useUnitsStore((state) => state.removeRange);
  const measurementActive = useMeasurementStore((state) => state.isActive);
  const startMeasurement = useMeasurementStore(
    (state) => state.startMeasurement
  );
  const stopMeasurement = useMeasurementStore((state) => state.stopMeasurement);

  const selectedUnit = units.find((unit) => unit.id === selectedUnitId) ?? null;
  const [rangeInput, setRangeInput] = useState("");

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

  const handleToggleMeasurement = () => {
    if (measurementActive) {
      stopMeasurement();
      return;
    }
    const pointA = { x: boardWidthIn / 2, y: boardHeightIn / 2 };
    const pointB = { x: pointA.x + 6, y: pointA.y };
    startMeasurement(pointA, pointB);
  };

  const handleAddRange = (rangeValue: number) => {
    if (!selectedUnitId) {
      return;
    }
    if (!Number.isFinite(rangeValue) || rangeValue <= 0) {
      return;
    }
    addRange(selectedUnitId, rangeValue);
  };

  const handleRangeSubmit = () => {
    const parsed = Number(rangeInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }
    handleAddRange(parsed);
    setRangeInput("");
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
        <button
          className="fab__button"
          type="button"
          onClick={handleToggleMeasurement}
        >
          {measurementActive ? "Stop Measure" : "Measure"}
        </button>
        {selectedUnitId && (
          <div className="fab__group">
            <div className="fab__label">Ranges</div>
            <div className="fab__row">
              {[6, 12, 18, 24].map((range) => (
                <button
                  key={range}
                  className="fab__chip"
                  type="button"
                  onClick={() => handleAddRange(range)}
                >
                  {range}"
                </button>
              ))}
            </div>
            <div className="fab__row fab__row--stack">
              <input
                className="fab__input"
                type="number"
                inputMode="decimal"
                placeholder='Range (")'
                value={rangeInput}
                onChange={(event) => setRangeInput(event.target.value)}
              />
              <button
                className="fab__chip"
                type="button"
                onClick={handleRangeSubmit}
              >
                Add
              </button>
            </div>
            {selectedUnit && selectedUnit.ranges.length > 0 && (
              <div className="fab__row fab__row--stack">
                {selectedUnit.ranges.map((range, index) => (
                  <div key={`${selectedUnit.id}-range-${index}`} className="fab__pill">
                    <span>{range}"</span>
                    <button
                      className="fab__pill-remove"
                      type="button"
                      onClick={() => removeRange(selectedUnit.id, index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
