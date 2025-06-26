import { config, useSpring } from "@react-spring/core";
import { $currentView, $isTransitioning } from "../../../store/ui";
import Grid from "../Grid/Grid";
import Space from "../Space/Space";
import useAtomState from "../useAtomState";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group, Vector3 } from "three";
import { CAMERA_DISTANCE } from "../Space/constants";
import { Plane } from "@react-three/drei";

export const GRID_CAMERA_POSITION = new Vector3(0, 0, 4000);
export const SPACE_CAMERA_POSITION = new Vector3(0, 0, 0);

const SceneSwitcher = () => {
  const gridGroupRef = useRef<Group>(null);
  const spaceGroupRef = useRef<Group>(null);

  const [currentView, setCurrentView] = useAtomState($currentView);

  const spring = useSpring({
    transitionProgress: currentView === "space" ? 1 : 0,
    config: config.slow,
  })

  useFrame(({ camera }) => {
    const isDebug = new URL(window.location.href).searchParams.get('isDebug') === 'true';
    if (!gridGroupRef.current || !spaceGroupRef.current || isDebug) {
      return;
    }

    const progress = spring.transitionProgress.get();
    $isTransitioning.set(progress > 0 && progress < 1);

    if (!$isTransitioning.get()) {
      return;
    }
    camera.position.lerpVectors(
      GRID_CAMERA_POSITION,
      SPACE_CAMERA_POSITION,
      progress
    );
  });

  return (
    <>
      <group ref={gridGroupRef} position={[0, 0, 2000]}>
        <Grid />
      </group>
      <Plane args={[5000, 50000]} position={[0, 0, 200]} rotation={[0, 0, 0]}>
        <meshBasicMaterial color="rgb(3, 14, 40)" transparent opacity={0.8} />
      </Plane>
      <group ref={spaceGroupRef} position={[0, 0, -CAMERA_DISTANCE]}>
        <Space />
      </group>
    </>
  )
}

export default SceneSwitcher;