import { useSpring } from "@react-spring/core";
import { $currentView } from "../../../store/ui";
import Grid from "../Grid/Grid";
import Space from "../Space/Space";
import useAtomState from "../useAtomState";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group } from "three";

const SceneSwitcher = () => {
  const gridGroupRef = useRef<Group>(null);
  const spaceGroupRef = useRef<Group>(null);

  const [currentView, setCurrentView] = useAtomState($currentView);

  const spring = useSpring({
    transitionProgress: currentView === "space" ? 1 : 0,
  })

  useFrame(({ clock: {elapsedTime} }) => {
    if (!gridGroupRef.current || !spaceGroupRef.current) {
      return;
    }
    const progress = spring.transitionProgress.get();

    if (progress === 0) {
      gridGroupRef.current.visible = true;
      gridGroupRef.current.opacity = 1;
      spaceGroupRef.current.visible = false;
      spaceGroupRef.current.opacity = 0;
      return;
    }
    if (progress === 1) {
      gridGroupRef.current.visible = false;
      gridGroupRef.current.opacity = 0;
      spaceGroupRef.current.visible = true;
      spaceGroupRef.current.opacity = 1;
      return;
    }
    
    gridGroupRef.current.opacity = 1 - progress;
    spaceGroupRef.current.opacity = progress;
  });

  return (
    <>
      <group ref={gridGroupRef} position={[0, 0, 0]}>
        <Grid />
      </group>
      <group ref={spaceGroupRef}>
        <Space />
      </group>
    </>
  )
}

export default SceneSwitcher;