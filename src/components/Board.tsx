import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  Group,
  Image as KonvaImage,
  Label,
  Layer,
  Line,
  Rect,
  Stage,
  Tag,
  Text,
} from "react-konva";
import Konva from "konva";
import { useBoardStore } from "../store/boardStore";
import { useUnitsStore } from "../store/unitsStore";
import { useMeasurementStore } from "../store/measurementStore";
import { useTerrainStore } from "../store/terrainStore";
import { useSelectionStore } from "../store/selectionStore";
import { useUiStore } from "../store/uiStore";

const PX_PER_INCH = 20;
const MIN_SCALE = 0.25;
const MAX_SCALE = 3;
const DOUBLE_TAP_DELAY_MS = 300;
const SNAP_DISTANCE_IN = 0.75;
const MEASURE_A_COLOR = "#7bd389";
const MEASURE_B_COLOR = "#f6c35c";

const getLabelFromStart = (
  start: { x: number; y: number },
  end: { x: number; y: number },
  startRadiusIn: number
) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) {
    return start;
  }
  const ux = dx / length;
  const uy = dy / length;
  const padding = 0.35;
  return {
    x: start.x - ux * (startRadiusIn + padding),
    y: start.y - uy * (startRadiusIn + padding),
  };
};

const buildWoundSummary = (wounds: number[]) => {
  const counts = new Map<number, number>();
  wounds.forEach((value) => {
    if (value <= 0) {
      return;
    }
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  const entries = Array.from(counts.entries()).sort((a, b) => b[0] - a[0]);
  if (entries.length === 0) {
    return "0 alive";
  }
  return entries.map(([value, count]) => `${count}@${value}`).join("; ");
};

const clampScale = (scale: number) =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));

const getTouchDistance = (touches: TouchList) => {
  const [first, second] = [touches[0], touches[1]];
  const dx = first.clientX - second.clientX;
  const dy = first.clientY - second.clientY;
  return Math.hypot(dx, dy);
};

const getTouchCenter = (touches: TouchList) => {
  const [first, second] = [touches[0], touches[1]];
  return {
    x: (first.clientX + second.clientX) / 2,
    y: (first.clientY + second.clientY) / 2,
  };
};

type DragState = {
  unitId: string;
  origin: { x: number; y: number };
  current: { x: number; y: number };
};

const Board = () => {
  const widthIn = useBoardStore((state) => state.widthIn);
  const heightIn = useBoardStore((state) => state.heightIn);
  const scale = useBoardStore((state) => state.scale);
  const position = useBoardStore((state) => state.position);
  const showGrid = useBoardStore((state) => state.showGrid);
  const backgroundImageUrl = useBoardStore(
    (state) => state.backgroundImageUrl
  );
  const setView = useBoardStore((state) => state.setView);
  const setPosition = useBoardStore((state) => state.setPosition);

  const units = useUnitsStore((state) => state.units);
  const setPlannedPosition = useUnitsStore((state) => state.setPlannedPosition);
  const terrains = useTerrainStore((state) => state.terrains);
  const setTerrainPosition = useTerrainStore(
    (state) => state.setTerrainPosition
  );
  const selection = useSelectionStore((state) => state.selection);
  const setSelection = useSelectionStore((state) => state.setSelection);
  const clearSelection = useSelectionStore((state) => state.clearSelection);
  const setUnitInspectorOpen = useUiStore(
    (state) => state.setUnitInspectorOpen
  );
  const measurements = useMeasurementStore((state) => state.measurements);
  const activeMeasurementId = useMeasurementStore(
    (state) => state.activeMeasurementId
  );
  const setActiveMeasurementId = useMeasurementStore(
    (state) => state.setActiveMeasurementId
  );
  const setPointA = useMeasurementStore((state) => state.setActivePointA);
  const setPointB = useMeasurementStore((state) => state.setActivePointB);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const lastTapRef = useRef(0);
  const lastCenterRef = useRef<{ x: number; y: number } | null>(null);
  const lastDistanceRef = useRef<number | null>(null);
  const initializedRef = useRef(false);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isPinching, setIsPinching] = useState(false);
  const [isHandleDragging, setIsHandleDragging] = useState(false);
  const [isObjectDragging, setIsObjectDragging] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [backgroundImage, setBackgroundImage] =
    useState<HTMLImageElement | null>(null);

  const boardWidthPx = widthIn * PX_PER_INCH;
  const boardHeightPx = heightIn * PX_PER_INCH;

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const { width, height } = entry.contentRect;
      setContainerSize({ width, height });
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    if (containerSize.width === 0 || containerSize.height === 0) {
      return;
    }

    const fitScale = Math.min(
      1,
      containerSize.width / boardWidthPx,
      containerSize.height / boardHeightPx
    );

    const nextScale = clampScale(fitScale);
    const nextPosition = {
      x: (containerSize.width - boardWidthPx * nextScale) / 2,
      y: (containerSize.height - boardHeightPx * nextScale) / 2,
    };

    setView(nextScale, nextPosition);
    initializedRef.current = true;
  }, [boardHeightPx, boardWidthPx, containerSize, setView]);

  useEffect(() => {
    if (!backgroundImageUrl) {
      setBackgroundImage(null);
      return;
    }
    const img = new Image();
    img.onload = () => setBackgroundImage(img);
    img.src = backgroundImageUrl;
  }, [backgroundImageUrl]);

  const zoomAt = (point: { x: number; y: number }, nextScale: number) => {
    const clamped = clampScale(nextScale);
    const worldPoint = {
      x: (point.x - position.x) / scale,
      y: (point.y - position.y) / scale,
    };

    const nextPosition = {
      x: point.x - worldPoint.x * clamped,
      y: point.y - worldPoint.y * clamped,
    };

    setView(clamped, nextPosition);
  };

  const handleDragMove = (event: Konva.KonvaEventObject<DragEvent>) => {
    const target = event.target;
    setPosition({ x: target.x(), y: target.y() });
  };

  const handleTouchStart = (event: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = event.evt.touches;
    if (!touches || touches.length === 0) {
      return;
    }

    if (touches.length === 2) {
      setIsPinching(true);
      stageRef.current?.draggable(false);
      lastCenterRef.current = getTouchCenter(touches);
      lastDistanceRef.current = getTouchDistance(touches);
      return;
    }

    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY_MS) {
      const pointer = stageRef.current?.getPointerPosition();
      if (pointer) {
        const nextScale = scale >= 1.8 ? 1 : scale * 1.5;
        zoomAt(pointer, nextScale);
      }
    }
    lastTapRef.current = now;
  };

  const handleTouchMove = (event: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = event.evt.touches;
    if (!touches || touches.length !== 2) {
      return;
    }

    event.evt.preventDefault();
    const center = getTouchCenter(touches);
    const distance = getTouchDistance(touches);

    if (!lastCenterRef.current || !lastDistanceRef.current) {
      lastCenterRef.current = center;
      lastDistanceRef.current = distance;
      return;
    }

    const scaleBy = distance / lastDistanceRef.current;
    const nextScale = clampScale(scale * scaleBy);

    const worldPoint = {
      x: (center.x - position.x) / scale,
      y: (center.y - position.y) / scale,
    };

    const nextPosition = {
      x: center.x - worldPoint.x * nextScale,
      y: center.y - worldPoint.y * nextScale,
    };

    setView(nextScale, nextPosition);
    lastCenterRef.current = center;
    lastDistanceRef.current = distance;
  };

  const handleTouchEnd = (event: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = event.evt.touches;
    if (touches && touches.length >= 2) {
      return;
    }

    setIsPinching(false);
    stageRef.current?.draggable(true);
    lastCenterRef.current = null;
    lastDistanceRef.current = null;
  };

  const handleDoubleClick = () => {
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) {
      return;
    }

    const nextScale = scale >= 1.8 ? 1 : scale * 1.5;
    zoomAt(pointer, nextScale);
  };

  const gridLines = useMemo(() => {
    if (!showGrid) {
      return null;
    }

    const lines: JSX.Element[] = [];
    const gridColor = "rgba(255, 255, 255, 0.08)";

    for (let x = 0; x <= widthIn; x += 1) {
      const posX = x * PX_PER_INCH;
      lines.push(
        <Line
          key={`grid-v-${x}`}
          points={[posX, 0, posX, boardHeightPx]}
          stroke={gridColor}
          strokeWidth={1}
        />
      );
    }

    for (let y = 0; y <= heightIn; y += 1) {
      const posY = y * PX_PER_INCH;
      lines.push(
        <Line
          key={`grid-h-${y}`}
          points={[0, posY, boardWidthPx, posY]}
          stroke={gridColor}
          strokeWidth={1}
        />
      );
    }

    return lines;
  }, [boardHeightPx, boardWidthPx, heightIn, showGrid, widthIn]);

  const findSnapUnit = (point: { x: number; y: number }) => {
    let closest:
      | { unit: (typeof units)[number]; distance: number; anchor: { x: number; y: number } }
      | null = null;
    units.forEach((unit) => {
      const radius = unit.iconDiameterInches / 2;
      const anchors = [
        { x: unit.x, y: unit.y },
        ...(unit.plannedX !== undefined && unit.plannedY !== undefined
          ? [{ x: unit.plannedX, y: unit.plannedY }]
          : []),
      ];
      anchors.forEach((anchor) => {
        const distance = Math.hypot(point.x - anchor.x, point.y - anchor.y);
        const threshold = radius + SNAP_DISTANCE_IN;
        if (distance <= threshold) {
          if (!closest || distance < closest.distance) {
            closest = { unit, distance, anchor };
          }
        }
      });
    });
    return closest;
  };

  const activeDragUnit = dragState
    ? units.find((unit) => unit.id === dragState.unitId) ?? null
    : null;

  const dragDistance = dragState
    ? Math.hypot(
        dragState.current.x - dragState.origin.x,
        dragState.current.y - dragState.origin.y
      )
    : 0;

  const activeMeasurement =
    measurements.find((measurement) => measurement.id === activeMeasurementId) ??
    null;

  const measurementDistance = (measurement: typeof activeMeasurement) => {
    if (!measurement) {
      return 0;
    }
    if (measurement.snappedUnitId) {
      const snappedUnit =
        units.find((unit) => unit.id === measurement.snappedUnitId) ?? null;
      if (!snappedUnit) {
        return Math.hypot(
          measurement.pointB.x - measurement.pointA.x,
          measurement.pointB.y - measurement.pointA.y
        );
      }
      const radius = snappedUnit.iconDiameterInches / 2;
      return Math.max(
        0,
        Math.hypot(
          measurement.pointB.x - measurement.pointA.x,
          measurement.pointB.y - measurement.pointA.y
        ) - radius
      );
    }
    return Math.hypot(
      measurement.pointB.x - measurement.pointA.x,
      measurement.pointB.y - measurement.pointA.y
    );
  };

  const measurementStart = (measurement: typeof activeMeasurement) => {
    if (!measurement) {
      return null;
    }
    if (!measurement.snappedUnitId) {
      return measurement.pointA;
    }
    const snappedUnit =
      units.find((unit) => unit.id === measurement.snappedUnitId) ?? null;
    if (!snappedUnit) {
      return measurement.pointA;
    }
    const dx = measurement.pointB.x - measurement.pointA.x;
    const dy = measurement.pointB.y - measurement.pointA.y;
    const length = Math.hypot(dx, dy);
    const radius = snappedUnit.iconDiameterInches / 2;
    if (length === 0) {
      return measurement.pointA;
    }
    return {
      x: measurement.pointA.x + (dx / length) * radius,
      y: measurement.pointA.y + (dy / length) * radius,
    };
  };

  const backgroundImageStyle = (() => {
    if (!backgroundImage) {
      return null;
    }
    const scale = Math.min(
      boardWidthPx / backgroundImage.width,
      boardHeightPx / backgroundImage.height
    );
    const width = backgroundImage.width * scale;
    const height = backgroundImage.height * scale;
    return {
      image: backgroundImage,
      x: (boardWidthPx - width) / 2,
      y: (boardHeightPx - height) / 2,
      width,
      height,
    };
  })();

  const activeDistanceLabel = dragState
    ? `${dragDistance.toFixed(1)}"`
    : activeMeasurement
      ? `${measurementDistance(activeMeasurement).toFixed(1)}"`
      : null;

  const movementLabelPosition = dragState
    ? getLabelFromStart(
        dragState.origin,
        dragState.current,
        (activeDragUnit?.iconDiameterInches ?? 0) / 2
      )
    : null;

  return (
    <div className="board-canvas" ref={containerRef}>
      {activeDistanceLabel && (
        <div className="board-distance">{activeDistanceLabel}</div>
      )}
      <Stage
        ref={stageRef}
        width={containerSize.width}
        height={containerSize.height}
        x={position.x}
        y={position.y}
        scaleX={scale}
        scaleY={scale}
        draggable={!isPinching && !isHandleDragging && !isObjectDragging}
        onDragMove={handleDragMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDblClick={handleDoubleClick}
      >
        <Layer>
          <Group>
            <Rect
              x={0}
              y={0}
              width={boardWidthPx}
              height={boardHeightPx}
              fill="#1f2d2f"
              stroke="#3b4a4b"
              strokeWidth={2}
              cornerRadius={8}
              onMouseDown={() => clearSelection()}
              onClick={() => clearSelection()}
              onTap={() => clearSelection()}
            />
            {backgroundImageStyle && (
              <KonvaImage
                image={backgroundImageStyle.image}
                x={backgroundImageStyle.x}
                y={backgroundImageStyle.y}
                width={backgroundImageStyle.width}
                height={backgroundImageStyle.height}
                listening={false}
              />
            )}
            {gridLines}
          </Group>
          {units.map((unit) => {
            const displayX =
              unit.plannedX !== undefined ? unit.plannedX : unit.x;
            const displayY =
              unit.plannedY !== undefined ? unit.plannedY : unit.y;
            return unit.ranges.map((range, index) => (
              <Circle
                key={`${unit.id}-range-${index}`}
                x={displayX * PX_PER_INCH}
                y={displayY * PX_PER_INCH}
                radius={(range + unit.iconDiameterInches / 2) * PX_PER_INCH}
                stroke="#4aa7a1"
                strokeWidth={2}
                dash={[10, 8]}
                listening={false}
              />
            ));
          })}
          {units
            .filter(
              (unit) =>
                unit.plannedX !== undefined && unit.plannedY !== undefined
            )
            .map((unit) => (
              <Circle
                key={`${unit.id}-origin`}
                x={unit.x * PX_PER_INCH}
                y={unit.y * PX_PER_INCH}
                radius={(unit.iconDiameterInches / 2) * PX_PER_INCH}
                stroke="#f6c35c"
                strokeWidth={2}
                dash={[6, 6]}
                listening={false}
              />
            ))}
          {terrains.map((terrain) => {
            const isSelected =
              selection?.type === "terrain" && selection.id === terrain.id;
            const stroke = isSelected ? "#f6c35c" : "#0f1618";
            const strokeWidth = isSelected ? 3 : 2;
            if (terrain.type === "circle") {
              return (
                <Group
                  key={terrain.id}
                  x={terrain.x * PX_PER_INCH}
                  y={terrain.y * PX_PER_INCH}
                  rotation={terrain.rotation}
                  draggable
                  onTap={(event) => {
                    event.cancelBubble = true;
                    setSelection({ type: "terrain", id: terrain.id });
                  }}
                  onClick={(event) => {
                    event.cancelBubble = true;
                    setSelection({ type: "terrain", id: terrain.id });
                  }}
                  onDragStart={(event) => {
                    event.cancelBubble = true;
                    setSelection({ type: "terrain", id: terrain.id });
                    setIsObjectDragging(true);
                  }}
                  onDragMove={(event) => {
                    event.cancelBubble = true;
                  }}
                  onDragEnd={(event) => {
                    event.cancelBubble = true;
                    const node = event.target;
                    setTerrainPosition(
                      terrain.id,
                      node.x() / PX_PER_INCH,
                      node.y() / PX_PER_INCH
                    );
                    setIsObjectDragging(false);
                  }}
                >
                  <Circle
                    radius={terrain.radiusInches * PX_PER_INCH}
                    fill={terrain.color}
                    opacity={0.35}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                  />
                  {terrain.label && (
                    <Text
                      text={terrain.label}
                      fill="#0f1618"
                      fontSize={14}
                      fontStyle="600"
                      align="center"
                      verticalAlign="middle"
                      width={terrain.radiusInches * PX_PER_INCH * 2}
                      height={terrain.radiusInches * PX_PER_INCH * 2}
                      offsetX={terrain.radiusInches * PX_PER_INCH}
                      offsetY={terrain.radiusInches * PX_PER_INCH}
                    />
                  )}
                </Group>
              );
            }

            return (
              <Group
                key={terrain.id}
                x={terrain.x * PX_PER_INCH}
                y={terrain.y * PX_PER_INCH}
                rotation={terrain.rotation}
                draggable
                onTap={(event) => {
                  event.cancelBubble = true;
                  setSelection({ type: "terrain", id: terrain.id });
                }}
                onClick={(event) => {
                  event.cancelBubble = true;
                  setSelection({ type: "terrain", id: terrain.id });
                }}
                onDragStart={(event) => {
                  event.cancelBubble = true;
                  setSelection({ type: "terrain", id: terrain.id });
                  setIsObjectDragging(true);
                }}
                onDragMove={(event) => {
                  event.cancelBubble = true;
                }}
                onDragEnd={(event) => {
                  event.cancelBubble = true;
                  const node = event.target;
                  setTerrainPosition(
                    terrain.id,
                    node.x() / PX_PER_INCH,
                    node.y() / PX_PER_INCH
                  );
                  setIsObjectDragging(false);
                }}
              >
                <Rect
                  width={terrain.widthInches * PX_PER_INCH}
                  height={terrain.heightInches * PX_PER_INCH}
                  fill={terrain.color}
                  opacity={0.35}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  offsetX={(terrain.widthInches * PX_PER_INCH) / 2}
                  offsetY={(terrain.heightInches * PX_PER_INCH) / 2}
                  cornerRadius={6}
                />
                {terrain.label && (
                  <Text
                    text={terrain.label}
                    fill="#0f1618"
                    fontSize={14}
                    fontStyle="600"
                    align="center"
                    verticalAlign="middle"
                    width={terrain.widthInches * PX_PER_INCH}
                    height={terrain.heightInches * PX_PER_INCH}
                    offsetX={(terrain.widthInches * PX_PER_INCH) / 2}
                    offsetY={(terrain.heightInches * PX_PER_INCH) / 2}
                  />
                )}
              </Group>
            );
          })}
          {measurements.map((measurement) => {
            const start = measurementStart(measurement);
            if (!start) {
              return null;
            }
            const isActive = measurement.id === activeMeasurementId;
            const snappedUnit =
              measurement.snappedUnitId &&
              units.find((unit) => unit.id === measurement.snappedUnitId);
            const labelPosition = {
              x: (start.x + measurement.pointB.x) / 2,
              y: (start.y + measurement.pointB.y) / 2,
            };
            const distance = measurementDistance(measurement);
            return (
              <Group key={measurement.id}>
                <Line
                  points={[
                    start.x * PX_PER_INCH,
                    start.y * PX_PER_INCH,
                    measurement.pointB.x * PX_PER_INCH,
                    measurement.pointB.y * PX_PER_INCH,
                  ]}
                  stroke={isActive ? "#8be0a0" : "#7bd389"}
                  strokeWidth={isActive ? 4 : 3}
                  hitStrokeWidth={14}
                  onClick={(event) => {
                    event.cancelBubble = true;
                    setActiveMeasurementId(measurement.id);
                  }}
                  onTap={(event) => {
                    event.cancelBubble = true;
                    setActiveMeasurementId(measurement.id);
                  }}
                />
                {snappedUnit && (
                  <Circle
                    x={measurement.pointA.x * PX_PER_INCH}
                    y={measurement.pointA.y * PX_PER_INCH}
                    radius={
                      (snappedUnit.iconDiameterInches / 2) * PX_PER_INCH + 4
                    }
                    stroke={MEASURE_A_COLOR}
                    strokeWidth={2}
                    dash={[6, 6]}
                    listening={false}
                  />
                )}
                <Group
                  x={start.x * PX_PER_INCH}
                  y={start.y * PX_PER_INCH}
                  draggable={isActive}
                  onClick={(event) => {
                    event.cancelBubble = true;
                    setActiveMeasurementId(measurement.id);
                  }}
                  onTap={(event) => {
                    event.cancelBubble = true;
                    setActiveMeasurementId(measurement.id);
                  }}
                  onDragStart={(event) => {
                    if (!isActive) {
                      return;
                    }
                    event.cancelBubble = true;
                    setIsHandleDragging(true);
                  }}
                  onDragMove={(event) => {
                    if (!isActive) {
                      return;
                    }
                    event.cancelBubble = true;
                    const node = event.target;
                    const next = {
                      x: node.x() / PX_PER_INCH,
                      y: node.y() / PX_PER_INCH,
                    };
                    const snap = findSnapUnit(next);
                    if (snap) {
                      setPointA({ x: snap.anchor.x, y: snap.anchor.y }, snap.unit.id);
                    } else {
                      setPointA(next, null);
                    }
                  }}
                  onDragEnd={(event) => {
                    if (!isActive) {
                      return;
                    }
                    event.cancelBubble = true;
                    const node = event.target;
                    const next = {
                      x: node.x() / PX_PER_INCH,
                      y: node.y() / PX_PER_INCH,
                    };
                    const snap = findSnapUnit(next);
                    if (snap) {
                      setPointA({ x: snap.anchor.x, y: snap.anchor.y }, snap.unit.id);
                    } else {
                      setPointA(next, null);
                    }
                    setIsHandleDragging(false);
                  }}
                >
                  <Circle
                    radius={10}
                    fill="#0f1618"
                    stroke={MEASURE_A_COLOR}
                    strokeWidth={3}
                    hitStrokeWidth={10}
                  />
                  <Text
                    text="A"
                    fill={MEASURE_A_COLOR}
                    fontSize={12}
                    fontStyle="700"
                    align="center"
                    verticalAlign="middle"
                    width={20}
                    height={20}
                    offsetX={10}
                    offsetY={10}
                  />
                </Group>
                <Label
                  x={labelPosition.x * PX_PER_INCH}
                  y={labelPosition.y * PX_PER_INCH}
                >
                  <Tag
                    fill="#0f1618"
                    cornerRadius={6}
                    stroke="#7bd389"
                    strokeWidth={1}
                  />
                  <Text
                    text={`${distance.toFixed(1)}"`}
                    fill="#7bd389"
                    fontSize={16}
                    padding={6}
                    fontStyle="bold"
                  />
                </Label>
                <Group
                  x={measurement.pointB.x * PX_PER_INCH}
                  y={measurement.pointB.y * PX_PER_INCH}
                  draggable={isActive}
                  onClick={(event) => {
                    event.cancelBubble = true;
                    setActiveMeasurementId(measurement.id);
                  }}
                  onTap={(event) => {
                    event.cancelBubble = true;
                    setActiveMeasurementId(measurement.id);
                  }}
                  onDragStart={(event) => {
                    if (!isActive) {
                      return;
                    }
                    event.cancelBubble = true;
                    setIsHandleDragging(true);
                  }}
                  onDragMove={(event) => {
                    if (!isActive) {
                      return;
                    }
                    event.cancelBubble = true;
                    const node = event.target;
                    setPointB({
                      x: node.x() / PX_PER_INCH,
                      y: node.y() / PX_PER_INCH,
                    });
                  }}
                  onDragEnd={(event) => {
                    if (!isActive) {
                      return;
                    }
                    event.cancelBubble = true;
                    const node = event.target;
                    setPointB({
                      x: node.x() / PX_PER_INCH,
                      y: node.y() / PX_PER_INCH,
                    });
                    setIsHandleDragging(false);
                  }}
                >
                  <Circle
                    radius={9}
                    fill={MEASURE_B_COLOR}
                    stroke="#0f1618"
                    strokeWidth={2}
                    hitStrokeWidth={10}
                  />
                  <Text
                    text="B"
                    fill="#0f1618"
                    fontSize={12}
                    fontStyle="700"
                    align="center"
                    verticalAlign="middle"
                    width={18}
                    height={18}
                    offsetX={9}
                    offsetY={9}
                  />
                </Group>
              </Group>
            );
          })}
          {(dragState || units.some((unit) => unit.plannedX !== undefined)) && (
            <Group>
              {dragState && (
                <>
                  <Line
                    points={[
                      dragState.origin.x * PX_PER_INCH,
                      dragState.origin.y * PX_PER_INCH,
                      dragState.current.x * PX_PER_INCH,
                      dragState.current.y * PX_PER_INCH,
                    ]}
                    stroke="#f6c35c"
                    strokeWidth={3}
                    dash={[10, 6]}
                  />
                  {movementLabelPosition && (
                    <Label
                      x={movementLabelPosition.x * PX_PER_INCH}
                      y={movementLabelPosition.y * PX_PER_INCH}
                    >
                      <Tag
                        fill="#0f1618"
                        cornerRadius={6}
                        stroke="#f6c35c"
                        strokeWidth={1}
                      />
                      <Text
                        text={`${dragDistance.toFixed(1)}"`}
                        fill="#f6c35c"
                        fontSize={16}
                        padding={6}
                        fontStyle="bold"
                      />
                    </Label>
                  )}
                </>
              )}
              {units
                .filter(
                  (unit) =>
                    unit.plannedX !== undefined && unit.plannedY !== undefined
                )
                .map((unit) => {
                  const plannedX = unit.plannedX ?? unit.x;
                  const plannedY = unit.plannedY ?? unit.y;
                  const labelPosition = getLabelFromStart(
                    { x: unit.x, y: unit.y },
                    { x: plannedX, y: plannedY },
                    unit.iconDiameterInches / 2
                  );
                  const distance = Math.hypot(
                    plannedX - unit.x,
                    plannedY - unit.y
                  );
                  return (
                    <Group key={`${unit.id}-planned-line`}>
                      <Line
                        points={[
                          unit.x * PX_PER_INCH,
                          unit.y * PX_PER_INCH,
                          plannedX * PX_PER_INCH,
                          plannedY * PX_PER_INCH,
                        ]}
                        stroke="#f6c35c"
                        strokeWidth={3}
                        dash={[10, 6]}
                      />
                      <Label
                        x={labelPosition.x * PX_PER_INCH}
                        y={labelPosition.y * PX_PER_INCH}
                      >
                        <Tag
                          fill="#0f1618"
                          cornerRadius={6}
                          stroke="#f6c35c"
                          strokeWidth={1}
                        />
                        <Text
                          text={`${distance.toFixed(1)}"`}
                          fill="#f6c35c"
                          fontSize={16}
                          padding={6}
                          fontStyle="bold"
                        />
                      </Label>
                    </Group>
                  );
                })}
            </Group>
          )}
          {units.map((unit) => {
            const radiusPx = (unit.iconDiameterInches / 2) * PX_PER_INCH;
            const displayX =
              unit.plannedX !== undefined ? unit.plannedX : unit.x;
            const displayY =
              unit.plannedY !== undefined ? unit.plannedY : unit.y;
            const woundSummary = buildWoundSummary(unit.currentModelWounds);
            return (
              <Group
                key={unit.id}
                x={displayX * PX_PER_INCH}
                y={displayY * PX_PER_INCH}
                draggable
                onTap={(event) => {
                  event.cancelBubble = true;
                  setSelection({ type: "unit", id: unit.id });
                }}
                onClick={(event) => {
                  event.cancelBubble = true;
                  setSelection({ type: "unit", id: unit.id });
                }}
                onDblClick={(event) => {
                  event.cancelBubble = true;
                  setSelection({ type: "unit", id: unit.id });
                  setUnitInspectorOpen(true);
                }}
                onDblTap={(event) => {
                  event.cancelBubble = true;
                  setSelection({ type: "unit", id: unit.id });
                  setUnitInspectorOpen(true);
                }}
                onDragStart={(event) => {
                  event.cancelBubble = true;
                  setSelection({ type: "unit", id: unit.id });
                  setIsObjectDragging(true);
                  setDragState({
                    unitId: unit.id,
                    origin: { x: unit.x, y: unit.y },
                    current: {
                      x: unit.plannedX !== undefined ? unit.plannedX : unit.x,
                      y: unit.plannedY !== undefined ? unit.plannedY : unit.y,
                    },
                  });
                }}
                onDragMove={(event) => {
                  event.cancelBubble = true;
                  const node = event.target;
                  const next = {
                    x: node.x() / PX_PER_INCH,
                    y: node.y() / PX_PER_INCH,
                  };
                  setDragState((state) =>
                    state && state.unitId === unit.id
                      ? { ...state, current: next }
                      : state
                  );
                  setPlannedPosition(unit.id, next.x, next.y);
                }}
                onDragEnd={(event) => {
                  event.cancelBubble = true;
                  setDragState(null);
                  setIsObjectDragging(false);
                }}
              >
                <Circle
                  radius={radiusPx}
                  fill={unit.color}
                  stroke={
                    selection?.type === "unit" && selection.id === unit.id
                      ? "#f6c35c"
                      : "#0f1618"
                  }
                  strokeWidth={
                    selection?.type === "unit" && selection.id === unit.id
                      ? 4
                      : 2
                  }
                  hitStrokeWidth={12}
                />
                <Text
                  text={unit.initials}
                  fill="#0f1618"
                  fontSize={Math.max(14, radiusPx * 0.6)}
                  fontStyle="700"
                  align="center"
                  verticalAlign="middle"
                  width={radiusPx * 2}
                  height={radiusPx * 2}
                  offsetX={radiusPx}
                  offsetY={radiusPx}
                />
                <Label x={-radiusPx} y={radiusPx + 8}>
                  <Tag
                    fill="rgba(15, 22, 24, 0.75)"
                    cornerRadius={6}
                  />
                  <Text
                    text={woundSummary}
                    fill="#f9f6f1"
                    fontSize={12}
                    padding={4}
                  />
                </Label>
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default Board;
