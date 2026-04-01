import { useEffect, useState } from "react";
import Board from "./components/Board";
import { useBoardStore } from "./store/boardStore";
import { Unit, useUnitsStore } from "./store/unitsStore";
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
  const updateUnit = useUnitsStore((state) => state.updateUnit);
  const commitPlannedMoves = useUnitsStore(
    (state) => state.commitPlannedMoves
  );
  const resetPlannedMoves = useUnitsStore((state) => state.resetPlannedMoves);
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
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [modelCountInput, setModelCountInput] = useState("");
  const [woundsPerModelInput, setWoundsPerModelInput] = useState("");
  const [iconDiameterInput, setIconDiameterInput] = useState("");
  const [woundInputs, setWoundInputs] = useState<string[]>([]);
  const [unitNameInput, setUnitNameInput] = useState("");
  const [unitInitialsInput, setUnitInitialsInput] = useState("");
  const [unitColorInput, setUnitColorInput] = useState("");

  const hasPlannedMoves = units.some(
    (unit) => unit.plannedX !== undefined || unit.plannedY !== undefined
  );

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
      setIsInspectorOpen(false);
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

  const handleInspectorToggle = () => {
    if (!selectedUnit) {
      return;
    }
    setIsInspectorOpen((open) => !open);
  };

  const handleUnitUpdate = (updates: Partial<Unit>) => {
    if (!selectedUnit) {
      return;
    }
    updateUnit(selectedUnit.id, updates);
  };

  const handleModelCountChange = (nextCount: number) => {
    if (!selectedUnit) {
      return;
    }
    const safeCount = Math.max(1, Math.floor(nextCount));
    const current = [...selectedUnit.currentModelWounds];
    if (safeCount > current.length) {
      const toAdd = safeCount - current.length;
      current.push(
        ...Array.from({ length: toAdd }, () => selectedUnit.woundsPerModel)
      );
    } else if (safeCount < current.length) {
      current.length = safeCount;
    }
    handleUnitUpdate({ modelCount: safeCount, currentModelWounds: current });
  };

  const handleWoundsPerModelChange = (next: number) => {
    if (!selectedUnit) {
      return;
    }
    const safeValue = Math.max(1, Math.floor(next));
    const current = [...selectedUnit.currentModelWounds].map((value) =>
      Math.min(value, safeValue)
    );
    handleUnitUpdate({ woundsPerModel: safeValue, currentModelWounds: current });
  };

  const handleModelWoundChange = (index: number, value: number) => {
    if (!selectedUnit) {
      return;
    }
    const safeValue = Math.max(0, Math.floor(value));
    const current = [...selectedUnit.currentModelWounds];
    const maxWounds = selectedUnit.woundsPerModel;
    current[index] = Math.min(safeValue, maxWounds);
    handleUnitUpdate({ currentModelWounds: current });
  };

  const finalizeNumericInput = (
    rawValue: string,
    fallback: number,
    minValue: number
  ) => {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.max(minValue, parsed);
  };

  useEffect(() => {
    if (!selectedUnit) {
      setModelCountInput("");
      setWoundsPerModelInput("");
      setIconDiameterInput("");
      setWoundInputs([]);
      setUnitNameInput("");
      setUnitInitialsInput("");
      setUnitColorInput("");
      return;
    }
    setModelCountInput(String(selectedUnit.modelCount));
    setWoundsPerModelInput(String(selectedUnit.woundsPerModel));
    setIconDiameterInput(String(selectedUnit.iconDiameterInches));
    setWoundInputs(selectedUnit.currentModelWounds.map((value) => String(value)));
    setUnitNameInput(selectedUnit.name);
    setUnitInitialsInput(selectedUnit.initials);
    setUnitColorInput(selectedUnit.color);
  }, [selectedUnit]);

  const derivedStats = selectedUnit
    ? {
        alive: selectedUnit.currentModelWounds.filter((wounds) => wounds > 0)
          .length,
        dead: selectedUnit.currentModelWounds.filter((wounds) => wounds <= 0)
          .length,
        remaining: selectedUnit.currentModelWounds.reduce(
          (sum, wounds) => sum + wounds,
          0
        ),
      }
    : null;

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
        <button
          className="fab__button"
          type="button"
          onClick={handleInspectorToggle}
          disabled={!selectedUnit}
        >
          {isInspectorOpen ? "Hide Inspector" : "Inspector"}
        </button>
        <button
          className="fab__button"
          type="button"
          onClick={commitPlannedMoves}
          disabled={!hasPlannedMoves}
        >
          Commit Moves
        </button>
        <button
          className="fab__button"
          type="button"
          onClick={resetPlannedMoves}
          disabled={!hasPlannedMoves}
        >
          Reset Moves
        </button>
      </div>
      {selectedUnit && isInspectorOpen && (
        <div className="inspector">
          <div className="inspector__header">
            <div className="inspector__title">Unit Inspector</div>
            <button
              className="inspector__close"
              type="button"
              onClick={() => setIsInspectorOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="inspector__content">
            <label className="inspector__field">
              <span>Name</span>
              <input
                type="text"
                value={unitNameInput}
                onChange={(event) => setUnitNameInput(event.target.value)}
                onBlur={() => handleUnitUpdate({ name: unitNameInput.trim() })}
              />
            </label>
            <label className="inspector__field">
              <span>Initials</span>
              <input
                type="text"
                value={unitInitialsInput}
                onChange={(event) => setUnitInitialsInput(event.target.value)}
                onBlur={() =>
                  handleUnitUpdate({ initials: unitInitialsInput.trim() })
                }
              />
            </label>
            <label className="inspector__field">
              <span>Model Count</span>
              <input
                type="text"
                inputMode="numeric"
                value={modelCountInput}
                onChange={(event) => setModelCountInput(event.target.value)}
                onBlur={() => {
                  if (!selectedUnit) {
                    return;
                  }
                  const nextValue = finalizeNumericInput(
                    modelCountInput,
                    selectedUnit.modelCount,
                    1
                  );
                  handleModelCountChange(nextValue);
                  setModelCountInput(String(nextValue));
                }}
              />
            </label>
            <label className="inspector__field">
              <span>Wounds / Model</span>
              <input
                type="text"
                inputMode="numeric"
                value={woundsPerModelInput}
                onChange={(event) => setWoundsPerModelInput(event.target.value)}
                onBlur={() => {
                  if (!selectedUnit) {
                    return;
                  }
                  const nextValue = finalizeNumericInput(
                    woundsPerModelInput,
                    selectedUnit.woundsPerModel,
                    1
                  );
                  handleWoundsPerModelChange(nextValue);
                  setWoundsPerModelInput(String(nextValue));
                }}
              />
            </label>
            <label className="inspector__field">
              <span>Icon Diameter (in)</span>
              <input
                type="text"
                inputMode="decimal"
                value={iconDiameterInput}
                onChange={(event) => setIconDiameterInput(event.target.value)}
                onBlur={() => {
                  if (!selectedUnit) {
                    return;
                  }
                  const nextValue = finalizeNumericInput(
                    iconDiameterInput,
                    selectedUnit.iconDiameterInches,
                    0.5
                  );
                  handleUnitUpdate({ iconDiameterInches: nextValue });
                  setIconDiameterInput(String(nextValue));
                }}
              />
            </label>
            <label className="inspector__field">
              <span>Color</span>
              <input
                type="text"
                value={unitColorInput}
                onChange={(event) => setUnitColorInput(event.target.value)}
                onBlur={() => handleUnitUpdate({ color: unitColorInput.trim() })}
              />
            </label>
            <div className="inspector__stats">
              <div>Alive: {derivedStats?.alive ?? 0}</div>
              <div>Dead: {derivedStats?.dead ?? 0}</div>
              <div>Wounds Remaining: {derivedStats?.remaining ?? 0}</div>
            </div>
            <div className="inspector__wounds">
              {selectedUnit.currentModelWounds.map((wounds, index) => (
                <label className="inspector__wound" key={index}>
                  <span>Model {index + 1}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={woundInputs[index] ?? String(wounds)}
                    onChange={(event) =>
                      setWoundInputs((prev) => {
                        const next = [...prev];
                        next[index] = event.target.value;
                        return next;
                      })
                    }
                    onBlur={() => {
                      if (!selectedUnit) {
                        return;
                      }
                      const fallback = selectedUnit.currentModelWounds[index] ?? 0;
                      const nextValue = finalizeNumericInput(
                        woundInputs[index] ?? String(fallback),
                        fallback,
                        0
                      );
                      const clamped = Math.min(
                        nextValue,
                        selectedUnit.woundsPerModel
                      );
                      handleModelWoundChange(index, clamped);
                      setWoundInputs((prev) => {
                        const next = [...prev];
                        next[index] = String(clamped);
                        return next;
                      });
                    }}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
