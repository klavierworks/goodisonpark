import {  useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CAMERA_DISTANCE, STADIUM_Y_POSITION, TILE_Y_DEPTH } from "../constants.ts";
import StadiumModel from "../../../StadiumLineModel.tsx";
import { Group, Mesh, MeshBasicMaterial, Vector3, DoubleSide, Euler } from "three";
import { Line, PresentationControls, Sphere } from "@react-three/drei";
import Ring from "./Ring/Ring.tsx";
import { getRotationAngleAroundAxis, drawStadiumShape } from "./drawUtils.ts";
import { useFrame, useThree } from "@react-three/fiber";
import { $selectedEntry } from "../../../../store/ui.ts";
import useAtomState from "../../useAtomState.tsx";

type ModelProps = {
  entries: readonly Entry[]
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

  const cameraLine = useMemo(() => drawStadiumShape(2.3), []);

  const isSpace = true;
  const rotationTargetRef = useRef<Mesh>(null);
  const stadiumSceneRef = useRef<Group>(null);

  const [controlsKey, setControlsKey] = useState(`${Date.now()}`);
  const [initialRotation, setInitialRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [selectedEntry] = useAtomState($selectedEntry)

  const scene = useThree(state => state.scene);
  useEffect(() => {
    if (!selectedEntry || !scene) {
      return;
    }
    const entryObject = scene.getObjectByName(selectedEntry);
    if (!entryObject) {
      return;
    }
    const euler = getRotationAngleAroundAxis(
      new Vector3(0, 0, -CAMERA_DISTANCE),
      new Vector3(0, 0, 0),
      entryObject.getWorldPosition(new Vector3()),
      new Vector3(0, 1, 0)
    );
    setInitialRotation([euler.x, euler.y, euler.z]);
    setControlsKey(`${Date.now()}`);
  }, [selectedEntry]);

  useFrame(({ scene }) => {
    if (!isSpace || !rotationTargetRef.current || !stadiumSceneRef.current || !rotationTargetRef.current.parent) {
      return;
    }
    const rotation = rotationTargetRef.current.parent.rotation
    stadiumSceneRef.current.rotation.set(rotation.x, rotation.y, rotation.z);
  });

  return (
    <group>
      <PresentationControls enabled key={controlsKey} polar={[0, 0.45]} global={true} rotation={initialRotation}>
        <Sphere args={[0.1, 32, 32]} position={[0, 0, 0]} visible={isDebug} ref={rotationTargetRef}>
          <meshBasicMaterial color="red" />
        </Sphere>
      </PresentationControls>
      <group ref={stadiumSceneRef}>
        <StadiumModel ref={setModelRefCallback} rotation={[0, 0, 0]} scale={800} position={[0,STADIUM_Y_POSITION,0]} />
        <Line
          points={cameraLine.getPoints(100)}
          color="white"
          lineWidth={2}
          visible={isDebug}
        />
        <Ring
          isDebug={isDebug}
          color="green"
          radius={2}
          tier="lower"
          y={0}
        />
        <Ring
          isDebug={isDebug}
          color="yellow"
          radius={2}
          tier="middle"
          y={TILE_Y_DEPTH}
        />
        <Ring
          isDebug={isDebug}
          color="red"
          radius={2}
          tier="upper"
          y={TILE_Y_DEPTH * 2}
        />
      </group>
    </group>
  )
}

export default Model;