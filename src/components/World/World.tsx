import { Canvas } from "@react-three/fiber";
import SceneSwitcher from "./SceneSwitcher/SceneSwitcher";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useState } from "react";
import { Perf } from "r3f-perf";
import { ACESFilmicToneMapping, NoToneMapping, SRGBColorSpace } from "three";

const World = () => {
  const [isDebug] = useState(() => {
    const url = new URL(window.location.href);
    return url.searchParams.get('isDebug') === 'true';
  });

  return (
    <Canvas gl={{
      outputColorSpace: SRGBColorSpace,
      toneMapping: NoToneMapping,
      logarithmicDepthBuffer: false,
      localClippingEnabled: true,
    }} style={{
      touchAction: "none",
    }}>
      <Perf />
      {isDebug ? (
        <OrbitControls />
      ) : (
        <PerspectiveCamera makeDefault position={[0, 0, 0]} far={3000} />
      )}
      <SceneSwitcher />
    </Canvas>
  )
}

export default World;