import { Edges } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {$focusedEntry} from '../../../../store/data';
import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import { Mesh, MeshBasicMaterial, Vector3 } from "three";
import Thumbnail from "./Thumbnail/Thumbnail";
import { useSpring } from "@react-spring/core";

type TileProps = {
  data: Entry
  isVisible: boolean
  scale: number
} & Omit<React.ComponentPropsWithoutRef<'mesh'>, 'scale'>;

const Tile = ({ data, isVisible, ...rest }: TileProps) => {
  const pointRef = useRef<Mesh>(null);

  let filenameParts = data.filename.split('.');
  filenameParts.pop();
  const filename = filenameParts.join('.');
  if (!filename) {
    console.warn('Invalid filename:', data.filename);
    return null;
  }

  const [worldPosition] = useState(new Vector3());
  const [isForegrounded, setIsForegrounded] = useState(false);
  
  useFrame(() => {
    if (!pointRef.current) {
      return;
    }
    pointRef.current.getWorldPosition(worldPosition);
    setIsForegrounded(worldPosition.z > 0);
  });

  const [isHovered, setIsHovered] = useState(false);

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
    if (!pointRef.current) {
      return;
    }
    (pointRef.current.material as MeshBasicMaterial).opacity = spring.opacity.get();
  });

  return (
    <mesh ref={pointRef} {...rest} scale={[0,0,0]} {...pointerAttributes}>
      <boxGeometry args={[1, 1, 0.001]} />
      <Suspense fallback={<meshBasicMaterial color="white" transparent opacity={0} />}>
        <Thumbnail filename={filename} isHovered={isHovered} pointRef={pointRef} scale={rest.scale} />
      </Suspense>
      <Edges linewidth={2} threshold={15} color="white" visible={isHovered} />
    </mesh>
  )
}

export default Tile;