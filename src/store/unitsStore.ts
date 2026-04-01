import { create } from "zustand";

export type Unit = {
  id: string;
  x: number;
  y: number;
  name: string;
  initials: string;
  modelCount: number;
  woundsPerModel: number;
  currentModelWounds: number[];
  iconDiameterInches: number;
  color: string;
  ranges: number[];
};

type UnitDraft = Partial<Omit<Unit, "id">> & { x?: number; y?: number };

type UnitsState = {
  units: Unit[];
  selectedUnitId: string | null;
  addUnit: (draft?: UnitDraft) => void;
  duplicateUnit: (unitId: string) => void;
  deleteUnit: (unitId: string) => void;
  setSelectedUnitId: (unitId: string | null) => void;
  setUnitPosition: (unitId: string, x: number, y: number) => void;
  addRange: (unitId: string, rangeInches: number) => void;
  removeRange: (unitId: string, rangeIndex: number) => void;
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
  const modelCount = draft?.modelCount ?? 1;
  const woundsPerModel = draft?.woundsPerModel ?? 1;
  const currentModelWounds =
    draft?.currentModelWounds ??
    Array.from({ length: modelCount }, () => woundsPerModel);

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
  };
};

export const useUnitsStore = create<UnitsState>((set, get) => ({
  units: [],
  selectedUnitId: null,
  addUnit: (draft) =>
    set((state) => {
      const unit = buildDefaultUnit(state.units.length + 1, draft);
      return { units: [...state.units, unit], selectedUnitId: unit.id };
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
      return { units: [...state.units, unit], selectedUnitId: unit.id };
    }),
  deleteUnit: (unitId) =>
    set((state) => {
      const units = state.units.filter((unit) => unit.id !== unitId);
      const selectedUnitId =
        state.selectedUnitId === unitId ? null : state.selectedUnitId;
      return { units, selectedUnitId };
    }),
  setSelectedUnitId: (unitId) => set({ selectedUnitId: unitId }),
  setUnitPosition: (unitId, x, y) =>
    set((state) => ({
      units: state.units.map((unit) =>
        unit.id === unitId ? { ...unit, x, y } : unit
      ),
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
}));
