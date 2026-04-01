import { create } from "zustand";

type UiState = {
  unitInspectorOpen: boolean;
  setUnitInspectorOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  unitInspectorOpen: false,
  setUnitInspectorOpen: (open) => set({ unitInspectorOpen: open }),
}));
