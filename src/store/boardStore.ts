import { create } from "zustand";

export type BoardPosition = {
  x: number;
  y: number;
};

export type BoardState = {
  widthIn: number;
  heightIn: number;
  scale: number;
  position: BoardPosition;
  showGrid: boolean;
  setView: (scale: number, position: BoardPosition) => void;
  setPosition: (position: BoardPosition) => void;
  setScale: (scale: number) => void;
  toggleGrid: () => void;
};

export const useBoardStore = create<BoardState>((set) => ({
  widthIn: 60,
  heightIn: 44,
  scale: 1,
  position: { x: 0, y: 0 },
  showGrid: false,
  setView: (scale, position) => set({ scale, position }),
  setPosition: (position) => set({ position }),
  setScale: (scale) => set({ scale }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
}));
