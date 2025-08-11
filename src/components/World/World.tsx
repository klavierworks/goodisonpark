import styles from './World.module.css';
import { Canvas } from "@react-three/fiber";
import SceneSwitcher, { GRID_CAMERA_POSITION, SPACE_CAMERA_POSITION } from "./SceneSwitcher/SceneSwitcher";
import { AdaptiveDpr, Bvh, OrbitControls, PerspectiveCamera, Preload } from "@react-three/drei";;
import { NoToneMapping, SRGBColorSpace } from "three";
import useAtomState from "./useAtomState";
import { $currentView, $isDebug } from "../../store/ui";

const initialView = $currentView.get();
const World = () => {
  const [isDebug] = useAtomState($isDebug);

  return (
    <Canvas className={styles.canvas} frameloop="demand" gl={{
      outputColorSpace: SRGBColorSpace,
      toneMapping: NoToneMapping,
      logarithmicDepthBuffer: false,
      localClippingEnabled: true,
    }} style={{
      touchAction: "none",
    }}>
      <Preload all />
      <AdaptiveDpr pixelated />
      {isDebug ? (
        <OrbitControls />
      ) : (
        <PerspectiveCamera makeDefault position={
          initialView === 'grid' ? 
          GRID_CAMERA_POSITION
          : SPACE_CAMERA_POSITION
        } far={5000} />
      )}
      <Bvh firstHitOnly>
        <SceneSwitcher />
      </Bvh>
    </Canvas>
  )
}

export default World;