import { config, useSpring } from "@react-spring/core";
import { $currentView, $isTransitioning } from "../../../store/ui";
import Grid from "../Grid/Grid";
import Space from "../Space/Space";
import useAtomState from "../useAtomState";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group, Vector3 } from "three";
import { CAMERA_DISTANCE } from "../Space/constants";

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

    camera.position.lerpVectors(
      new Vector3(0, 0, 4000),
      new Vector3(0, 0, 0),
      progress
    );
  });

  return (
    <>
      <group ref={gridGroupRef} position={[0, 0, 2000]}>
        <Grid />
      </group>
      <group ref={spaceGroupRef} position={[0, 0, -CAMERA_DISTANCE]}>
        <Space />
      </group>
    </>
  )
}

export default SceneSwitcher;