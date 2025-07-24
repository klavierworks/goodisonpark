import {  useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STADIUM_Y_POSITION, TILE_Y_DEPTH } from "../constants.ts";
import StadiumModel from '../../../StadiumLineModel.tsx';
import { Group, Mesh, MeshBasicMaterial, Vector3, DoubleSide, Curve } from "three";
import { Line } from "@react-three/drei";
import Ring from "./Ring/Ring.tsx";
import { drawStadiumShape, getStadiumSection } from "./drawUtils.ts";
import { useFrame, useThree } from "@react-three/fiber";
import { $block, $currentlyViewingSpace, $currentView, $isTransitioning, $selectedEntry } from "../../../../store/ui.ts";
import useAtomState from "../../useAtomState.tsx";
import type { SimpleRotationControlsRef } from "./SimpleRotationControls.tsx";
import SimpleRotationControls from "./SimpleRotationControls.tsx";
import { SPACE_CAMERA_POSITION } from "../../SceneSwitcher/SceneSwitcher.tsx";

type ModelProps = {
  entries: readonly Entry[]
}

const HEIGHT_RANGE = TILE_Y_DEPTH * 2;

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

  const controlsRef =  useRef<SimpleRotationControlsRef>(null);

  const [currentView] = useAtomState($currentView);
  const [isTransitioning] = useAtomState($isTransitioning);
  const [currentlyViewingSpace] = useAtomState($currentlyViewingSpace);

  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const scene = useThree((state) => state.scene);

  const updatePosition = useCallback(() => {
    if (!stadiumSceneRef.current || !controlsRef.current) {
      console.warn('Model initialRotation: stadiumSceneRef or controlsRef not set');
      return;
    }

    const pivot = scene.getObjectByName('pivot-group');
    const line = scene.getObjectByName(`space--line--lower`)?.userData.line as Curve<Vector3>;
    if (!pivot || !line) {
      return;
    }

    const {
      x,
      y
    } = controlsRef.current;

    window.modelRotation = x;
  
    const initialOffset = line!.getPoint(x).negate();

    const cameraDirection = camera.getWorldDirection(new Vector3());
    const angle = cameraDirection.angleTo(initialOffset);

    const newAngle = angle * (initialOffset.x < 0 ? -1 : 1);
    initialOffset.y = HEIGHT_RANGE * -y;
    if (newAngle === pivot.rotation.y && initialOffset.equals(stadiumSceneRef.current.position)) {
      return;
    }

    pivot.rotation.y = newAngle;
    pivot.position.copy(SPACE_CAMERA_POSITION);
    pivot.position.z -= 50;

    stadiumSceneRef.current.position.copy(initialOffset);

    const block = getStadiumSection(newAngle, y)
    $block.set(block ?? '');

    invalidate()
  }, []);

  useEffect(() => {
    if (!selectedEntry) {
      return;
    }

    const tile = scene.getObjectByName(`space--${selectedEntry}`);
    if (!tile || !controlsRef.current) {
      return;
    }
    
    controlsRef.current.setRotation(
      tile.userData.point,
      (tile.position.y + tile.userData.tierY) / HEIGHT_RANGE
    )
    updatePosition();
  }, [currentlyViewingSpace === 'space' || isTransitioning, selectedEntry])

  useFrame(() => {
    if (currentlyViewingSpace !== 'space' || isTransitioning) {
      return;
    }
    updatePosition();
  });

  return ( 
    <group>
      <SimpleRotationControls controlsRef={controlsRef} enabled={currentlyViewingSpace === 'space' && !isTransitioning} speedX={0.5} speedY={2} yLimits={[0,1]} />
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