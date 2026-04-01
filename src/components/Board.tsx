import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  Group,
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

const PX_PER_INCH = 20;
const MIN_SCALE = 0.25;
const MAX_SCALE = 3;
const DOUBLE_TAP_DELAY_MS = 300;
const SNAP_DISTANCE_IN = 0.75;

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
  const setView = useBoardStore((state) => state.setView);
  const setPosition = useBoardStore((state) => state.setPosition);

  const units = useUnitsStore((state) => state.units);
  const selectedUnitId = useUnitsStore((state) => state.selectedUnitId);
  const setSelectedUnitId = useUnitsStore((state) => state.setSelectedUnitId);
  const setUnitPosition = useUnitsStore((state) => state.setUnitPosition);
  const measurementActive = useMeasurementStore((state) => state.isActive);
  const pointA = useMeasurementStore((state) => state.pointA);
  const pointB = useMeasurementStore((state) => state.pointB);
  const snappedUnitId = useMeasurementStore((state) => state.snappedUnitId);
  const setPointA = useMeasurementStore((state) => state.setPointA);
  const setPointB = useMeasurementStore((state) => state.setPointB);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const lastTapRef = useRef(0);
  const lastCenterRef = useRef<{ x: number; y: number } | null>(null);
  const lastDistanceRef = useRef<number | null>(null);
  const initializedRef = useRef(false);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isPinching, setIsPinching] = useState(false);
  const [isHandleDragging, setIsHandleDragging] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);

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
    let closest: { unit: (typeof units)[number]; distance: number } | null =
      null;
    units.forEach((unit) => {
      const radius = unit.iconDiameterInches / 2;
      const distance = Math.hypot(point.x - unit.x, point.y - unit.y);
      const threshold = radius + SNAP_DISTANCE_IN;
      if (distance <= threshold) {
        if (!closest || distance < closest.distance) {
          closest = { unit, distance };
        }
      }
    });
    return closest?.unit ?? null;
  };

  const dragDistance = dragState
    ? Math.hypot(
        dragState.current.x - dragState.origin.x,
        dragState.current.y - dragState.origin.y
      )
    : 0;

  const snappedUnit = snappedUnitId
    ? units.find((unit) => unit.id === snappedUnitId) ?? null
    : null;

  const measurementStart = (() => {
    if (!measurementActive || !pointA || !pointB) {
      return null;
    }
    if (!snappedUnit) {
      return pointA;
    }
    const dx = pointB.x - snappedUnit.x;
    const dy = pointB.y - snappedUnit.y;
    const length = Math.hypot(dx, dy);
    const radius = snappedUnit.iconDiameterInches / 2;
    if (length === 0) {
      return { x: snappedUnit.x, y: snappedUnit.y };
    }
    return {
      x: snappedUnit.x + (dx / length) * radius,
      y: snappedUnit.y + (dy / length) * radius,
    };
  })();

  const measurementDistance = (() => {
    if (!measurementActive || !pointA || !pointB) {
      return 0;
    }
    if (snappedUnit) {
      const radius = snappedUnit.iconDiameterInches / 2;
      return Math.max(
        0,
        Math.hypot(pointB.x - snappedUnit.x, pointB.y - snappedUnit.y) - radius
      );
    }
    return Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
  })();

  return (
    <div className="board-canvas" ref={containerRef}>
      <Stage
        ref={stageRef}
        width={containerSize.width}
        height={containerSize.height}
        x={position.x}
        y={position.y}
        scaleX={scale}
        scaleY={scale}
        draggable={!isPinching && !isHandleDragging}
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
            />
            {gridLines}
          </Group>
          {units.map((unit) =>
            unit.ranges.map((range, index) => (
              <Circle
                key={`${unit.id}-range-${index}`}
                x={unit.x * PX_PER_INCH}
                y={unit.y * PX_PER_INCH}
                radius={range * PX_PER_INCH}
                stroke="#4aa7a1"
                strokeWidth={2}
                dash={[10, 8]}
                listening={false}
              />
            ))
          )}
          {measurementActive && pointA && pointB && measurementStart && (
            <Group>
              <Line
                points={[
                  measurementStart.x * PX_PER_INCH,
                  measurementStart.y * PX_PER_INCH,
                  pointB.x * PX_PER_INCH,
                  pointB.y * PX_PER_INCH,
                ]}
                stroke="#7bd389"
                strokeWidth={3}
              />
              <Circle
                x={pointA.x * PX_PER_INCH}
                y={pointA.y * PX_PER_INCH}
                radius={6}
                fill="#7bd389"
                stroke="#0f1618"
                strokeWidth={2}
                draggable
                onDragStart={(event) => {
                  event.cancelBubble = true;
                  setIsHandleDragging(true);
                }}
                onDragMove={(event) => {
                  event.cancelBubble = true;
                  const node = event.target;
                  const next = {
                    x: node.x() / PX_PER_INCH,
                    y: node.y() / PX_PER_INCH,
                  };
                  const snap = findSnapUnit(next);
                  if (snap) {
                    setPointA({ x: snap.x, y: snap.y }, snap.id);
                  } else {
                    setPointA(next, null);
                  }
                }}
                onDragEnd={(event) => {
                  event.cancelBubble = true;
                  const node = event.target;
                  const next = {
                    x: node.x() / PX_PER_INCH,
                    y: node.y() / PX_PER_INCH,
                  };
                  const snap = findSnapUnit(next);
                  if (snap) {
                    setPointA({ x: snap.x, y: snap.y }, snap.id);
                  } else {
                    setPointA(next, null);
                  }
                  setIsHandleDragging(false);
                }}
              />
              <Label
                x={((measurementStart.x + pointB.x) / 2) * PX_PER_INCH}
                y={((measurementStart.y + pointB.y) / 2) * PX_PER_INCH}
              >
                <Tag
                  fill="#0f1618"
                  cornerRadius={6}
                  stroke="#7bd389"
                  strokeWidth={1}
                />
                <Text
                  text={`${measurementDistance.toFixed(1)}"`}
                  fill="#7bd389"
                  fontSize={16}
                  padding={6}
                  fontStyle="bold"
                />
              </Label>
              <Circle
                x={pointB.x * PX_PER_INCH}
                y={pointB.y * PX_PER_INCH}
                radius={6}
                fill="#7bd389"
                stroke="#0f1618"
                strokeWidth={2}
                draggable
                onDragStart={(event) => {
                  event.cancelBubble = true;
                  setIsHandleDragging(true);
                }}
                onDragMove={(event) => {
                  event.cancelBubble = true;
                  const node = event.target;
                  setPointB({
                    x: node.x() / PX_PER_INCH,
                    y: node.y() / PX_PER_INCH,
                  });
                }}
                onDragEnd={(event) => {
                  event.cancelBubble = true;
                  const node = event.target;
                  setPointB({
                    x: node.x() / PX_PER_INCH,
                    y: node.y() / PX_PER_INCH,
                  });
                  setIsHandleDragging(false);
                }}
              />
            </Group>
          )}
          {dragState && (
            <Group>
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
              <Label
                x={
                  ((dragState.origin.x + dragState.current.x) / 2) *
                  PX_PER_INCH
                }
                y={
                  ((dragState.origin.y + dragState.current.y) / 2) *
                  PX_PER_INCH
                }
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
            </Group>
          )}
          {units.map((unit) => {
            const radiusPx = (unit.iconDiameterInches / 2) * PX_PER_INCH;
            return (
              <Group
                key={unit.id}
                x={unit.x * PX_PER_INCH}
                y={unit.y * PX_PER_INCH}
                draggable
                onTap={(event) => {
                  event.cancelBubble = true;
                  setSelectedUnitId(unit.id);
                }}
                onDragStart={(event) => {
                  event.cancelBubble = true;
                  setSelectedUnitId(unit.id);
                  setDragState({
                    unitId: unit.id,
                    origin: { x: unit.x, y: unit.y },
                    current: { x: unit.x, y: unit.y },
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
                }}
                onDragEnd={(event) => {
                  event.cancelBubble = true;
                  const node = event.target;
                  const nextX = node.x() / PX_PER_INCH;
                  const nextY = node.y() / PX_PER_INCH;
                  setUnitPosition(unit.id, nextX, nextY);
                  setDragState(null);
                }}
              >
                <Circle
                  radius={radiusPx}
                  fill={unit.color}
                  stroke={unit.id === selectedUnitId ? "#f6c35c" : "#0f1618"}
                  strokeWidth={unit.id === selectedUnitId ? 4 : 2}
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
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default Board;
