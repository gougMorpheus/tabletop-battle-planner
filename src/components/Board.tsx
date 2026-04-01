import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Group, Layer, Line, Rect, Stage } from "react-konva";
import Konva from "konva";
import { useBoardStore } from "../store/boardStore";

const PX_PER_INCH = 20;
const MIN_SCALE = 0.25;
const MAX_SCALE = 3;
const DOUBLE_TAP_DELAY_MS = 300;

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

const Board = () => {
  const widthIn = useBoardStore((state) => state.widthIn);
  const heightIn = useBoardStore((state) => state.heightIn);
  const scale = useBoardStore((state) => state.scale);
  const position = useBoardStore((state) => state.position);
  const showGrid = useBoardStore((state) => state.showGrid);
  const setView = useBoardStore((state) => state.setView);
  const setPosition = useBoardStore((state) => state.setPosition);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const lastTapRef = useRef(0);
  const lastCenterRef = useRef<{ x: number; y: number } | null>(null);
  const lastDistanceRef = useRef<number | null>(null);
  const initializedRef = useRef(false);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isPinching, setIsPinching] = useState(false);

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
        draggable={!isPinching}
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
        </Layer>
      </Stage>
    </div>
  );
};

export default Board;
