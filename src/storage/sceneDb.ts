import { Measurement } from "../store/measurementStore";
import { Terrain } from "../store/terrainStore";
import { Phase } from "../store/gameTrackerStore";
import { Unit } from "../store/unitsStore";

export type SceneData = {
  board: {
    widthIn: number;
    heightIn: number;
    scale: number;
    position: { x: number; y: number };
    showGrid: boolean;
    backgroundImageUrl: string | null;
  };
  units: Unit[];
  terrain: Terrain[];
  measurements: Measurement[];
  gameTracker: {
    playerA: { vp: number; cp: number };
    playerB: { vp: number; cp: number };
    battleRound: number;
    activePlayer: "A" | "B";
    phase: Phase;
  };
};

export type SceneRecord = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  data: SceneData;
};

const DB_NAME = "tabletop-battle-planner";
const DB_VERSION = 1;
const STORE_NAME = "scenes";

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });

const withStore = async <T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = fn(store);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const listScenes = async (): Promise<SceneRecord[]> => {
  const results = await withStore("readonly", (store) => store.getAll());
  return results.sort((a, b) => b.updatedAt - a.updatedAt);
};

export const getScene = async (id: string): Promise<SceneRecord | undefined> =>
  withStore("readonly", (store) => store.get(id));

export const saveScene = async (name: string, data: SceneData) => {
  const now = Date.now();
  const record: SceneRecord = {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    data,
  };
  await withStore("readwrite", (store) => store.put(record));
  return record;
};

export const updateSceneName = async (id: string, name: string) => {
  const existing = await getScene(id);
  if (!existing) {
    return;
  }
  const updated: SceneRecord = {
    ...existing,
    name,
    updatedAt: Date.now(),
  };
  await withStore("readwrite", (store) => store.put(updated));
};

export const deleteScene = async (id: string) => {
  await withStore("readwrite", (store) => store.delete(id));
};
