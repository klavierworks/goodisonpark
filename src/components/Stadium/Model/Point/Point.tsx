import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Mesh, Raycaster, Vector2, Vector3 } from "three";
import type { Data, DataKey } from "../../../../api/api";

const CENTER_POINT = new Vector2(0, 0);

type PointProps = {
  data: [DataKey, Data];
  position: [number, number, number];
  onItemFocused: (data: [DataKey, Data]) => void;
}

const Point = ({ data, position, onItemFocused }: PointProps) => {
  const pointRef = useRef<Mesh>(null);
  
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
      onItemFocused(data);
    }
  });

  return (
    <mesh ref={pointRef} position={position}>
    <boxGeometry args={[1, 1, 1]} />
    <meshBasicMaterial color={isIntersected ? 'red' : 'white'} />
  </mesh>
  )
}

export default Point;