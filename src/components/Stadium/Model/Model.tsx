import { useEffect, useMemo, useRef, useState } from "react";
import { $entries } from "../../../store/data";
import Tile from "./Tile/Tile";
import { SPHERE_SCALE, STADIUM_SCALE, TILE_DEPTH, TILE_HEIGHT } from "../constants";
import { Bounds, useBounds } from "@react-three/drei";
import { Mesh, Sphere } from "three";
import { useFrame } from "@react-three/fiber";

type ModelProps = {
  entries: Entry[]
}

const Model = ({ entries }: ModelProps) => {
  const meshRef = useRef<Mesh>(null);

  const layout = useMemo(() => entries.map((data, index) => {
    const ITEM_COUNT = entries.length;
    // Calculate angle in radians based on index and total count
    const angle = (index / ITEM_COUNT) * Math.PI * 2;
    
    // Calculate x and z coordinates for a circle around the origin
    const x = Math.cos(angle) * (SPHERE_SCALE / 2);
    let z = Math.sin(angle) * (SPHERE_SCALE / 2);
    
    let y = 0;

    if (index % 3 === 0) {
      y = TILE_HEIGHT;
    }
    if (index % 2 === 0) {
      y = -TILE_HEIGHT;
    }

    z += Math.random() * TILE_DEPTH;

    const rotation = Math.PI / 2 - angle;
    return {
      id: data.id,
      data,
      x,
      y,
      z,
      rotation,
    }
  }), [entries]);

  const dedupedLayout = useMemo(() => {
    return layout.filter((tile, index) => {
      return index === layout.findIndex(t => t.id === tile.id);
    });
  }, [layout]);

  return (
    <group>
      <mesh position={[0, -2, 0]} ref={meshRef}>
        <boxGeometry args={[STADIUM_SCALE, 1, STADIUM_SCALE]} />
        <meshBasicMaterial color="lightgray" />
      </mesh>
      {dedupedLayout.map(
        (tile) => (
        <Tile
          key={tile.id}
          data={tile.data}
          position={[tile.x, tile.y, tile.z]}
          rotation={[0, tile.rotation, 0]}
        />)
      )}
    </group>
  )
}

export default Model;