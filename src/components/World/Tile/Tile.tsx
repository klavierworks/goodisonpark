import { useCursor, useTexture } from "@react-three/drei";
import { ASSET_URL } from "astro:env/client";
import Outline from "./Outline/Outline";
import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import { Group, type Sprite } from "three";
import Thumbnail from "./Thumbnail/Thumbnail";
import useAtomState from "../useAtomState";
import { $entries } from "../../../store/data";
import { useSpring } from "@react-spring/core";
import { useFrame } from "@react-three/fiber";

type TileProps = {
  entry: Entry
  isActive?: boolean;
  onClick?: (entry: Entry) => void;
} & React.ComponentPropsWithoutRef<'group'>;

const Tile = ({ entry, isActive = true, onClick, ...rest }: TileProps) => {
  const spriteRef = useRef<Sprite>(null);

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

  const isVisible = useMemo(() => {
    return entries.some(e => e.id === entry.id);
  }, [entries, entry.id]);

  const spring = useSpring({
    x: isVisible && isActive ? entry.thumbnail.width : 0,
    y: isVisible && isActive ? entry.thumbnail.height : 0,
  })

  useFrame(() => {
    if (!spriteRef.current) {
      return;
    }

    spriteRef.current.scale.set(spring.x.get(), spring.y.get(), 1);
  });

  return (
    <group {...rest} {...pointerAttributes}>
      <sprite
        ref={spriteRef}
        name={entry.id}
        scale={[entry.thumbnail.width, entry.thumbnail.height, 1]}
        >
        <Suspense fallback={<></>}>
          <Thumbnail filename={entry.filename} isHovered={false} />
        </Suspense>
      </sprite>
      <Outline entry={entry} isHovered={isHovered} spriteRef={spriteRef} />
    </group>
  )
}

export default Tile;