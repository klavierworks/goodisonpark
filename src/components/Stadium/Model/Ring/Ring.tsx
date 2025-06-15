import { Line } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import Tile from "./Tile/Tile";
import type { EllipseCurve } from "three";
import { $entries } from "../../../../store/data";

type RingProps = {
  isDebug: boolean;
  line: EllipseCurve;
  points: (Entry & {
    position: number[];
    rotation: number[];
  })[]
  y: number;
}
const Ring = ({ isDebug, line, points, y }: RingProps) => {
  const [entries, setEntries] = useState($entries.get());

  useEffect(() => {
    const unsubscribe = $entries.subscribe((newEntries) => {
      setEntries(newEntries as Entry[]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <group position={[0, 0, -y]}>
      <Line
        points={line.getPoints(100)}
        color="blue"
        lineWidth={2}
        visible={isDebug}
        />
      {points.map((tile) => (
        <Suspense key={tile.id} fallback={null}>
          <Tile
            data={tile}
            position={[tile.position[0], tile.position[1], tile.position[2]]}
            isVisible={entries.some(entry => entry.id === tile.id)}
            rotation={tile.rotation as [number, number, number]}
            scale={1}
            />
        </Suspense>
      ))}
    </group>
  );
}

export default Ring;