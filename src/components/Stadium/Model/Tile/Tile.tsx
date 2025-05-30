import { Edges, useTexture, useVideoTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { ASSET_URL } from "astro:env/client";
import { useRef, useState } from "react";
import { Mesh, Raycaster, Vector2, Vector3 } from "three";

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
  const texture = useTexture(ASSET_URL + `videos/${filename}/${filename}.jpg`);
  
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

  let [width, height] = [1, texture.image.height / texture.image.width];
  if (height > width) {
    width = texture.image.width / texture.image.height;
    height = 1;
  }

  const [isHovered, setIsHovered] = useState(false);

  return (
    <mesh ref={pointRef} {...rest} onPointerOver={() => setIsHovered(true)} onPointerOut={() => setIsHovered(false)}>
      <boxGeometry args={[width, height, 0.001]} />
      <meshBasicMaterial color="white" map={texture} />
      <Edges linewidth={2} threshold={15} color="white" visible={isHovered} />
    </mesh>
  )
}

export default Tile;