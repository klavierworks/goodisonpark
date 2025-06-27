import { config, useSpring } from "@react-spring/core";
import { $currentlyViewingSpace, $currentView, $isDebug, $isTransitioning } from "../../../store/ui";
import Grid from "../Grid/Grid";
import Space from "../Space/Space";
import useAtomState from "../useAtomState";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Group, Vector3 } from "three";
import { CAMERA_DISTANCE } from "../Space/constants";
import { Plane, Sphere } from "@react-three/drei";

export const GRID_CAMERA_POSITION = new Vector3(0, 0, 4000);
export const SPACE_CAMERA_POSITION = new Vector3(0, 0, CAMERA_DISTANCE);

const SceneSwitcher = () => {
  const gridGroupRef = useRef<Group>(null);
  const spaceGroupRef = useRef<Group>(null);

  const [currentView, setCurrentView] = useAtomState($currentView);

  const invalidate = useThree((state) => state.invalidate);
  const spring = useSpring({
    transitionProgress: currentView === "space" ? 1 : 0,
    config: config.molasses,
    onStart: () => {
      invalidate();
    },
    onChange: () => {
      invalidate();
    },
    onRest: () => {
      if (currentView === "grid") {
        $currentlyViewingSpace.set("grid");
      } else {
        $currentlyViewingSpace.set("space");
      }
    }
  })

  useFrame(({ camera, invalidate, performance }) => {
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
    spaceGroupRef.current.visible = progress > 0.5;
    gridGroupRef.current.visible = progress < 0.5;
    performance.regress()
  });


  return (
    <>
      <group ref={gridGroupRef} position={[0, 0, 2000]}>
        <Grid />
      </group>
      <group ref={spaceGroupRef} position={[0, 0, 0]}>
        <Space />
      </group>
    </>
  )
}

export default SceneSwitcher;