import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMasonryLayout } from "./utils";
import useAtomState from "../useAtomState";
import { $activeFilters, $allEntries, $entries } from "../../../store/data";
import Tile from "../Tile/Tile";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { clamp, mapLinear } from "three/src/math/MathUtils.js";
import { $currentView, $isTransitioning, $selectedEntry } from "../../../store/ui";
import { useDrag } from "@use-gesture/react"

const Grid = () => {
  const [entries] = useAtomState($entries);
  const [allEntries] = useAtomState($allEntries);

  const [hasTransitionedIn, setHasTransitionedIn] = useState(false);
  const [visibleEntries, setVisibleEntries] = useState<readonly Entry[]>([]);
  
  const gridRef = useRef<Group>(null);

  const [isTransitioning] = useAtomState($isTransitioning);
  useEffect(() => {
    if (!gridRef.current) {
      return;
    }
    if (!isTransitioning && $currentView.get() === 'space') {
      gridRef.current.position.set(0, 0, 0);
    }
  }, [isTransitioning]);


  useEffect(() => {
    const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const transitionToNewEntries = async (newEntries: readonly Entry[]) => {
      if (visibleEntries.length > 0) {
        setHasTransitionedIn(false);
        await pause(1000);
      }
      if (gridRef.current) {
        gridRef.current.position.set(0, 0, 0);
      }
      setVisibleEntries(newEntries);
      await pause(100);
      setHasTransitionedIn(true);
    }

    transitionToNewEntries(entries);
  }, [entries]);

  const layout = useMemo(() => visibleEntries.length > 0 ? getMasonryLayout(visibleEntries) : null, [visibleEntries]);

  const [isHovering, setIsHovering] = useState(false);

  const NO_HOVER_ZONE = 0.7;

  const isTouchDevice = useMemo(() => window.matchMedia('(pointer: coarse)').matches, []);

  const touchMovementRef = useRef<{x: number, y: number}>({
    x: 0,
    y: 0,
  });

  const bind = useDrag(({ movement: [x, y], down }) => {
    if (!down) {
      touchMovementRef.current = {x: 0, y: 0};
      return;
    }
    
    const normalizedX = (x / window.innerWidth) * 2;
    const normalizedY = -(y / window.innerHeight) * 2; 
    touchMovementRef.current = {
      x: normalizedX,
      y: normalizedY,
    }
  });

  useFrame(({mouse, invalidate, viewport, performance}) => {
    const DEAD_ZONE = isTouchDevice ? 0.05 : 0.2
    const EXPONENTIAL_POWER = isTouchDevice ? 1 : 2
    const SPEED_X = isTouchDevice ? 40 : 20;
    const SPEED_Y = isTouchDevice ? 40 : 20;
    const DIRECTION = isTouchDevice ? 1 : -1;

    const currentView = $currentView.get();
    if (currentView !== "grid") {
      return;
    }
    if (!gridRef.current) {
      return;
    }
    if (!isHovering || !layout) {
      return;
    }

    const { x, y } = isTouchDevice ? touchMovementRef.current : mouse;

    if (x === 0 && y === 0) {
      return;
    }

    let offsetX = 0;
    let offsetY = 0;

    if (x > DEAD_ZONE) {
      const normalizedDistance = mapLinear(x, DEAD_ZONE, 1, 0, 1);
      const exponentialDistance = Math.pow(normalizedDistance, EXPONENTIAL_POWER);
      offsetX = exponentialDistance * SPEED_X;
    }
    if (x < -DEAD_ZONE) {
      const normalizedDistance = mapLinear(x, -DEAD_ZONE, -1, 0, 1);
      const exponentialDistance = Math.pow(normalizedDistance, EXPONENTIAL_POWER);
      offsetX = -exponentialDistance * SPEED_X;
    }

    if (y > DEAD_ZONE) {
      const normalizedDistance = mapLinear(y, DEAD_ZONE, 1, 0, 1);
      const exponentialDistance = Math.pow(normalizedDistance, EXPONENTIAL_POWER);
      offsetY = exponentialDistance * SPEED_Y;
    }
    if (y < -DEAD_ZONE) {
      const normalizedDistance = mapLinear(y, -DEAD_ZONE, -1, 0, 1);
      const exponentialDistance = Math.pow(normalizedDistance, EXPONENTIAL_POWER);
      offsetY = -exponentialDistance * SPEED_Y;
    }

    if (Math.abs(x) > NO_HOVER_ZONE || Math.abs(y) > NO_HOVER_ZONE) {
      performance.regress()
    }

    if (layout.containerWidth < viewport.width) {
      offsetX = 0;
    }
    if (layout.containerHeight < viewport.height) {
      offsetY = 0;
    }

    const xPos = clamp(
      gridRef.current.position.x + (offsetX * DIRECTION),
      (-layout.containerWidth / 2),
      (layout.containerWidth / 2),
    )

    const yPos = clamp(
      gridRef.current.position.y + (offsetY * DIRECTION),
      -layout.containerHeight / 2,
      layout.containerHeight / 2
    )

    gridRef.current.position.set(
      xPos,
      yPos,
      gridRef.current.position.z
    );
    invalidate();
  });

  const handleClickEntry = useCallback((entry: Entry) => {
    const newFilters = {
      ...$activeFilters.get(),
      'memory': entry.memory,
    };

    $activeFilters.set(newFilters);
    $selectedEntry.set(entry.id);
    $currentView.set('space')
  }, []);

  return (
    <group ref={gridRef} {...bind()} onPointerEnter={() => setIsHovering(true)} onPointerLeave={() => setIsHovering(false)}>
      {layout && (
        <mesh position={[0, 0, -900]} name="click-catcher" scale={[layout.containerWidth, layout.containerHeight, 1]} visible={false}>
          <planeGeometry args={[layout.containerWidth, layout.containerHeight]} />
          <meshBasicMaterial color="red" />
        </mesh>
      )}
      {layout && visibleEntries.map((entry, index) => (
        <Tile
          key={entry.id}
          entry={entry}
          isActive={hasTransitionedIn}
          position={[
            layout.positions[index].x,
            layout.positions[index].y,
            layout.positions[index].z
          ]}
          onClick={handleClickEntry}
        />
      ))}
      <group position={[0, 0, -1500]}>
        <mesh position={[0, 0, 350]}>
          <planeGeometry args={[15000,15000]} />
          <meshBasicMaterial color="rgb(5, 7, 23)" transparent opacity={0.8} />
        </mesh>
      </group>
    </group>
  );
}

export default Grid;