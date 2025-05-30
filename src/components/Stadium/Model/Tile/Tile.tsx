import { Edges, useTexture, useVideoTexture, type EdgesRef } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { ASSET_URL } from "astro:env/client";
import { Suspense, useRef, useState } from "react";
import { Mesh, Raycaster, Vector2, Vector3 } from "three";
import Thumbnail from "./Thumbnail/Thumbnail";

const CENTER_POINT = new Vector2(0, 0);

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
  const [raycast] = useState(new Raycaster());
  const [isIntersected, setIsIntersected] = useState(false);
  
  useFrame(({camera}) => {
    if (!pointRef.current) {
      return;
    }
    pointRef.current.getWorldPosition(worldPosition);
    if (worldPosition.z > 0) {
      setIsIntersected(false);
      return;
    }
    raycast.setFromCamera(CENTER_POINT, camera);
    const intersects = raycast.intersectObject(pointRef.current);
    setIsIntersected(intersects.length > 0);

    if (isIntersected) {
     // onItemFocused(data);
    }
  });

  const [isHovered, setIsHovered] = useState(false);

  return (
    <mesh ref={pointRef} {...rest} onPointerOver={() => setIsHovered(true)} onPointerOut={() => setIsHovered(false)} scale={[0,0,0]}>
      <boxGeometry args={[1, 1, 0.001]} />
      <Suspense fallback={<meshBasicMaterial color="white" transparent opacity={0} />}>
        <Thumbnail filename={filename} isHovered={isHovered} pointRef={pointRef} />
      </Suspense>
      <Edges linewidth={2} threshold={15} color="white" visible={isHovered} />
    </mesh>
  )
}

export default Tile;