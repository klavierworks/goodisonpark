import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMasonryLayout } from "./utils";
import useAtomState from "../useAtomState";
import { $activeFilters, $entries } from "../../../store/data";
import Tile from "../Tile/Tile";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { clamp, mapLinear } from "three/src/math/MathUtils.js";
import { $currentView, $isTransitioning, $selectedEntry } from "../../../store/ui";

const Grid = () => {
  const [entries] = useAtomState($entries);

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
      console.log('transitioned to new entries', newEntries.length);
      await pause(100);
      setHasTransitionedIn(true);
    }

    transitionToNewEntries(entries);
  }, [entries]);

  const layout = useMemo(() => visibleEntries.length > 0 ? getMasonryLayout(visibleEntries) : null, [visibleEntries]);

  const [isHovering, setIsHovering] = useState(false);
  useFrame(({mouse, viewport}) => {
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

    const SPEED_X = 10;
    const SPEED_Y = 10;

    const { x, y } = mouse;

    let offsetX = 0;
    let offsetY = 0;
  
    if (x > 0.4) {
      offsetX = mapLinear(x, 0.4, 1, 0, 1) * SPEED_X;
    }
    if (x < -0.4) {
      offsetX = mapLinear(x, -0.4, -1, -0, -1) * SPEED_X;
    }

    if (y > 0.4) {
      offsetY = mapLinear(y, 0.4, 1, 0, 1) * SPEED_Y;
    }
    if (y < -0.4) {
      offsetY = mapLinear(y, -0.4, -1, -0, -1) * SPEED_Y;
    }

    if (layout.containerWidth < viewport.width) {
      offsetX = 0;
    }
    if (layout.containerHeight < viewport.height) {
      offsetY = 0;
    }

    const xPos = clamp(
      gridRef.current.position.x + (offsetX * -1),
      -layout.containerWidth / 2,
      layout.containerWidth / 2,
    )

    const yPos = clamp(
      gridRef.current.position.y + (offsetY * -1),
      -layout.containerHeight / 2,
      layout.containerHeight / 2
    )

    gridRef.current.position.set(
      xPos,
      yPos,
      gridRef.current.position.z
    );
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
    <group ref={gridRef} onPointerEnter={() => setIsHovering(true)} onPointerLeave={() => setIsHovering(false)}>
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
            layout.positions[index].y ,
            layout.positions[index].z
          ]}
          onClick={handleClickEntry}
        />
      ))}
    </group>
  );
}

export default Grid;