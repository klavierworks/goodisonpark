import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Tile from "./Tile/Tile";
import { SPHERE_SCALE, STADIUM_SCALE, STADIUM_Y_POSITION, TILE_DEPTH, TILE_HEIGHT } from "../constants";
import { Mesh } from "three";
import StadiumModel from "./StadiumModel.tsx";
import { getEntriesPlacements } from "./utils";

type ModelProps = {
  entries: Entry[]
}

const Model = ({ entries }: ModelProps) => {
  const meshRef = useRef<Mesh>(null);

  const layout = useMemo(() => {
    const left = getEntriesPlacements(
      entries.filter(entry => entry.block && ['TB', 'MS', 'FE'].includes(entry.block.slice(0, 2))),
      'left'
    );
    const right = getEntriesPlacements(
      entries.filter(entry => entry.block && ['UB', 'UV', 'LV', 'PK', 'LB'].includes(entry.block.slice(0, 2))),
      'right'
    );
    const front = getEntriesPlacements(
      entries.filter(entry => entry.block && ['GT', 'GS'].includes(entry.block.slice(0, 2))),
      'front'
    );
    const back = getEntriesPlacements(
      entries.filter(entry => entry.block && ['PE'].includes(entry.block.slice(0, 2))),
      'back'
    );

    return [
      ...left,
      ...right,
      ...front,
      ...back,
    ]
  }, [entries]);

  const dedupedLayout = useMemo(() => {
    return layout.filter((tile, index) => {
      return index === layout.findIndex(t => t.id === tile.id);
    });
  }, [layout]);

  return (
    <group>
      <StadiumModel scale={STADIUM_SCALE} position={[0,STADIUM_Y_POSITION,0]} rotation={[0,Math.PI / 4,0]} />
      {dedupedLayout.map(
        (tile) => (
          <Suspense key={tile.id} fallback={null}>
            <Tile
              data={tile.data}
              position={[tile.x, tile.y, tile.z]}
              rotation={[0, tile.rotation, 0]}
              scale={tile.scale}
            />
          </Suspense>
        ))}
    </group>
  )
}

export default Model;