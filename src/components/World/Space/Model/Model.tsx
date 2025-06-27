import {  useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CAMERA_DISTANCE, STADIUM_Y_POSITION, TILE_Y_DEPTH } from "../constants.ts";
import StadiumModel from "../../../StadiumLineModel.tsx";
import { Group, Mesh, MeshBasicMaterial, Vector3, DoubleSide, Curve, Quaternion } from "three";
import { Line, Plane, Sphere } from "@react-three/drei";
import Ring from "./Ring/Ring.tsx";
import { drawStadiumShape, getRotationAroundPoint } from "./drawUtils.ts";
import { useFrame, useThree } from "@react-three/fiber";
import { $currentView, $isTransitioning, $selectedEntry } from "../../../../store/ui.ts";
import useAtomState from "../../useAtomState.tsx";
import { useDrag } from "@use-gesture/react";
import type { SimpleRotationControlsRef } from "./SimpleRotationControls.tsx";
import SimpleRotationControls from "./SimpleRotationControls.tsx";
import { SPACE_CAMERA_POSITION } from "../../SceneSwitcher/SceneSwitcher.tsx";

type ModelProps = {
  entries: readonly Entry[]
}

const Model = ({ entries }: ModelProps) => {
  const [isDebug] = useState(() => {
    const url = new URL(window.location.href);
    return url.searchParams.get('isDebug') === 'true';
  }) 

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
        child.visible = true
      }
    });
  }, []);

  const cameraLine = useMemo(() => drawStadiumShape(2.5), []);

  const stadiumSceneRef = useRef<Group>(null);

  const [selectedEntry] = useAtomState($selectedEntry)

  const [initialRotation] = useState({
    hasApplied: false,
    position: new Vector3(0, 0, 0),
    x: 0,
    y: 0,
    tierY: 0,
    line: null as Curve<Vector3> | null,
  })

  const controlsRef =  useRef<SimpleRotationControlsRef>(null);

  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const scene = useThree((state) => state.scene);

  const [currentView] = useAtomState($currentView);
  const [isTransitioning] = useAtomState($isTransitioning);

  const updatePosition = useCallback(() => {
    if (!stadiumSceneRef.current || !controlsRef.current) {
      return;
    }

    const {
      line,
      tierY,
      x,
    } = initialRotation;

    const pivot = scene.getObjectByName('pivot-group');
    if (!pivot) {
      return;
    }

    pivot.position.copy(SPACE_CAMERA_POSITION);
    pivot.rotation.set(0, 0, 0);
    stadiumSceneRef.current.position.set(0,0,0)
    stadiumSceneRef.current.rotation.set(0, 0, 0);

    const initialOffset = line!.getPoint(x + controlsRef.current.x).negate();

    const HEIGHT_RANGE = TILE_Y_DEPTH * 3;

    const cameraDirection = camera.getWorldDirection(new Vector3());
    const angle = cameraDirection.angleTo(initialOffset);

    const newAngle = angle * (initialOffset.x < 0 ? -1 : 1);

    initialOffset.y = initialOffset.y - tierY - (HEIGHT_RANGE * controlsRef.current.y);

    if (newAngle === pivot.rotation.y && initialOffset.equals(stadiumSceneRef.current.position)) {
      return;
    }

    pivot.rotation.y = newAngle;
    pivot.position.z -= 50;

    stadiumSceneRef.current.position.copy(initialOffset);

    invalidate()
  }, []);

  useEffect(() => {
    if (!selectedEntry) {
      return;
    }

    if (currentView !== 'space') {
      return;
    }

    const tile = scene.getObjectByName(`space--${selectedEntry}`);
    if (!tile || !stadiumSceneRef.current) {
      return;
    }

    initialRotation.x = tile.userData.point;
    initialRotation.line = tile.userData.line;
    initialRotation.tierY = tile.userData.tierY

    updatePosition();

    return () => {
      initialRotation.hasApplied = false;
      controlsRef.current!.setRotation(0, 0);
    }
  }, [currentView, selectedEntry]);

  useFrame(({ camera, invalidate }) => {
    if (currentView !== 'space' || isTransitioning) {
      return;
    }

    if (!stadiumSceneRef.current || !controlsRef.current) {
      return;
    }

    const stadiumPosition = stadiumSceneRef.current.getWorldPosition(new Vector3());
    const distanceToCamera = camera.position.distanceTo(stadiumPosition);

    if (distanceToCamera > 1000) {
      return;
    } 

    if (!initialRotation.line) {
      initialRotation.line = scene.getObjectByName('space--line--lower')?.userData.line as Curve<Vector3>;
    }

    updatePosition();
  });

  return ( 
    <group>
      <SimpleRotationControls controlsRef={controlsRef} speedX={0.5} speedY={2} yLimits={[0,1]} />
      <group name="pivot-group">
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
    </group>
  )
}

export default Model;