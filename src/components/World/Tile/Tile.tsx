import { useCursor, useTexture } from "@react-three/drei";
import { ASSET_URL } from "astro:env/client";
import Outline from "./Outline/Outline";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Group, type Sprite } from "three";
import Thumbnail from "./Thumbnail/Thumbnail";
import useAtomState from "../useAtomState";
import { $entries } from "../../../store/data";
import { useSpring } from "@react-spring/core";
import { useFrame, useThree } from "@react-three/fiber";
import { $hoveredEntry, $selectedEntry } from "../../../store/ui";

type TileProps = {
  canInteract?: boolean;
  entry: Entry
  isActive?: boolean;
  onClick?: (entry: Entry) => void;
} & React.ComponentPropsWithoutRef<'group'>;

const Tile = ({ canInteract = true, entry, isActive = true, onClick, ...rest }: TileProps) => {
  const spriteRef = useRef<Sprite>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [isHoveredWithIntention, setIsHoveredWithIntention] = useState(false);
  useEffect(() => {
    if (!isHovered || !canInteract) {
      return;
    }
    $hoveredEntry.set(entry);
    let timer = setTimeout(() => {
      setIsHoveredWithIntention(true);
    }, 1000);
    return () => {
      $hoveredEntry.set(null);
      setIsHoveredWithIntention(false);
      clearTimeout(timer);
    }
  }, [isHovered, entry]);

  const pointerAttributes = useMemo(() => canInteract ? ({
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
  }) : null, [isHovered]);

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
      <mesh
        ref={spriteRef}
        name={entry.id}
        scale={[entry.thumbnail.width, entry.thumbnail.height, 1]}
        >
        <planeGeometry args={[1, 1]} />
        <Suspense fallback={<></>}>
          <Thumbnail filename={entry.filename} isHovered={isHoveredWithIntention} />
        </Suspense>
      </mesh>
      <Outline entry={entry} isHovered={isHovered} spriteRef={spriteRef} />
    </group>
  )
}

export default Tile;