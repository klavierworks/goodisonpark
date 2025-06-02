import { Edges } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {$focusedEntry} from '../../../../store/data';
import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import { Mesh, Vector3 } from "three";
import Thumbnail from "./Thumbnail/Thumbnail";

type TileProps = {
  data: Entry
} & React.ComponentPropsWithoutRef<'mesh'>;

const Tile = ({ data, ...rest }: TileProps) => {
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
    $focusedEntry.set(data.id);
  }, [data]);

  const pointerAttributes = useMemo(() => isForegrounded ? ({
    onPointerOver: () => setIsHovered(true),
    onPointerOut: () => setIsHovered(false),
    onClick: handleToggleActive,
  }) : {}, [handleToggleActive, isForegrounded]);

  return (
    <mesh ref={pointRef} {...rest} scale={[0,0,0]} {...pointerAttributes}>
      <boxGeometry args={[1, 1, 0.001]} />
      <Suspense fallback={<meshBasicMaterial color="white" transparent opacity={0} />}>
        <Thumbnail filename={filename} isHovered={isHovered} pointRef={pointRef} />
      </Suspense>
      <Edges linewidth={2} threshold={15} color="white" visible={isHovered} />
    </mesh>
  )
}

export default Tile;