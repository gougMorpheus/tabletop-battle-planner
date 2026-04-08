import { ChangeEvent, useEffect, useRef, useState } from "react";
import Board from "./components/Board";
import { useBoardStore } from "./store/boardStore";
import { Unit, useUnitsStore } from "./store/unitsStore";
import { useMeasurementStore } from "./store/measurementStore";
import { useTerrainStore } from "./store/terrainStore";
import { useSelectionStore } from "./store/selectionStore";
import { useDiceStore } from "./store/diceStore";
import { useGameTrackerStore } from "./store/gameTrackerStore";
import { useUiStore } from "./store/uiStore";
import {
  SceneRecord,
  deleteScene,
  listScenes,
  saveScene,
  updateSceneName,
} from "./storage/sceneDb";

const App = () => {
  const showGrid = useBoardStore((state) => state.showGrid);
  const toggleGrid = useBoardStore((state) => state.toggleGrid);
  const boardWidthIn = useBoardStore((state) => state.widthIn);
  const boardHeightIn = useBoardStore((state) => state.heightIn);
  const backgroundImageUrl = useBoardStore(
    (state) => state.backgroundImageUrl
  );
  const backgroundFit = useBoardStore((state) => state.backgroundFit);
  const backgroundScale = useBoardStore((state) => state.backgroundScale);
  const backgroundOffset = useBoardStore((state) => state.backgroundOffset);
  const showDeploymentZones = useBoardStore(
    (state) => state.showDeploymentZones
  );
  const deploymentZones = useBoardStore((state) => state.deploymentZones);
  const setBackgroundImageUrl = useBoardStore(
    (state) => state.setBackgroundImageUrl
  );
  const setBackgroundFit = useBoardStore((state) => state.setBackgroundFit);
  const setBackgroundScale = useBoardStore((state) => state.setBackgroundScale);
  const setBackgroundOffset = useBoardStore(
    (state) => state.setBackgroundOffset
  );
  const setBoardSize = useBoardStore((state) => state.setBoardSize);
  const toggleDeploymentZones = useBoardStore(
    (state) => state.toggleDeploymentZones
  );
  const updateDeploymentZone = useBoardStore(
    (state) => state.updateDeploymentZone
  );
  const setBoardConfig = useBoardStore((state) => state.setBoardConfig);
  const addUnit = useUnitsStore((state) => state.addUnit);
  const duplicateUnit = useUnitsStore((state) => state.duplicateUnit);
  const deleteUnit = useUnitsStore((state) => state.deleteUnit);
  const units = useUnitsStore((state) => state.units);
  const addRange = useUnitsStore((state) => state.addRange);
  const removeRange = useUnitsStore((state) => state.removeRange);
  const updateUnit = useUnitsStore((state) => state.updateUnit);
  const setUnits = useUnitsStore((state) => state.setUnits);
  const commitPlannedMoves = useUnitsStore(
    (state) => state.commitPlannedMoves
  );
  const resetPlannedMoves = useUnitsStore((state) => state.resetPlannedMoves);
  const measurements = useMeasurementStore((state) => state.measurements);
  const activeMeasurementId = useMeasurementStore(
    (state) => state.activeMeasurementId
  );
  const startMeasurement = useMeasurementStore(
    (state) => state.startMeasurement
  );
  const setActiveMeasurementId = useMeasurementStore(
    (state) => state.setActiveMeasurementId
  );
  const removeMeasurement = useMeasurementStore(
    (state) => state.removeMeasurement
  );
  const clearMeasurements = useMeasurementStore(
    (state) => state.clearMeasurements
  );
  const setMeasurements = useMeasurementStore((state) => state.setMeasurements);
  const terrains = useTerrainStore((state) => state.terrains);
  const addTerrain = useTerrainStore((state) => state.addTerrain);
  const duplicateTerrain = useTerrainStore((state) => state.duplicateTerrain);
  const deleteTerrain = useTerrainStore((state) => state.deleteTerrain);
  const updateTerrain = useTerrainStore((state) => state.updateTerrain);
  const setTerrains = useTerrainStore((state) => state.setTerrains);
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
  const unitInspectorOpen = useUiStore((state) => state.unitInspectorOpen);
  const setUnitInspectorOpen = useUiStore(
    (state) => state.setUnitInspectorOpen
  );
  const [isTerrainInspectorOpen, setIsTerrainInspectorOpen] = useState(false);
  const [modelCountInput, setModelCountInput] = useState("");
  const [woundsPerModelInput, setWoundsPerModelInput] = useState("");
  const [iconDiameterInput, setIconDiameterInput] = useState("");
  const [woundInputs, setWoundInputs] = useState<string[]>([]);
  const [unitNameInput, setUnitNameInput] = useState("");
  const [unitInitialsInput, setUnitInitialsInput] = useState("");
  const [unitColorInput, setUnitColorInput] = useState("");
  const [unitNotesInput, setUnitNotesInput] = useState("");
  const [boardWidthInput, setBoardWidthInput] = useState("");
  const [boardHeightInput, setBoardHeightInput] = useState("");
  const [backgroundScaleInput, setBackgroundScaleInput] = useState("");
  const [backgroundOffsetXInput, setBackgroundOffsetXInput] = useState("");
  const [backgroundOffsetYInput, setBackgroundOffsetYInput] = useState("");
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const lastImageUrlRef = useRef<string | null>(null);
  const [isDiceOpen, setIsDiceOpen] = useState(false);
  const [isScenesOpen, setIsScenesOpen] = useState(false);
  const [sceneNameInput, setSceneNameInput] = useState("");
  const [scenes, setScenes] = useState<SceneRecord[]>([]);
  const [loadingScenes, setLoadingScenes] = useState(false);
  const [isFollowUpMode, setIsFollowUpMode] = useState(false);
  const [isSideMenuCollapsed, setIsSideMenuCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    unit: true,
    terrain: false,
    measure: false,
    dice: false,
    settings: false,
  });
  const [isTrackerCollapsed, setIsTrackerCollapsed] = useState(false);
  const diceSections = useDiceStore((state) => state.sections);
  const setDiceCountInput = useDiceStore((state) => state.setCountInput);
  const setDiceTarget = useDiceStore((state) => state.setTarget);
  const rollSectionWithFollowUp = useDiceStore(
    (state) => state.rollSectionWithFollowUp
  );
  const resetAllDice = useDiceStore((state) => state.resetAll);
  const playerA = useGameTrackerStore((state) => state.playerA);
  const playerB = useGameTrackerStore((state) => state.playerB);
  const battleRound = useGameTrackerStore((state) => state.battleRound);
  const activePlayer = useGameTrackerStore((state) => state.activePlayer);
  const phase = useGameTrackerStore((state) => state.phase);
  const adjustPlayer = useGameTrackerStore((state) => state.adjustPlayer);
  const setBattleRound = useGameTrackerStore((state) => state.setBattleRound);
  const nextPhase = useGameTrackerStore((state) => state.nextPhase);
  const prevPhase = useGameTrackerStore((state) => state.prevPhase);
  const toggleActivePlayer = useGameTrackerStore(
    (state) => state.toggleActivePlayer
  );
  const setTrackerState = useGameTrackerStore((state) => state.setTrackerState);

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
      setUnitInspectorOpen(false);
    }
  };

  const handleNewMeasurement = () => {
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

  const handleSelectBackground = () => {
    imageInputRef.current?.click();
  };

  const handleBackgroundChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const url = URL.createObjectURL(file);
    if (lastImageUrlRef.current) {
      URL.revokeObjectURL(lastImageUrlRef.current);
    }
    lastImageUrlRef.current = url;
    setBackgroundImageUrl(url);
    event.target.value = "";
  };

  const handleClearBackground = () => {
    if (lastImageUrlRef.current) {
      URL.revokeObjectURL(lastImageUrlRef.current);
      lastImageUrlRef.current = null;
    }
    setBackgroundImageUrl(null);
  };

  const handleInspectorToggle = () => {
    if (!selectedUnit) {
      return;
    }
    setUnitInspectorOpen(!unitInspectorOpen);
  };

  const refreshScenes = async () => {
    setLoadingScenes(true);
    const list = await listScenes();
    setScenes(list);
    setLoadingScenes(false);
  };

  const handleNewScene = () => {
    const defaultBoard = {
      widthIn: 60,
      heightIn: 44,
      scale: 1,
      position: { x: 0, y: 0 },
      showGrid: true,
      backgroundImageUrl: null,
      backgroundFit: "contain" as const,
      backgroundScale: 1,
      backgroundOffset: { x: 0, y: 0 },
      showDeploymentZones: false,
      deploymentZones: [],
    };
    setBoardConfig(defaultBoard);
    setUnits([]);
    setTerrains([]);
    setMeasurements([]);
    setTrackerState({
      playerA: { vp: 0, cp: 0 },
      playerB: { vp: 0, cp: 0 },
      battleRound: 1,
      activePlayer: "A",
      phase: "Command",
    });
    clearSelection();
    setUnitInspectorOpen(false);
    setIsTerrainInspectorOpen(false);
    setSceneNameInput("New Scene");
    handleClearBackground();
  };

  useEffect(() => {
    if (!selectedUnit) {
      setUnitInspectorOpen(false);
    }
    if (!selectedTerrain) {
      setIsTerrainInspectorOpen(false);
    }
  }, [selectedTerrain, selectedUnit]);

  const handleOpenScenes = () => {
    setIsScenesOpen(true);
    refreshScenes();
  };

  const handleSaveScene = async () => {
    const name = sceneNameInput.trim() || "Untitled Scene";
    const boardState = useBoardStore.getState();
    const unitState = useUnitsStore.getState();
    const terrainState = useTerrainStore.getState();
    const measurementState = useMeasurementStore.getState();
    const trackerState = useGameTrackerStore.getState();
    await saveScene(name, {
      board: {
        widthIn: boardState.widthIn,
        heightIn: boardState.heightIn,
        scale: boardState.scale,
        position: boardState.position,
        showGrid: boardState.showGrid,
        backgroundImageUrl: boardState.backgroundImageUrl,
        backgroundFit: boardState.backgroundFit,
        backgroundScale: boardState.backgroundScale,
        backgroundOffset: boardState.backgroundOffset,
        showDeploymentZones: boardState.showDeploymentZones,
        deploymentZones: boardState.deploymentZones,
      },
      units: unitState.units,
      terrain: terrainState.terrains,
      measurements: measurementState.measurements,
      gameTracker: {
        playerA: trackerState.playerA,
        playerB: trackerState.playerB,
        battleRound: trackerState.battleRound,
        activePlayer: trackerState.activePlayer,
        phase: trackerState.phase,
      },
    });
    setSceneNameInput("");
    refreshScenes();
  };

  const handleLoadScene = async (scene: SceneRecord) => {
    const boardState = useBoardStore.getState();
    setBoardConfig({
      widthIn: scene.data.board.widthIn,
      heightIn: scene.data.board.heightIn,
      scale: scene.data.board.scale,
      position: scene.data.board.position,
      showGrid: scene.data.board.showGrid,
      backgroundImageUrl: scene.data.board.backgroundImageUrl,
      backgroundFit: scene.data.board.backgroundFit ?? boardState.backgroundFit,
      backgroundScale:
        scene.data.board.backgroundScale ?? boardState.backgroundScale,
      backgroundOffset:
        scene.data.board.backgroundOffset ?? boardState.backgroundOffset,
      showDeploymentZones:
        scene.data.board.showDeploymentZones ??
        boardState.showDeploymentZones,
      deploymentZones:
        scene.data.board.deploymentZones ?? boardState.deploymentZones,
    });
    setUnits(scene.data.units);
    setTerrains(scene.data.terrain);
    setMeasurements(scene.data.measurements ?? []);
    setTrackerState(scene.data.gameTracker);
    clearSelection();
    setUnitInspectorOpen(false);
    setIsScenesOpen(false);
  };

  const handleRenameScene = async (scene: SceneRecord) => {
    const name = prompt("Rename scene", scene.name);
    if (!name || name.trim().length === 0) {
      return;
    }
    await updateSceneName(scene.id, name.trim());
    refreshScenes();
  };

  const handleDeleteScene = async (scene: SceneRecord) => {
    if (!confirm(`Delete scene "${scene.name}"?`)) {
      return;
    }
    await deleteScene(scene.id);
    refreshScenes();
  };

  const handleUnitUpdate = (updates: Partial<Unit>) => {
    if (!selectedUnit) {
      return;
    }
    updateUnit(selectedUnit.id, updates);
  };

  const handleModelCountChange = (
    nextCount: number,
    woundsPerModelOverride?: number
  ) => {
    if (!selectedUnit) {
      return;
    }
    const safeCount = Math.max(0, Math.floor(nextCount));
    const woundsPerModel =
      woundsPerModelOverride ??
      finalizeNumericInput(
        woundsPerModelInput,
        selectedUnit.woundsPerModel,
        0
      );
    const current = [...selectedUnit.currentModelWounds];
    if (safeCount > current.length) {
      const toAdd = safeCount - current.length;
      current.push(...Array.from({ length: toAdd }, () => woundsPerModel));
    } else if (safeCount < current.length) {
      current.length = safeCount;
    }
    handleUnitUpdate({
      modelCount: safeCount,
      woundsPerModel,
      currentModelWounds: current,
    });
  };

  const handleWoundsPerModelChange = (next: number) => {
    if (!selectedUnit) {
      return;
    }
    const safeValue = Math.max(0, Math.floor(next));
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
      setUnitNotesInput("");
      return;
    }
    setModelCountInput(String(selectedUnit.modelCount));
    setWoundsPerModelInput(String(selectedUnit.woundsPerModel));
    setIconDiameterInput(String(selectedUnit.iconDiameterInches));
    setWoundInputs(selectedUnit.currentModelWounds.map((value) => String(value)));
    setUnitNameInput(selectedUnit.name);
    setUnitInitialsInput(selectedUnit.initials);
    setUnitColorInput(selectedUnit.color);
    setUnitNotesInput(selectedUnit.notes ?? "");
  }, [selectedUnit]);

  useEffect(() => {
    setBoardWidthInput(String(boardWidthIn));
    setBoardHeightInput(String(boardHeightIn));
  }, [boardHeightIn, boardWidthIn]);

  useEffect(() => {
    setBackgroundScaleInput(String(backgroundScale));
    setBackgroundOffsetXInput(String(backgroundOffset.x));
    setBackgroundOffsetYInput(String(backgroundOffset.y));
  }, [backgroundOffset.x, backgroundOffset.y, backgroundScale]);

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

  const colorPresets = ["#b83b3b", "#3b7db8", "#4f9d69", "#6d6f73"];
  const formatDecimal = (value: number) => value.toFixed(1);
  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="app">
      <header className="top-bar">
        <div className="top-bar__title">Tabletop Battle Planner</div>
      </header>
      <main className="board-shell">
        <Board />
        <input
          ref={imageInputRef}
          className="fab__hidden-input"
          type="file"
          accept="image/*"
          onChange={handleBackgroundChange}
        />
        {isTrackerCollapsed ? (
          <div className="tracker-overlay tracker-overlay--collapsed">
            <div className="tracker-overlay__compact">
              <div>R{battleRound}</div>
              <div>{phase}</div>
              <div>Active {activePlayer}</div>
            </div>
            <button
              className="tracker-overlay__toggle"
              type="button"
              onClick={() => setIsTrackerCollapsed(false)}
            >
              Expand
            </button>
          </div>
        ) : (
          <div className="tracker-overlay">
            <div className="tracker-overlay__row">
              <div className="tracker-overlay__phase">
                <span>Round</span>
                <div className="tracker-overlay__phase-controls">
                  <button
                    type="button"
                    onClick={() => setBattleRound(Math.max(1, battleRound - 1))}
                  >
                    Prev
                  </button>
                  <div>{battleRound}</div>
                  <button
                    type="button"
                    onClick={() => setBattleRound(battleRound + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className="tracker-overlay__phase">
                <span>Phase</span>
                <div className="tracker-overlay__phase-controls">
                  <button type="button" onClick={prevPhase}>
                    Prev
                  </button>
                  <div>{phase}</div>
                  <button type="button" onClick={nextPhase}>
                    Next
                  </button>
                </div>
              </div>
              <button
                className="tracker-overlay__active"
                type="button"
                onClick={toggleActivePlayer}
              >
                Active: {activePlayer}
              </button>
            </div>
            <div className="tracker-overlay__row tracker-overlay__row--stats">
              <div className="tracker-overlay__stat">
                <span>A VP</span>
                <div className="tracker-overlay__controls">
                  <button
                    type="button"
                    onClick={() => adjustPlayer("A", "vp", -1)}
                  >
                    -
                  </button>
                  <div>{playerA.vp}</div>
                  <button
                    type="button"
                    onClick={() => adjustPlayer("A", "vp", 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="tracker-overlay__stat">
                <span>A CP</span>
                <div className="tracker-overlay__controls">
                  <button
                    type="button"
                    onClick={() => adjustPlayer("A", "cp", -1)}
                  >
                    -
                  </button>
                  <div>{playerA.cp}</div>
                  <button
                    type="button"
                    onClick={() => adjustPlayer("A", "cp", 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="tracker-overlay__stat">
                <span>B VP</span>
                <div className="tracker-overlay__controls">
                  <button
                    type="button"
                    onClick={() => adjustPlayer("B", "vp", -1)}
                  >
                    -
                  </button>
                  <div>{playerB.vp}</div>
                  <button
                    type="button"
                    onClick={() => adjustPlayer("B", "vp", 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="tracker-overlay__stat">
                <span>B CP</span>
                <div className="tracker-overlay__controls">
                  <button
                    type="button"
                    onClick={() => adjustPlayer("B", "cp", -1)}
                  >
                    -
                  </button>
                  <div>{playerB.cp}</div>
                  <button
                    type="button"
                    onClick={() => adjustPlayer("B", "cp", 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <button
              className="tracker-overlay__toggle"
              type="button"
              onClick={() => setIsTrackerCollapsed(true)}
            >
              Collapse
            </button>
          </div>
        )}
        <div className={`side-menu${isSideMenuCollapsed ? " side-menu--collapsed" : ""}`}>
          <div className="side-menu__header">
            <div className="side-menu__title">Tools</div>
            <button
              className="side-menu__button side-menu__button--ghost"
              type="button"
              onClick={() => setIsSideMenuCollapsed((prev) => !prev)}
            >
              {isSideMenuCollapsed ? "Expand" : "Collapse"}
            </button>
          </div>
          {!isSideMenuCollapsed && (
            <div className="side-menu__content">
              <div className="side-menu__section">
                <button
                  className="side-menu__section-toggle"
                  type="button"
                  onClick={() => toggleSection("unit")}
                >
                  Unit
                </button>
                {openSections.unit && (
                  <div className="side-menu__section-body">
                    <button
                      className="side-menu__button"
                      type="button"
                      onClick={handleAddUnit}
                    >
                      Add Unit
                    </button>
                    {selectedUnit && (
                      <>
                <button
                  className="side-menu__button"
                  type="button"
                  onClick={handleInspectorToggle}
                >
                  {unitInspectorOpen ? "Hide Inspector" : "Inspector"}
                </button>
                <div className="side-menu__row">
                  <input
                    className="side-menu__input"
                    type="number"
                    inputMode="decimal"
                    placeholder='Range'
                    value={rangeInput}
                    onChange={(event) => setRangeInput(event.target.value)}
                  />
                  <button
                    className="side-menu__button side-menu__button--ghost"
                    type="button"
                    onClick={handleRangeSubmit}
                  >
                    Add
                  </button>
                </div>
                {selectedUnit.ranges.length > 0 && (
                  <div className="side-menu__list">
                    {selectedUnit.ranges.map((range, index) => (
                      <div
                        key={`${selectedUnit.id}-range-${index}`}
                        className="side-menu__list-item"
                      >
                        <span>{formatDecimal(range)}"</span>
                        <button
                          className="side-menu__link"
                          type="button"
                          onClick={() => removeRange(selectedUnit.id, index)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  className="side-menu__button side-menu__button--ghost"
                  type="button"
                  onClick={handleDuplicateUnit}
                >
                  Duplicate
                </button>
                <button
                  className="side-menu__button side-menu__button--ghost"
                  type="button"
                  onClick={handleDeleteUnit}
                >
                  Delete
                </button>
              </>
            )}
                    <div className="side-menu__row">
                      <button
                        className="side-menu__button side-menu__button--ghost"
                        type="button"
                        onClick={commitPlannedMoves}
                        disabled={!hasPlannedMoves}
                      >
                        Commit
                      </button>
                      <button
                        className="side-menu__button side-menu__button--ghost"
                        type="button"
                        onClick={resetPlannedMoves}
                        disabled={!hasPlannedMoves}
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="side-menu__section">
                <button
                  className="side-menu__section-toggle"
                  type="button"
                  onClick={() => toggleSection("terrain")}
                >
                  Terrain
                </button>
                {openSections.terrain && (
                  <div className="side-menu__section-body">
                    <button
                      className="side-menu__button"
                      type="button"
                      onClick={handleAddRectTerrain}
                    >
                      Add Rect
                    </button>
                    <button
                      className="side-menu__button"
                      type="button"
                      onClick={handleAddCircleTerrain}
                    >
                      Add Circle
                    </button>
                    {selectedTerrain && (
                      <>
                        <button
                          className="side-menu__button"
                          type="button"
                          onClick={() =>
                            setIsTerrainInspectorOpen((open) => !open)
                          }
                        >
                          {isTerrainInspectorOpen ? "Hide Inspector" : "Inspector"}
                        </button>
                        <button
                          className="side-menu__button side-menu__button--ghost"
                          type="button"
                          onClick={() => duplicateTerrain(selectedTerrain.id)}
                        >
                          Duplicate
                        </button>
                        <button
                          className="side-menu__button side-menu__button--ghost"
                          type="button"
                          onClick={() => {
                            deleteTerrain(selectedTerrain.id);
                            clearSelection();
                          }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="side-menu__section">
                <button
                  className="side-menu__section-toggle"
                  type="button"
                  onClick={() => toggleSection("measure")}
                >
                  Measure
                </button>
                {openSections.measure && (
                  <div className="side-menu__section-body">
                    <button
                      className="side-menu__button"
                      type="button"
                      onClick={handleNewMeasurement}
                    >
                      New Measurement
                    </button>
                    {measurements.length > 0 && (
                      <>
                        <button
                          className="side-menu__button side-menu__button--ghost"
                          type="button"
                          onClick={clearMeasurements}
                        >
                          Clear All
                        </button>
                        <div className="side-menu__list">
                          {measurements.map((measurement, index) => (
                            <div
                              key={measurement.id}
                              className="side-menu__list-item"
                            >
                              <button
                                className={
                                  measurement.id === activeMeasurementId
                                    ? "side-menu__link side-menu__link--active"
                                    : "side-menu__link"
                                }
                                type="button"
                                onClick={() =>
                                  setActiveMeasurementId(measurement.id)
                                }
                              >
                                Measure {index + 1}
                              </button>
                              <button
                                className="side-menu__link"
                                type="button"
                                onClick={() => removeMeasurement(measurement.id)}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="side-menu__section">
                <button
                  className="side-menu__section-toggle"
                  type="button"
                  onClick={() => toggleSection("dice")}
                >
                  Dice
                </button>
                {openSections.dice && (
                  <div className="side-menu__section-body">
                    <button
                      className="side-menu__button"
                      type="button"
                      onClick={() => setIsDiceOpen(true)}
                    >
                      Open Dice
                    </button>
                  </div>
                )}
              </div>
              <div className="side-menu__section">
                <button
                  className="side-menu__section-toggle"
                  type="button"
                  onClick={() => toggleSection("settings")}
                >
                  Settings
                </button>
                {openSections.settings && (
                  <div className="side-menu__section-body">
                    <div className="side-menu__field-group">
                      <div className="side-menu__label">Board Size (in)</div>
                      <div className="side-menu__row">
                        <input
                          className="side-menu__input"
                          type="text"
                          inputMode="decimal"
                          value={boardWidthInput}
                          onChange={(event) =>
                            setBoardWidthInput(event.target.value)
                          }
                          onBlur={() => {
                            const nextWidth = finalizeNumericInput(
                              boardWidthInput,
                              boardWidthIn,
                              1
                            );
                            setBoardSize(nextWidth, boardHeightIn);
                            setBoardWidthInput(String(nextWidth));
                          }}
                          placeholder="Width"
                        />
                        <input
                          className="side-menu__input"
                          type="text"
                          inputMode="decimal"
                          value={boardHeightInput}
                          onChange={(event) =>
                            setBoardHeightInput(event.target.value)
                          }
                          onBlur={() => {
                            const nextHeight = finalizeNumericInput(
                              boardHeightInput,
                              boardHeightIn,
                              1
                            );
                            setBoardSize(boardWidthIn, nextHeight);
                            setBoardHeightInput(String(nextHeight));
                          }}
                          placeholder="Height"
                        />
                      </div>
                    </div>
                    <button
                      className="side-menu__button"
                      type="button"
                      onClick={toggleGrid}
                    >
                      {showGrid ? "Grid On" : "Grid Off"}
                    </button>
                    <button
                      className="side-menu__button side-menu__button--ghost"
                      type="button"
                      onClick={handleSelectBackground}
                    >
                      {backgroundImageUrl ? "Replace Background" : "Add Background"}
                    </button>
                    {backgroundImageUrl && (
                      <>
                        <button
                          className="side-menu__button side-menu__button--ghost"
                          type="button"
                          onClick={handleClearBackground}
                        >
                          Remove Background
                        </button>
                        <div className="side-menu__field-group">
                          <div className="side-menu__label">Background Fit</div>
                          <select
                            className="side-menu__select"
                            value={backgroundFit}
                            onChange={(event) =>
                              setBackgroundFit(
                                event.target.value as "contain" | "cover"
                              )
                            }
                          >
                            <option value="contain">Contain</option>
                            <option value="cover">Cover</option>
                          </select>
                        </div>
                        <div className="side-menu__field-group">
                          <div className="side-menu__label">Background Scale</div>
                          <input
                            className="side-menu__input"
                            type="text"
                            inputMode="decimal"
                            value={backgroundScaleInput}
                            onChange={(event) =>
                              setBackgroundScaleInput(event.target.value)
                            }
                            onBlur={() => {
                              const nextScale = finalizeNumericInput(
                                backgroundScaleInput,
                                backgroundScale,
                                0.25
                              );
                              setBackgroundScale(nextScale);
                              setBackgroundScaleInput(String(nextScale));
                            }}
                          />
                        </div>
                        <div className="side-menu__field-group">
                          <div className="side-menu__label">
                            Background Offset (in)
                          </div>
                          <div className="side-menu__row">
                            <input
                              className="side-menu__input"
                              type="text"
                              inputMode="decimal"
                              value={backgroundOffsetXInput}
                              onChange={(event) =>
                                setBackgroundOffsetXInput(event.target.value)
                              }
                              onBlur={() => {
                                const nextX = finalizeNumericInput(
                                  backgroundOffsetXInput,
                                  backgroundOffset.x,
                                  -9999
                                );
                                setBackgroundOffset({
                                  x: nextX,
                                  y: backgroundOffset.y,
                                });
                                setBackgroundOffsetXInput(String(nextX));
                              }}
                              placeholder="X"
                            />
                            <input
                              className="side-menu__input"
                              type="text"
                              inputMode="decimal"
                              value={backgroundOffsetYInput}
                              onChange={(event) =>
                                setBackgroundOffsetYInput(event.target.value)
                              }
                              onBlur={() => {
                                const nextY = finalizeNumericInput(
                                  backgroundOffsetYInput,
                                  backgroundOffset.y,
                                  -9999
                                );
                                setBackgroundOffset({
                                  x: backgroundOffset.x,
                                  y: nextY,
                                });
                                setBackgroundOffsetYInput(String(nextY));
                              }}
                              placeholder="Y"
                            />
                          </div>
                        </div>
                      </>
                    )}
                    <div className="side-menu__field-group">
                      <button
                        className="side-menu__button"
                        type="button"
                        onClick={toggleDeploymentZones}
                      >
                        {showDeploymentZones ? "Hide Deployment" : "Show Deployment"}
                      </button>
                    </div>
                    {showDeploymentZones &&
                      deploymentZones.map((zone) => (
                        <div key={zone.id} className="side-menu__field-group">
                          <div className="side-menu__label">{zone.label}</div>
                          <div className="side-menu__row">
                            <input
                              className="side-menu__input"
                              type="text"
                              inputMode="decimal"
                              value={zone.x}
                              onChange={(event) =>
                                updateDeploymentZone(zone.id, {
                                  x: Number(event.target.value) || 0,
                                })
                              }
                              placeholder="X"
                            />
                            <input
                              className="side-menu__input"
                              type="text"
                              inputMode="decimal"
                              value={zone.y}
                              onChange={(event) =>
                                updateDeploymentZone(zone.id, {
                                  y: Number(event.target.value) || 0,
                                })
                              }
                              placeholder="Y"
                            />
                          </div>
                          <div className="side-menu__row">
                            <input
                              className="side-menu__input"
                              type="text"
                              inputMode="decimal"
                              value={zone.width}
                              onChange={(event) =>
                                updateDeploymentZone(zone.id, {
                                  width: Math.max(
                                    0.5,
                                    Number(event.target.value) || 0
                                  ),
                                })
                              }
                              placeholder="W"
                            />
                            <input
                              className="side-menu__input"
                              type="text"
                              inputMode="decimal"
                              value={zone.height}
                              onChange={(event) =>
                                updateDeploymentZone(zone.id, {
                                  height: Math.max(
                                    0.5,
                                    Number(event.target.value) || 0
                                  ),
                                })
                              }
                              placeholder="H"
                            />
                          </div>
                          <div className="side-menu__row side-menu__row--colors">
                            {colorPresets.map((color) => (
                              <button
                                key={`${zone.id}-${color}`}
                                className="color-swatch"
                                type="button"
                                style={{ backgroundColor: color }}
                                onClick={() =>
                                  updateDeploymentZone(zone.id, { color })
                                }
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    <button
                      className="side-menu__button side-menu__button--ghost"
                      type="button"
                      onClick={handleOpenScenes}
                    >
                      Scenes
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      {selectedUnit && unitInspectorOpen && (
        <div className="inspector inspector--floating">
          <div className="inspector__header">
            <div className="inspector__title">Unit Inspector</div>
            <button
              className="inspector__close"
              type="button"
              onClick={() => setUnitInspectorOpen(false)}
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
                    0
                  );
                  handleWoundsPerModelChange(nextValue);
                  setWoundsPerModelInput(String(nextValue));
                }}
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
                  const nextWounds = finalizeNumericInput(
                    woundsPerModelInput,
                    selectedUnit.woundsPerModel,
                    0
                  );
                  if (nextWounds !== selectedUnit.woundsPerModel) {
                    handleWoundsPerModelChange(nextWounds);
                    setWoundsPerModelInput(String(nextWounds));
                  }
                  const nextValue = finalizeNumericInput(
                    modelCountInput,
                    selectedUnit.modelCount,
                    0
                  );
                  handleModelCountChange(nextValue, nextWounds);
                  setModelCountInput(String(nextValue));
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
            <div className="inspector__row inspector__row--colors">
              {colorPresets.map((color) => (
                <button
                  key={`unit-${color}`}
                  className="color-swatch"
                  type="button"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    setUnitColorInput(color);
                    handleUnitUpdate({ color });
                  }}
                />
              ))}
            </div>
            <div className="inspector__stats">
              <div>Alive: {derivedStats?.alive ?? 0}</div>
              <div>Dead: {derivedStats?.dead ?? 0}</div>
              <div>Wounds Remaining: {derivedStats?.remaining ?? 0}</div>
            </div>
            <label className="inspector__field">
              <span>Notes</span>
              <textarea
                rows={3}
                value={unitNotesInput}
                onChange={(event) => setUnitNotesInput(event.target.value)}
                onBlur={() => handleUnitUpdate({ notes: unitNotesInput })}
              />
            </label>
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
      {selectedTerrain && isTerrainInspectorOpen && (
        <div className="inspector inspector--floating">
          <div className="inspector__header">
            <div className="inspector__title">Terrain Inspector</div>
            <button
              className="inspector__close"
              type="button"
              onClick={() => clearSelection()}
            >
              Close
            </button>
          </div>
          <div className="inspector__content">
            <label className="inspector__field">
              <span>Label</span>
              <input
                type="text"
                value={selectedTerrain.label ?? ""}
                onChange={(event) =>
                  updateTerrain(selectedTerrain.id, {
                    label: event.target.value || undefined,
                  })
                }
              />
            </label>
            <label className="inspector__field">
              <span>Color</span>
              <input
                type="text"
                value={selectedTerrain.color}
                onChange={(event) =>
                  updateTerrain(selectedTerrain.id, {
                    color: event.target.value,
                  })
                }
              />
            </label>
            <div className="inspector__row inspector__row--colors">
              {colorPresets.map((color) => (
                <button
                  key={`terrain-${color}`}
                  className="color-swatch"
                  type="button"
                  style={{ backgroundColor: color }}
                  onClick={() =>
                    updateTerrain(selectedTerrain.id, { color })
                  }
                />
              ))}
            </div>
            <label className="inspector__field">
              <span>Rotation</span>
              <input
                type="number"
                inputMode="decimal"
                value={selectedTerrain.rotation}
                onChange={(event) =>
                  updateTerrain(selectedTerrain.id, {
                    rotation: Number(event.target.value) || 0,
                  })
                }
              />
            </label>
            {selectedTerrain.type === "rect" ? (
              <>
                <label className="inspector__field">
                  <span>Width</span>
                  <input
                    type="number"
                    inputMode="decimal"
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
                </label>
                <label className="inspector__field">
                  <span>Height</span>
                  <input
                    type="number"
                    inputMode="decimal"
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
                </label>
              </>
            ) : (
              <label className="inspector__field">
                <span>Radius</span>
                <input
                  type="number"
                  inputMode="decimal"
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
              </label>
            )}
            <div className="inspector__row">
              <button
                className="inspector__button"
                type="button"
                onClick={() => duplicateTerrain(selectedTerrain.id)}
              >
                Duplicate
              </button>
              <button
                className="inspector__button inspector__button--danger"
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
        </div>
      )}
      {isScenesOpen && (
        <div className="scenes">
          <div className="scenes__modal">
            <div className="scenes__header">
              <div className="scenes__title">Scenes</div>
              <div className="scenes__actions">
                <button
                  className="scenes__button"
                  type="button"
                  onClick={handleNewScene}
                >
                  New Scene
                </button>
                <button
                  className="scenes__button scenes__button--ghost"
                  type="button"
                  onClick={() => setIsScenesOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="scenes__content">
              <div className="scenes__row">
                <input
                  className="scenes__input"
                  type="text"
                  placeholder="Scene name"
                  value={sceneNameInput}
                  onChange={(event) => setSceneNameInput(event.target.value)}
                />
                <button
                  className="scenes__button"
                  type="button"
                  onClick={handleSaveScene}
                >
                  Save
                </button>
              </div>
              {loadingScenes ? (
                <div className="scenes__empty">Loading scenes...</div>
              ) : scenes.length === 0 ? (
                <div className="scenes__empty">No saved scenes yet.</div>
              ) : (
                <div className="scenes__list">
                  {scenes.map((scene) => (
                    <div key={scene.id} className="scenes__item">
                      <div className="scenes__item-name">{scene.name}</div>
                      <div className="scenes__item-actions">
                        <button
                          className="scenes__button"
                          type="button"
                          onClick={() => handleLoadScene(scene)}
                        >
                          Load
                        </button>
                        <button
                          className="scenes__button scenes__button--ghost"
                          type="button"
                          onClick={() => handleRenameScene(scene)}
                        >
                          Rename
                        </button>
                        <button
                          className="scenes__button scenes__button--danger"
                          type="button"
                          onClick={() => handleDeleteScene(scene)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {isDiceOpen && (
        <div className="dice">
          <div className="dice__modal">
            <div className="dice__header">
              <div className="dice__title">Dice Roller</div>
              <div className="dice__actions">
              <button
                className="dice__button dice__button--ghost"
                type="button"
                onClick={() => setIsFollowUpMode((prev) => !prev)}
              >
                Follow-up: {isFollowUpMode ? "On" : "Off"}
              </button>
              <button
                className="dice__button"
                type="button"
                onClick={resetAllDice}
              >
                Reset
              </button>
                <button
                  className="dice__button dice__button--ghost"
                  type="button"
                  onClick={() => setIsDiceOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="dice__sections">
              {diceSections.map((section, index) => {
                const parsedCount = Number(section.countInput);
                const count = Number.isFinite(parsedCount) ? parsedCount : 0;
                const sum = section.results.reduce(
                  (total, value) => total + value,
                  0
                );
                const successes =
                  section.target !== null
                    ? section.results.filter((value) => value >= section.target!).length
                    : null;
                const rolledCount = section.lastRolledCount;
                return (
                  <div key={index} className="dice__section">
                    <div className="dice__section-header">
                      <div className="dice__section-title">
                        Roll {index + 1}
                      </div>
                      <button
                        className="dice__button"
                        type="button"
                        onClick={() => rollSectionWithFollowUp(index, isFollowUpMode)}
                      >
                        Roll
                      </button>
                    </div>
                    <div className="dice__controls">
                      <label className="dice__control">
                        <span>Dice</span>
                        <input
                          className="dice__input"
                          type="text"
                          inputMode="numeric"
                          placeholder="Count"
                          value={section.countInput}
                          onChange={(event) =>
                            setDiceCountInput(index, event.target.value)
                          }
                        />
                      </label>
                      <label className="dice__control">
                        <span>Target</span>
                        <select
                          className="dice__select"
                          value={section.target ?? ""}
                          onChange={(event) => {
                            const value = event.target.value;
                            setDiceTarget(index, value ? Number(value) : null);
                          }}
                        >
                          <option value="">None</option>
                          {[2, 3, 4, 5, 6].map((value) => (
                            <option key={value} value={value}>
                              {value}+
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    {section.error && (
                      <div className="dice__error">{section.error}</div>
                    )}
                    <div className="dice__summary">
                      <div>Dice: {count}</div>
                      <div>Sum: {sum}</div>
                      {section.target !== null && (
                        <div>
                          Successes: {successes ?? 0}/{rolledCount} ({"\u2265"}
                          {section.target})
                        </div>
                      )}
                    </div>
                  <div className="dice__results">
                    {section.results.length > 0 ? (
                      <div className="dice__result-list">
                        {[...section.results]
                          .sort((a, b) => b - a)
                          .map((value, resultIndex) => {
                            const isSuccess =
                              section.target !== null && value >= section.target;
                            const isFailure =
                              section.target !== null && value < section.target;
                            const className = isSuccess
                              ? "dice__result dice__result--success"
                              : isFailure
                                ? "dice__result dice__result--fail"
                                : "dice__result";
                            return (
                              <span key={resultIndex} className={className}>
                                {value}
                              </span>
                            );
                          })}
                      </div>
                    ) : (
                      "No rolls yet."
                    )}
                  </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
