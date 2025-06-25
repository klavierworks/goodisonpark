import { Canvas } from "@react-three/fiber";
import SceneSwitcher from "./SceneSwitcher/SceneSwitcher";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useState } from "react";
import { Perf } from "r3f-perf";

const World = () => {
  const [isDebug] = useState(() => {
    const url = new URL(window.location.href);
    return url.searchParams.get('isDebug') === 'true';
  });

  return (
    <Canvas>
      <Perf />
      {isDebug ? (
        <OrbitControls />
      ) : (
        <PerspectiveCamera makeDefault position={[0, 0, 0]} far={4000} />
      )}
      <SceneSwitcher />
    </Canvas>
  )
}

export default World;