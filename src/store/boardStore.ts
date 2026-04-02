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
  backgroundImageUrl: string | null;
  backgroundFit: "contain" | "cover";
  backgroundScale: number;
  backgroundOffset: BoardPosition;
  showDeploymentZones: boolean;
  deploymentZones: {
    id: string;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
  }[];
  setView: (scale: number, position: BoardPosition) => void;
  setPosition: (position: BoardPosition) => void;
  setScale: (scale: number) => void;
  toggleGrid: () => void;
  setBackgroundImageUrl: (url: string | null) => void;
  setBackgroundFit: (fit: "contain" | "cover") => void;
  setBackgroundScale: (scale: number) => void;
  setBackgroundOffset: (offset: BoardPosition) => void;
  setBoardSize: (widthIn: number, heightIn: number) => void;
  toggleDeploymentZones: () => void;
  updateDeploymentZone: (
    id: string,
    updates: Partial<BoardState["deploymentZones"][number]>
  ) => void;
  setBoardConfig: (config: {
    widthIn: number;
    heightIn: number;
    scale: number;
    position: BoardPosition;
    showGrid: boolean;
    backgroundImageUrl: string | null;
    backgroundFit: "contain" | "cover";
    backgroundScale: number;
    backgroundOffset: BoardPosition;
    showDeploymentZones: boolean;
    deploymentZones: BoardState["deploymentZones"];
  }) => void;
};

const buildDefaultDeploymentZones = (widthIn: number, heightIn: number) => {
  const depth = Math.min(12, widthIn / 2);
  return [
    {
      id: "A",
      label: "Player A",
      x: 0,
      y: 0,
      width: depth,
      height: heightIn,
      color: "#b83b3b",
    },
    {
      id: "B",
      label: "Player B",
      x: widthIn - depth,
      y: 0,
      width: depth,
      height: heightIn,
      color: "#3b7db8",
    },
  ];
};

export const useBoardStore = create<BoardState>((set) => ({
  widthIn: 60,
  heightIn: 44,
  scale: 1,
  position: { x: 0, y: 0 },
  showGrid: true,
  backgroundImageUrl: null,
  backgroundFit: "contain",
  backgroundScale: 1,
  backgroundOffset: { x: 0, y: 0 },
  showDeploymentZones: false,
  deploymentZones: buildDefaultDeploymentZones(60, 44),
  setView: (scale, position) => set({ scale, position }),
  setPosition: (position) => set({ position }),
  setScale: (scale) => set({ scale }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  setBackgroundImageUrl: (url) => set({ backgroundImageUrl: url }),
  setBackgroundFit: (fit) => set({ backgroundFit: fit }),
  setBackgroundScale: (scale) =>
    set({ backgroundScale: Math.max(0.25, scale) }),
  setBackgroundOffset: (offset) => set({ backgroundOffset: offset }),
  setBoardSize: (widthIn, heightIn) =>
    set((state) => {
      const nextWidth = Math.max(1, widthIn);
      const nextHeight = Math.max(1, heightIn);
      const deploymentZones = state.deploymentZones.map((zone) => {
        const width = Math.min(zone.width, nextWidth);
        const height = Math.min(zone.height, nextHeight);
        const x = Math.min(Math.max(0, zone.x), nextWidth - width);
        const y = Math.min(Math.max(0, zone.y), nextHeight - height);
        return { ...zone, x, y, width, height };
      });
      return { widthIn: nextWidth, heightIn: nextHeight, deploymentZones };
    }),
  toggleDeploymentZones: () =>
    set((state) => {
      const nextShow = !state.showDeploymentZones;
      if (nextShow && state.deploymentZones.length === 0) {
        return {
          showDeploymentZones: nextShow,
          deploymentZones: buildDefaultDeploymentZones(
            state.widthIn,
            state.heightIn
          ),
        };
      }
      return { showDeploymentZones: nextShow };
    }),
  updateDeploymentZone: (id, updates) =>
    set((state) => ({
      deploymentZones: state.deploymentZones.map((zone) =>
        zone.id === id ? { ...zone, ...updates } : zone
      ),
    })),
  setBoardConfig: (config) =>
    set({
      widthIn: config.widthIn,
      heightIn: config.heightIn,
      scale: config.scale,
      position: config.position,
      showGrid: config.showGrid,
      backgroundImageUrl: config.backgroundImageUrl,
      backgroundFit: config.backgroundFit,
      backgroundScale: config.backgroundScale,
      backgroundOffset: config.backgroundOffset,
      showDeploymentZones: config.showDeploymentZones,
      deploymentZones: config.deploymentZones,
    }),
}));
