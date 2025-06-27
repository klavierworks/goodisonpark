import { Line } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { $allEntries, $entries, $focusedEntry } from "../../../../../store/data";
import useAtomState from "../../../useAtomState";
import { distributeElementsOnStadium, drawStadiumShape } from "../drawUtils";
import Tile from "../../../Tile/Tile";
import { useFrame } from "@react-three/fiber";
import { useSpring } from "@react-spring/core";

type RingProps = {
  color: string;
  isDebug: boolean;
  radius: number;
  tier: Tier;
  y: number;
}
const Ring = ({ color, isDebug, radius, tier, y }: RingProps) => {
  const [allEntries] = useAtomState($allEntries);

  const [line, points] = useMemo(() => {
    const line = drawStadiumShape(radius);

    const points = distributeElementsOnStadium(line, allEntries.filter(entry => entry.block), tier);
    return [
      line,
      points
    ]
  }, []);

  const handleClickTile = useCallback((tile: Entry) => {
    $focusedEntry.set(tile.id);
  }, []);

  return (
    <group position={[0, y, 0]}>
      <Line
        points={line.getPoints(100)}
        color={color}
        lineWidth={2}
        name={`space--line--${tier}`}
        userData={{
          line,
          tier,
          radius,
          y,
        }}
        visible={isDebug}
      />
      {points.map((tile) => (
        <Tile
          entry={tile}
          name={`space--${tile.id}`}
          key={tile.id}
          position={[tile.position[0], tile.position[1], tile.position[2]]}
          rotation={tile.rotation as [number, number, number]}
          scale={0.01}
          onClick={handleClickTile}
          userData={{
            point: tile.point,
            tier,
            line,
            tierY: y,
            position: tile.position,
          }}
        />
      ))}
    </group>
  );
}

export default Ring;