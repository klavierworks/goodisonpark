import { Edges, useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {$focusedEntry} from '../../../../../store/data';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CanvasTexture, DoubleSide, Sprite, SpriteMaterial, Vector3 } from "three";
import Thumbnail from "./Thumbnail/Thumbnail";
import { config, useSpring } from "@react-spring/core";
import { $hoveredEntry } from "../../../../../store/ui";

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

  const [isForegrounded, setIsForegrounded] = useState(false);

  useFrame(({ camera }) => {
    if (!spriteRef.current) {
      return;
    }
    const distance = spriteRef.current.position.distanceTo(camera.position);
    setIsForegrounded(distance < 50);
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
    if (!isVisible || !isHovered) {
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

  useCursor(isHovered && isForegrounded, 'pointer', 'grab');

  const spring = useSpring({
    opacity: isVisible ? 1 : 0,
  })

  useFrame(() => {
    if (!spriteRef.current) {
      return;
    }
    (spriteRef.current.material as SpriteMaterial).opacity = spring.opacity.get();
  });

  const outlineRef = useRef<Sprite>(null);

  const outlineSpring = useSpring({
    opacity: isHovered ? 1 : 0,
    config: {
      tension: 300,
      friction: 10,
      clamp: true,
    }
  })

  useFrame(() => {
    if (!outlineRef.current || !spriteRef.current) {
      return;
    }
    outlineRef.current.scale.copy(
      spriteRef.current.scale
    );
    (outlineRef.current.material as SpriteMaterial).opacity = outlineSpring.opacity.get();
  });

  const canvasTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (!context) {
      console.error('Failed to get canvas context');
      return null;
    }
    context.fillStyle = 'transparent';
    context.lineWidth = 5;
    context.strokeStyle = 'white';
    context.strokeRect(0, 0, canvas.width, canvas.height);
    
    return new CanvasTexture(canvas);
  }, []);

  return (
    <>
      <sprite ref={spriteRef} {...rest} scale={[rest.scale, rest.scale, 1]} {...pointerAttributes} renderOrder={1}>
        <Suspense fallback={<spriteMaterial color="white" transparent opacity={0} side={DoubleSide} />}>
          <Thumbnail filename={filename} isHovered={isHovered} spriteRef={spriteRef} scale={rest.scale} />
        </Suspense>
      </sprite>
      <sprite {...rest} ref={outlineRef} renderOrder={2} visible={isHovered && isForegrounded}>
        <spriteMaterial
          map={canvasTexture}
          depthWrite={false}
          color="white"
          transparent
          side={DoubleSide}
        />
      </sprite>
    </>
  );
}

export default Tile;