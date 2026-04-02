import { create } from "zustand";

export type Unit = {
  id: string;
  x: number;
  y: number;
  plannedX?: number;
  plannedY?: number;
  name: string;
  initials: string;
  modelCount: number;
  woundsPerModel: number;
  currentModelWounds: number[];
  iconDiameterInches: number;
  color: string;
  ranges: number[];
  notes: string;
};

type UnitDraft = Partial<Omit<Unit, "id">> & { x?: number; y?: number };

type UnitsState = {
  units: Unit[];
  addUnit: (draft?: UnitDraft) => void;
  duplicateUnit: (unitId: string) => void;
  deleteUnit: (unitId: string) => void;
  setUnitPosition: (unitId: string, x: number, y: number) => void;
  setPlannedPosition: (unitId: string, x: number, y: number) => void;
  clearPlannedPosition: (unitId: string) => void;
  commitPlannedMoves: () => void;
  resetPlannedMoves: () => void;
  addRange: (unitId: string, rangeInches: number) => void;
  removeRange: (unitId: string, rangeIndex: number) => void;
  updateUnit: (unitId: string, updates: Partial<Unit>) => void;
  setUnits: (units: Unit[]) => void;
};

const buildInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "U";
};

const buildDefaultUnit = (index: number, draft?: UnitDraft): Unit => {
  const name = draft?.name ?? `Unit ${index}`;
  const modelCount = draft?.modelCount ?? 0;
  const woundsPerModel = draft?.woundsPerModel ?? 0;
  const currentModelWounds =
    draft?.currentModelWounds ??
    (modelCount > 0 && woundsPerModel > 0
      ? Array.from({ length: modelCount }, () => woundsPerModel)
      : []);

  return {
    id: crypto.randomUUID(),
    x: draft?.x ?? 6,
    y: draft?.y ?? 6,
    name,
    initials: draft?.initials ?? buildInitials(name),
    modelCount,
    woundsPerModel,
    currentModelWounds,
    iconDiameterInches: draft?.iconDiameterInches ?? 1.6,
    color: draft?.color ?? "#d46b41",
    ranges: [],
    notes: draft?.notes ?? "",
  };
};

export const useUnitsStore = create<UnitsState>((set) => ({
  units: [],
  addUnit: (draft) =>
    set((state) => {
      const unit = buildDefaultUnit(state.units.length + 1, draft);
      return { units: [...state.units, unit] };
    }),
  duplicateUnit: (unitId) =>
    set((state) => {
      const source = state.units.find((unit) => unit.id === unitId);
      if (!source) {
        return state;
      }
      const unit: Unit = {
        ...source,
        id: crypto.randomUUID(),
        name: `${source.name} Copy`,
        x: source.x + 1,
        y: source.y + 1,
      };
      return { units: [...state.units, unit] };
    }),
  deleteUnit: (unitId) =>
    set((state) => {
      const units = state.units.filter((unit) => unit.id !== unitId);
      return { units };
    }),
  setUnitPosition: (unitId, x, y) =>
    set((state) => ({
      units: state.units.map((unit) =>
        unit.id === unitId ? { ...unit, x, y } : unit
      ),
    })),
  setPlannedPosition: (unitId, x, y) =>
    set((state) => ({
      units: state.units.map((unit) =>
        unit.id === unitId ? { ...unit, plannedX: x, plannedY: y } : unit
      ),
    })),
  clearPlannedPosition: (unitId) =>
    set((state) => ({
      units: state.units.map((unit) =>
        unit.id === unitId
          ? { ...unit, plannedX: undefined, plannedY: undefined }
          : unit
      ),
    })),
  commitPlannedMoves: () =>
    set((state) => ({
      units: state.units.map((unit) =>
        unit.plannedX !== undefined && unit.plannedY !== undefined
          ? {
              ...unit,
              x: unit.plannedX,
              y: unit.plannedY,
              plannedX: undefined,
              plannedY: undefined,
            }
          : unit
      ),
    })),
  resetPlannedMoves: () =>
    set((state) => ({
      units: state.units.map((unit) => ({
        ...unit,
        plannedX: undefined,
        plannedY: undefined,
      })),
    })),
  addRange: (unitId, rangeInches) =>
    set((state) => ({
      units: state.units.map((unit) =>
        unit.id === unitId
          ? { ...unit, ranges: [...unit.ranges, rangeInches] }
          : unit
      ),
    })),
  removeRange: (unitId, rangeIndex) =>
    set((state) => ({
      units: state.units.map((unit) =>
        unit.id === unitId
          ? {
              ...unit,
              ranges: unit.ranges.filter((_, index) => index !== rangeIndex),
            }
          : unit
      ),
    })),
  updateUnit: (unitId, updates) =>
    set((state) => ({
      units: state.units.map((unit) =>
        unit.id === unitId ? { ...unit, ...updates } : unit
      ),
    })),
  setUnits: (units) => set({ units }),
}));
