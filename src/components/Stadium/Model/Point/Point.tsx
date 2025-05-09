import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Mesh, Raycaster, Vector2, Vector3 } from "three";

const CENTER_POINT = new Vector2(0, 0);

const Point = (props) => {
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
  });

  return (
    <mesh {...props} ref={pointRef}>
    <boxGeometry args={[1, 1, 1]} />
    <meshBasicMaterial color={isIntersected ? 'red' : 'white'} />
  </mesh>
  )
}

export default Point;