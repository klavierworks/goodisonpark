import { Canvas } from "@react-three/fiber";
import SceneSwitcher from "./SceneSwitcher/SceneSwitcher";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";

const World = () => {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 0, 2000]} far={10000} />
      <SceneSwitcher />
    </Canvas>
  )
}

export default World;