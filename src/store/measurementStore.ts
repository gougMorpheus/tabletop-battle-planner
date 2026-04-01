import { create } from "zustand";

export type MeasurementPoint = {
  x: number;
  y: number;
};

export type Measurement = {
  id: string;
  pointA: MeasurementPoint;
  pointB: MeasurementPoint;
  snappedUnitId: string | null;
};

type MeasurementState = {
  measurements: Measurement[];
  activeMeasurementId: string | null;
  startMeasurement: (pointA: MeasurementPoint, pointB: MeasurementPoint) => void;
  stopActiveMeasurement: () => void;
  setActiveMeasurementId: (measurementId: string | null) => void;
  setActivePointA: (pointA: MeasurementPoint, snappedUnitId: string | null) => void;
  setActivePointB: (pointB: MeasurementPoint) => void;
  setMeasurements: (measurements: Measurement[]) => void;
  removeMeasurement: (measurementId: string) => void;
  clearMeasurements: () => void;
};

export const useMeasurementStore = create<MeasurementState>((set) => ({
  measurements: [],
  activeMeasurementId: null,
  startMeasurement: (pointA, pointB) =>
    set((state) => {
      const measurement = {
        id: crypto.randomUUID(),
        pointA,
        pointB,
        snappedUnitId: null,
      };
      return {
        measurements: [...state.measurements, measurement],
        activeMeasurementId: measurement.id,
      };
    }),
  stopActiveMeasurement: () => set({ activeMeasurementId: null }),
  setActiveMeasurementId: (measurementId) =>
    set({ activeMeasurementId: measurementId }),
  setActivePointA: (pointA, snappedUnitId) =>
    set((state) => {
      if (!state.activeMeasurementId) {
        return state;
      }
      return {
        measurements: state.measurements.map((measurement) =>
          measurement.id === state.activeMeasurementId
            ? { ...measurement, pointA, snappedUnitId }
            : measurement
        ),
      };
    }),
  setActivePointB: (pointB) =>
    set((state) => {
      if (!state.activeMeasurementId) {
        return state;
      }
      return {
        measurements: state.measurements.map((measurement) =>
          measurement.id === state.activeMeasurementId
            ? { ...measurement, pointB }
            : measurement
        ),
      };
    }),
  setMeasurements: (measurements) =>
    set({ measurements, activeMeasurementId: null }),
  removeMeasurement: (measurementId) =>
    set((state) => ({
      measurements: state.measurements.filter(
        (measurement) => measurement.id !== measurementId
      ),
      activeMeasurementId:
        state.activeMeasurementId === measurementId
          ? null
          : state.activeMeasurementId,
    })),
  clearMeasurements: () => set({ measurements: [], activeMeasurementId: null }),
}));
