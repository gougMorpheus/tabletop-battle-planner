import { useState } from "react";
import Board from "./components/Board";
import { useBoardStore } from "./store/boardStore";
import { useUnitsStore } from "./store/unitsStore";
import { useMeasurementStore } from "./store/measurementStore";
import { useTerrainStore } from "./store/terrainStore";
import { useSelectionStore } from "./store/selectionStore";

const App = () => {
  const showGrid = useBoardStore((state) => state.showGrid);
  const toggleGrid = useBoardStore((state) => state.toggleGrid);
  const boardWidthIn = useBoardStore((state) => state.widthIn);
  const boardHeightIn = useBoardStore((state) => state.heightIn);
  const addUnit = useUnitsStore((state) => state.addUnit);
  const duplicateUnit = useUnitsStore((state) => state.duplicateUnit);
  const deleteUnit = useUnitsStore((state) => state.deleteUnit);
  const units = useUnitsStore((state) => state.units);
  const addRange = useUnitsStore((state) => state.addRange);
  const removeRange = useUnitsStore((state) => state.removeRange);
  const measurementActive = useMeasurementStore((state) => state.isActive);
  const startMeasurement = useMeasurementStore(
    (state) => state.startMeasurement
  );
  const stopMeasurement = useMeasurementStore((state) => state.stopMeasurement);
  const terrains = useTerrainStore((state) => state.terrains);
  const addTerrain = useTerrainStore((state) => state.addTerrain);
  const duplicateTerrain = useTerrainStore((state) => state.duplicateTerrain);
  const deleteTerrain = useTerrainStore((state) => state.deleteTerrain);
  const updateTerrain = useTerrainStore((state) => state.updateTerrain);
  const selection = useSelectionStore((state) => state.selection);
  const clearSelection = useSelectionStore((state) => state.clearSelection);

  const selectedUnit =
    selection?.type === "unit"
      ? units.find((unit) => unit.id === selection.id) ?? null
      : null;
  const selectedTerrain =
    selection?.type === "terrain"
      ? terrains.find((terrain) => terrain.id === selection.id) ?? null
      : null;
  const [rangeInput, setRangeInput] = useState("");

  const handleAddUnit = () => {
    addUnit({ x: boardWidthIn / 2, y: boardHeightIn / 2 });
  };

  const handleDuplicateUnit = () => {
    if (selectedUnit) {
      duplicateUnit(selectedUnit.id);
    }
  };

  const handleDeleteUnit = () => {
    if (selectedUnit) {
      deleteUnit(selectedUnit.id);
      clearSelection();
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
    if (!selectedUnit) {
      return;
    }
    if (!Number.isFinite(rangeValue) || rangeValue <= 0) {
      return;
    }
    addRange(selectedUnit.id, rangeValue);
  };

  const handleRangeSubmit = () => {
    const parsed = Number(rangeInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }
    handleAddRange(parsed);
    setRangeInput("");
  };

  const handleAddRectTerrain = () => {
    addTerrain({
      type: "rect",
      x: boardWidthIn / 2,
      y: boardHeightIn / 2,
    });
  };

  const handleAddCircleTerrain = () => {
    addTerrain({
      type: "circle",
      x: boardWidthIn / 2,
      y: boardHeightIn / 2,
    });
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
        {selectedUnit && (
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
                  <div
                    key={`${selectedUnit.id}-range-${index}`}
                    className="fab__pill"
                  >
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
        <div className="fab__group">
          <div className="fab__label">Terrain</div>
          <div className="fab__row">
            <button
              className="fab__chip"
              type="button"
              onClick={handleAddRectTerrain}
            >
              Add Rect
            </button>
            <button
              className="fab__chip"
              type="button"
              onClick={handleAddCircleTerrain}
            >
              Add Circle
            </button>
          </div>
          {selectedTerrain && (
            <div className="fab__row fab__row--stack">
              <input
                className="fab__input"
                type="text"
                placeholder="Label"
                value={selectedTerrain.label ?? ""}
                onChange={(event) =>
                  updateTerrain(selectedTerrain.id, {
                    label: event.target.value || undefined,
                  })
                }
              />
              <input
                className="fab__input"
                type="text"
                placeholder="#Color"
                value={selectedTerrain.color}
                onChange={(event) =>
                  updateTerrain(selectedTerrain.id, {
                    color: event.target.value,
                  })
                }
              />
              <input
                className="fab__input"
                type="number"
                inputMode="decimal"
                placeholder="Rotation"
                value={selectedTerrain.rotation}
                onChange={(event) =>
                  updateTerrain(selectedTerrain.id, {
                    rotation: Number(event.target.value) || 0,
                  })
                }
              />
              {selectedTerrain.type === "rect" ? (
                <>
                  <input
                    className="fab__input"
                    type="number"
                    inputMode="decimal"
                    placeholder="Width"
                    value={selectedTerrain.widthInches}
                    onChange={(event) =>
                      updateTerrain(selectedTerrain.id, {
                        widthInches: Math.max(
                          0.5,
                          Number(event.target.value) || 0
                        ),
                      })
                    }
                  />
                  <input
                    className="fab__input"
                    type="number"
                    inputMode="decimal"
                    placeholder="Height"
                    value={selectedTerrain.heightInches}
                    onChange={(event) =>
                      updateTerrain(selectedTerrain.id, {
                        heightInches: Math.max(
                          0.5,
                          Number(event.target.value) || 0
                        ),
                      })
                    }
                  />
                </>
              ) : (
                <input
                  className="fab__input"
                  type="number"
                  inputMode="decimal"
                  placeholder="Radius"
                  value={selectedTerrain.radiusInches}
                  onChange={(event) =>
                    updateTerrain(selectedTerrain.id, {
                      radiusInches: Math.max(
                        0.5,
                        Number(event.target.value) || 0
                      ),
                    })
                  }
                />
              )}
              <div className="fab__row">
                <button
                  className="fab__chip"
                  type="button"
                  onClick={() => duplicateTerrain(selectedTerrain.id)}
                >
                  Duplicate
                </button>
                <button
                  className="fab__chip fab__chip--danger"
                  type="button"
                  onClick={() => {
                    deleteTerrain(selectedTerrain.id);
                    clearSelection();
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
        <button className="fab__button" type="button" onClick={handleAddUnit}>
          Add Unit
        </button>
        <button
          className="fab__button"
          type="button"
          onClick={handleDuplicateUnit}
          disabled={!selectedUnit}
        >
          Duplicate
        </button>
        <button
          className="fab__button fab__button--danger"
          type="button"
          onClick={handleDeleteUnit}
          disabled={!selectedUnit}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default App;
