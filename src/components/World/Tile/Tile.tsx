import { useCursor, useTexture } from "@react-three/drei";
import { ASSET_URL } from "astro:env/client";
import Outline from "./Outline/Outline";
import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import type { Sprite } from "three";
import Thumbnail from "./Thumbnail/Thumbnail";
import Fallback from "./Fallback/Fallback";
import { useSpring } from "@react-spring/core";
import { useFrame } from "@react-three/fiber";
import useAtomState from "../useAtomState";
import { $entries } from "../../../store/data";

type TileProps = {
  entry: Entry
  onClick?: (entry: Entry) => void;
} & React.ComponentPropsWithoutRef<'group'>;

const Tile = ({ entry, onClick, ...rest }: TileProps) => {
  const spriteRef = useRef<Sprite>(null);
  const [hasRef, setHasRef] = useState(false);

  const setSpriteRef = useCallback((sprite: Sprite | null) => {
    if (sprite) {
      spriteRef.current = sprite;
      setHasRef(true);
    } else {
      spriteRef.current = null;
      setHasRef(false);
    }
  }, []);

  const [isHovered, setIsHovered] = useState(false);

  const pointerAttributes = useMemo(() => ({
    onPointerOver: (e) => {
      const closestObjectUuid = e.intersections[0].object.uuid;

      if (!spriteRef.current || spriteRef.current.uuid !== closestObjectUuid) {
        return;
      }
      setIsHovered(true);
    },
    onPointerOut: () => {
      setIsHovered(false);
    },
    onClick: () => {
      if (onClick && isHovered) {
        onClick(entry);
      }
    }
  }), [isHovered]);

  useCursor(isHovered, 'pointer', 'auto');

  const [entries] = useAtomState($entries);
  const isActive = useMemo(() => {
    return entries.some((e) => e.id === entry.id);
  }, [entry.id]);

  const [hasLoadedThumbnail, setHasLoadedThumbnail] = useState(false);
  const onLoadRef = useRef<() => void>(() => setHasLoadedThumbnail(true));

  const spring = useSpring({
    x: hasLoadedThumbnail && isActive ? entry.thumbnail.width : 0,
    y: hasLoadedThumbnail && isActive ? entry.thumbnail.height : 0,
  })

  useFrame(() => {
    if (!spriteRef.current) {
      return;
    }

    spriteRef.current.scale.set(
      spring.x.get(),
      spring.y.get(),
      1
    );
  });

  return (
    <group {...rest} {...pointerAttributes}>
      <sprite
        ref={setSpriteRef}
        scale={[0, 0, 1]}
        >
        <Suspense fallback={<Fallback onLoadRef={onLoadRef} />}>
          <Thumbnail filename={entry.filename} isHovered={isHovered} />
        </Suspense>
      </sprite>
      {hasRef && <Outline isHovered={isHovered} spriteRef={spriteRef} />}
    </group>
  )
}

export default Tile;