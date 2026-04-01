import { create } from "zustand";

export type TerrainBase = {
  id: string;
  x: number;
  y: number;
  rotation: number;
  label?: string;
  color: string;
};

export type TerrainRect = TerrainBase & {
  type: "rect";
  widthInches: number;
  heightInches: number;
};

export type TerrainCircle = TerrainBase & {
  type: "circle";
  radiusInches: number;
};

export type Terrain = TerrainRect | TerrainCircle;

type TerrainDraft = Partial<Terrain> & { type: Terrain["type"] };

type TerrainState = {
  terrains: Terrain[];
  addTerrain: (draft: TerrainDraft) => void;
  duplicateTerrain: (terrainId: string) => void;
  deleteTerrain: (terrainId: string) => void;
  setTerrainPosition: (terrainId: string, x: number, y: number) => void;
  updateTerrain: (terrainId: string, updates: Partial<Terrain>) => void;
  setTerrains: (terrains: Terrain[]) => void;
};

const createDefaultTerrain = (draft: TerrainDraft): Terrain => {
  const base: TerrainBase = {
    id: crypto.randomUUID(),
    x: draft.x ?? 12,
    y: draft.y ?? 12,
    rotation: draft.rotation ?? 0,
    label: draft.label,
    color: draft.color ?? "#3f6b73",
  };

  if (draft.type === "circle") {
    return {
      ...base,
      type: "circle",
      radiusInches:
        typeof draft.radiusInches === "number" ? draft.radiusInches : 3,
    };
  }

  return {
    ...base,
    type: "rect",
    widthInches:
      typeof draft.widthInches === "number" ? draft.widthInches : 6,
    heightInches:
      typeof draft.heightInches === "number" ? draft.heightInches : 4,
  };
};

export const useTerrainStore = create<TerrainState>((set) => ({
  terrains: [],
  addTerrain: (draft) =>
    set((state) => {
      const terrain = createDefaultTerrain(draft);
      return {
        terrains: [...state.terrains, terrain],
      };
    }),
  duplicateTerrain: (terrainId) =>
    set((state) => {
      const source = state.terrains.find((terrain) => terrain.id === terrainId);
      if (!source) {
        return state;
      }
      const terrain: Terrain = {
        ...source,
        id: crypto.randomUUID(),
        x: source.x + 1,
        y: source.y + 1,
        label: source.label ? `${source.label} Copy` : source.label,
      };
      return {
        terrains: [...state.terrains, terrain],
      };
    }),
  deleteTerrain: (terrainId) =>
    set((state) => {
      const terrains = state.terrains.filter(
        (terrain) => terrain.id !== terrainId
      );
      return { terrains };
    }),
  setTerrainPosition: (terrainId, x, y) =>
    set((state) => ({
      terrains: state.terrains.map((terrain) =>
        terrain.id === terrainId ? { ...terrain, x, y } : terrain
      ),
    })),
  updateTerrain: (terrainId, updates) =>
    set((state) => ({
      terrains: state.terrains.map((terrain) =>
        terrain.id === terrainId ? { ...terrain, ...updates } : terrain
      ),
    })),
  setTerrains: (terrains) => set({ terrains }),
}));
