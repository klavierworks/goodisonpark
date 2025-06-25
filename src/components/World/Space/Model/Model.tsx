import {  useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STADIUM_Y_POSITION, TILE_Y_DEPTH } from "../constants.ts";
import StadiumModel from "../../../StadiumLineModel.tsx";
import { $activeFilters, $allEntries, $entries } from "../../../../store/data.ts";
import { FrontSide, Group, Mesh, MeshBasicMaterial, Vector3, EllipseCurve, Euler, MathUtils, DoubleSide } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Line, OrbitControls, PresentationControls, Sphere, Text } from "@react-three/drei";
import { distributeElementsOnStadium, drawStadiumShape, getBlockAtPosition } from "./drawUtils.ts";
import Ring from "./Ring/Ring.tsx";
import { $block, $currentView, $stand } from "../../../../store/ui.ts";

type ModelProps = {
  entries: Entry[]
}

const Model = ({ entries }: ModelProps) => {
  const [isDebug] = useState(() => {
    const url = new URL(window.location.href);
    return url.searchParams.get('isDebug') === 'true';
  }) 

  const [labels, setLabels] = useState<Record<string, Vector3>>({});
  const modelRef = useRef<Group>(null);

  const setModelRefCallback = useCallback((node: Group) => {
    if (!node) {
      return;
    }
    modelRef.current = node;
    const material = new MeshBasicMaterial({
      color: 'white',
      side: DoubleSide
    });
    modelRef.current.traverse((child) => {
      if (child instanceof Mesh) {
        child.material = material;
        setLabels(currentLabels => ({
          ...currentLabels,
          [child.name]: child.getWorldPosition(new Vector3())
        }));
          child.visible = true
      }
    });
  }, []);

  const cameraLine = useMemo(() => drawStadiumShape(1.1), []);

  return (
    <group>
      <PresentationControls enabled polar={[-0.1, 0.5]} global={true} rotation={[0, 2,0]}>
        <StadiumModel ref={setModelRefCallback} rotation={[0, 0, 0]} scale={400} position={[0,STADIUM_Y_POSITION,0]} />
        <Line
          points={cameraLine.getPoints(100)}
          color="white"
          lineWidth={2}
          visible={isDebug}
        />
        <Ring
          isDebug={isDebug}
          color="green"
          radius={1}
          tier="lower"
          y={0}
        />
        <Ring
          isDebug={isDebug}
          color="yellow"
          radius={1.05}
          tier="middle"
          y={TILE_Y_DEPTH}
        />
        <Ring
          isDebug={isDebug}
          color="red"
          radius={1.1}
          tier="upper"
          y={TILE_Y_DEPTH * 2}
        />
      </PresentationControls>
    </group>
  )
}

export default Model;