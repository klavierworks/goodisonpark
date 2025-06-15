import { Edges } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {$focusedEntry} from '../../../../store/data';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DoubleSide, Sprite, SpriteMaterial, Vector3 } from "three";
import Thumbnail from "./Thumbnail/Thumbnail";
import { useSpring } from "@react-spring/core";
import { $hoveredEntry } from "../../../../store/ui";

type TileProps = {
  data: Entry
  isVisible: boolean
  scale: number
} & Omit<React.ComponentPropsWithoutRef<'mesh'>, 'scale'>;

const Tile = ({ data, isVisible, ...rest }: TileProps) => {
  const spriteRef = useRef<Sprite>(null);
  
  let filenameParts = data.filename.split('.');
  filenameParts.pop();
  const filename = filenameParts.join('.');
  
  if (!filename) {
    console.warn('Invalid filename:', data.filename);
    return null;
  }

  const [worldPosition] = useState(new Vector3());
  const [isForegrounded, setIsForegrounded] = useState(false);

  useFrame(({ camera }) => {
    if (!spriteRef.current) {
      return;
    }
    const distance = spriteRef.current.position.distanceTo(camera.position);
    setIsForegrounded(distance < 10);
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
    if (!isVisible) {
      return;
    }
    $focusedEntry.set(data.id);
  }, [data]);

  const pointerAttributes = useMemo(() => isForegrounded ? ({
    onPointerOver: () => {
      if (!isVisible) {
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
  }) : {}, [handleToggleActive, isForegrounded]);

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
      <sprite ref={spriteRef} {...rest} scale={[rest.scale, rest.scale, 1]} {...pointerAttributes} renderOrder={1}>
        <Suspense fallback={<spriteMaterial color="white" transparent opacity={0} side={DoubleSide} />}>
          <Thumbnail filename={filename} isHovered={isHovered} spriteRef={spriteRef} scale={rest.scale} />
        </Suspense>

      </sprite>
    </>
  );
}

export default Tile;