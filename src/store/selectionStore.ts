import { create } from "zustand";

export type Selection =
  | { type: "unit"; id: string }
  | { type: "terrain"; id: string }
  | null;

type SelectionState = {
  selection: Selection;
  setSelection: (selection: Selection) => void;
  clearSelection: () => void;
};

export const useSelectionStore = create<SelectionState>((set) => ({
  selection: null,
  setSelection: (selection) => set({ selection }),
  clearSelection: () => set({ selection: null }),
}));
