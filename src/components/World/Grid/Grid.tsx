import { useEffect, useMemo, useRef, useState } from "react";
import { getMasonryLayout } from "./utils";
import useAtomState from "../useAtomState";
import { $entries } from "../../../store/data";
import Tile from "./Tile/Tile";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, Mesh, Sprite } from "three";
import { SpringValue } from "@react-spring/core";
import { clamp, mapLinear } from "three/src/math/MathUtils.js";

const Grid = () => {
  const [entries] = useAtomState($entries);

  const [visibleEntries, setVisibleEntries] = useState<readonly Entry[]>([]);
  
  const scene = useThree(state => state.scene);
  const gridRef = useRef<Group>(null);
  const isTransitioning = useRef(false);

  const hasMountedRef = useRef(false);

  useEffect(() => {
    const spring = new SpringValue(hasMountedRef.current ? 1 : 0);
  
    const setOpacity = async (opacity: number) => {
      console.log("Setting opacity to", opacity);
      await spring.start({
        to: opacity,
        config: { duration: 1000 },
        onChange: (change) => {
          const value = change as unknown as number;

          scene.traverse((child) => {
            if (child instanceof Sprite && child.material) {
              child.material.opacity = value;
            }
          });
        }
      })
      scene.traverse((child) => {
        if (child instanceof Mesh && child.material) {
          child.material.opacity = opacity;
        }
      });
    }

    const transitionToNewEntries = async (newEntries: readonly Entry[]) => {
      if (hasMountedRef.current) {
        await setOpacity(0);
      }
      isTransitioning.current = true;
      setVisibleEntries(newEntries);
      if (gridRef.current) {
        gridRef.current.position.set(0, 0, 0);
      }
      isTransitioning.current = false;
      await setOpacity(1);
      hasMountedRef.current = true;
    }

    transitionToNewEntries(entries);
  }, [entries]);

  const layout = useMemo(() => visibleEntries.length > 0 ? getMasonryLayout(visibleEntries) : null, [visibleEntries]);

  const [isHovering, setIsHovering] = useState(false);
  useFrame(({mouse, viewport}) => {
    if (!gridRef.current) {
      return;
    }

    if (isTransitioning.current || !isHovering || !layout) {
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
    if (y < 0.4) {
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

  return (
    <group ref={gridRef} onPointerEnter={() => setIsHovering(true)} onPointerLeave={() => setIsHovering(false)}>
      {layout && (
        <mesh position={[0, 0, 0]} name="click-catcher" scale={[layout.containerWidth, layout.containerHeight, 1]} visible={false}>
          <planeGeometry args={[layout.containerWidth, layout.containerHeight]} />
          <meshBasicMaterial color="red" />
        </mesh>
      )}
      {layout && visibleEntries.map((entry, index) => (
        <Tile key={entry.id} entry={entry} position={[
          layout.positions[index].x,
          layout.positions[index].y ,
          layout.positions[index].z
        ]} />
      ))}
    </group>
  );
}

export default Grid;