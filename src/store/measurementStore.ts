import { create } from "zustand";

export type MeasurementPoint = {
  x: number;
  y: number;
};

type MeasurementState = {
  isActive: boolean;
  pointA: MeasurementPoint | null;
  pointB: MeasurementPoint | null;
  snappedUnitId: string | null;
  startMeasurement: (pointA: MeasurementPoint, pointB: MeasurementPoint) => void;
  stopMeasurement: () => void;
  setPointA: (pointA: MeasurementPoint, snappedUnitId: string | null) => void;
  setPointB: (pointB: MeasurementPoint) => void;
};

export const useMeasurementStore = create<MeasurementState>((set) => ({
  isActive: false,
  pointA: null,
  pointB: null,
  snappedUnitId: null,
  startMeasurement: (pointA, pointB) =>
    set({ isActive: true, pointA, pointB, snappedUnitId: null }),
  stopMeasurement: () =>
    set({ isActive: false, pointA: null, pointB: null, snappedUnitId: null }),
  setPointA: (pointA, snappedUnitId) => set({ pointA, snappedUnitId }),
  setPointB: (pointB) => set({ pointB }),
}));
