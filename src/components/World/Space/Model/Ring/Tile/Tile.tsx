import { Edges, useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {$focusedEntry} from '../../../../../../store/data';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CanvasTexture, DoubleSide, Sprite, SpriteMaterial, Vector3 } from "three";
import { config, useSpring } from "@react-spring/core";
import { $hoveredEntry } from "../../../../../../store/ui";
import Outline from "../../../../Tile/Outline/Outline";

type TileProps = {
  data: Entry
  isVisible: boolean
  scale: number
} & Omit<React.ComponentPropsWithoutRef<'mesh'>, 'scale'>;

const Tile = ({ data, isVisible, ...rest }: TileProps) => {
  const spriteRef = useRef<Sprite>(null);

  const [isForegrounded, setIsForegrounded] = useState(false);

  useFrame(({ camera }) => {
    if (!spriteRef.current) {
      return;
    }
    const distance = spriteRef.current.position.distanceTo(camera.position);
    setIsForegrounded(distance < 100);
  });

  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isHovered) {
      $hoveredEntry.set(null);
      return;
    }
    $hoveredEntry.set(data);
  }, [isHovered, data.id]);

  const handleToggleActive = useCallback(() => {
    // Either ishovered or pointer is touch
    const isHover = isHovered || window.matchMedia('(pointer: coarse)').matches; 
    if (!isVisible || !isHover) {
      return;
    }
    $focusedEntry.set(data.id);
  }, [data, isHovered, isVisible]);

  const pointerAttributes = useMemo(() => isForegrounded ? ({
    onPointerOver: (e) => {
      if (!isVisible) {
        return;
      }

      const closestObjectUuid = e.intersections[0].object.uuid;

      if (!spriteRef.current || spriteRef.current.uuid !== closestObjectUuid) {
        return;
      }
      setIsHovered(true);
    },
    onPointerOut: () => {
      if (!isVisible) {
        return;
      }
      setIsHovered(false);
    },
    onClick: handleToggleActive,
  }) : {}, [handleToggleActive, isForegrounded, isVisible, isHovered]);

  useCursor(isHovered && isForegrounded, 'zoom-in', 'grab');

  const spring = useSpring({
    opacity: isVisible ? 1 : 0,
  })

  useFrame(() => {
    if (!spriteRef.current) {
      return;
    }
    (spriteRef.current.material as SpriteMaterial).opacity = spring.opacity.get();
  });

  return (
    <>
      <sprite
        ref={spriteRef}
        {...rest}
        scale={[rest.scale, rest.scale, 1]}
        {...pointerAttributes}
        renderOrder={1}
        name={data.id}
      >
      </sprite>
      <Outline />
    </>
  );
}

export default Tile;