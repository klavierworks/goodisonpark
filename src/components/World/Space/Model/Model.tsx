import {  useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CAMERA_DISTANCE, STADIUM_Y_POSITION, TILE_Y_DEPTH } from "../constants.ts";
import StadiumModel from "../../../StadiumLineModel.tsx";
import { Group, Mesh, MeshBasicMaterial, Vector3, DoubleSide, Euler } from "three";
import { Line, PresentationControls, Sphere } from "@react-three/drei";
import Ring from "./Ring/Ring.tsx";
import { getRotationAngleAroundAxis, drawStadiumShape, getRotationAroundPoint } from "./drawUtils.ts";
import { useFrame, useThree } from "@react-three/fiber";
import { $currentView, $isTransitioning, $selectedEntry } from "../../../../store/ui.ts";
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

  const cameraLine = useMemo(() => drawStadiumShape(2.5), []);

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
    const y = entryObject.position.y / (TILE_Y_DEPTH * 3);
    if (!stadiumSceneRef.current) {
      return;
    }
    const worldPosition = entryObject.getWorldPosition(new Vector3());

    stadiumSceneRef.current.position.y = -worldPosition.y;
    //setInitialRotation([euler.x, -y, euler.z]);
    //setControlsKey(`${Date.now()}`);
  }, [selectedEntry]);

  const POLAR = [0, 0.45];
  useFrame(({ camera, scene }) => {
    if ($isTransitioning.get() || $currentView.get() !== "space") {
      return;
    }

    if (!rotationTargetRef.current || !stadiumSceneRef.current || !rotationTargetRef.current.parent) {
      return;
    }
    const rotation = rotationTargetRef.current.parent.rotation
    let normalizedYRotation = rotation.y % Math.PI / Math.PI;
    if (normalizedYRotation < 0) {
      normalizedYRotation += 1;
    }
    
    stadiumSceneRef.current.position.set(0, 0, 0);
    stadiumSceneRef.current.rotation.set(
      0,
      Math.PI * 2 * normalizedYRotation,
      0
    )

    const point = cameraLine.getPointAt(normalizedYRotation);
    const distanceToPoint = point.distanceTo(stadiumSceneRef.current.position);

    const stadiumPosition = stadiumSceneRef.current.getWorldPosition(new Vector3());
    const distanceToCamera = camera.position.distanceTo(stadiumPosition);
    const difference = distanceToCamera - distanceToPoint;
    
    const cameraDirection = new Vector3(0, 0, -1)
    const offset = cameraDirection.multiplyScalar(difference);
    stadiumSceneRef.current.position.sub(offset);
    stadiumSceneRef.current.position.y = -rotation.x * (TILE_Y_DEPTH * 6);
  });

  return (  
    <group>
      <PresentationControls enabled key={controlsKey} polar={POLAR} global={true} rotation={initialRotation}>
        <Sphere args={[0.1, 32, 32]} position={[0, 0, 0]} visible={isDebug} ref={rotationTargetRef}>
          <meshBasicMaterial color="red" />
        </Sphere>
      </PresentationControls>
      <Sphere args={[10, 32, 32]} position={[0, 0, 0]} name="camera-sphere" visible={isDebug}>
        <meshBasicMaterial color="blue" />
      </Sphere>
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