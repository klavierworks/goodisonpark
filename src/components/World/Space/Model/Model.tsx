import {  useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STADIUM_Y_POSITION, TILE_Y_DEPTH } from "../constants.ts";
import StadiumModel from "../../../StadiumLineModel.tsx";
import { $activeFilters, $allEntries, $entries } from "../../../../store/data.ts";
import { FrontSide, Group, Mesh, MeshBasicMaterial, Vector3, EllipseCurve, Euler, MathUtils, DoubleSide } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Line, OrbitControls, Sphere, Text } from "@react-three/drei";
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
  const [allEntries] = useState($allEntries.get());

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

  const [lowerLine, lowerPoints] = useMemo(() => {
    const line = drawStadiumShape(1);
    
    const points = distributeElementsOnStadium(line, allEntries.filter(entry => entry.block), 'lower');
    return [
      line,
      points
    ]
  }, []);

  const [middleLine, middlePoints] = useMemo(() => {
    const line = drawStadiumShape(1.05);
    
    const points = distributeElementsOnStadium(line, allEntries.filter(entry => entry.block), 'middle');
    return [
      line,
      points
    ]
  }, []);

  const [upperLine, upperPoints] = useMemo(() => {
    const line = drawStadiumShape(1.1);
    
    const points = distributeElementsOnStadium(line, allEntries.filter(entry => entry.block), 'upper');
    return [
      line,
      points
    ]
  }, []);


  const cameraLine = useMemo(() => drawStadiumShape(1.1), []);

  const previousRotation = useRef<string>('');
  const invalidate = useThree((state) => state.invalidate)
  const regress = useThree((state) => state.performance.regress);
  useFrame((state) => {
    const currentView = $currentView.get();
    if (currentView !== "space") {
      return;
    }
    if (isDebug) {
      return;
    }
    const camera = state.camera;
    const normalizedRotationX = window.modelRotation.x / (Math.PI * 2);

    const newRotationString = `${normalizedRotationX}--${window.modelRotation.y}`;
    if (newRotationString === previousRotation.current) {
      return;
    }
    const position = cameraLine.getPointAt(normalizedRotationX)
    camera.position.set(
      position.x,
      position.y,
      0,
    )
    
    const tangent = cameraLine.getTangentAt(normalizedRotationX);
    const normal = new Vector3(-tangent.y, tangent.x, 0).normalize();
    const lookAtPoint = new Vector3(position.x, position.y, 0).add(normal);
    camera.up.set(0, 0, -1);
    camera.lookAt(lookAtPoint);

    camera.position.z = TILE_Y_DEPTH + (-window.modelRotation.y * (TILE_Y_DEPTH * 3));

    const reverseDirection = camera.getWorldDirection(new Vector3()).multiplyScalar(-1);
    camera.position.add(reverseDirection.multiplyScalar(
      window.modelRotation.y * 5
    ));

    previousRotation.current = newRotationString;
    regress();
    invalidate();

    const block = getBlockAtPosition(normalizedRotationX, window.modelRotation.y)
    const stand = allEntries.find(entry => entry.block && entry.block.slice(0, 2) === block?.slice(0,2) && entry.stand !== 'undefined');
    if (!block) {
      return;
    }
    $block.set(block);
    $stand.set(stand?.stand || 'Unknown stand');
  })
  

  return (
    <group>
      {isDebug && <OrbitControls />}
      <StadiumModel ref={setModelRefCallback} rotation={[Math.PI / -2, Math.PI / 2, 0]} scale={400} position={[0,0,STADIUM_Y_POSITION]} />
      <Line
        points={cameraLine.getPoints(100)}
        color="white"
        lineWidth={2}
        visible={isDebug}
      />
      <Ring
        isDebug={isDebug}
        line={lowerLine}
        points={lowerPoints}
        color="green"
        y={0}
      />
      <Ring
        isDebug={isDebug}
        line={middleLine}
        points={middlePoints}
        color="yellow"
        y={TILE_Y_DEPTH}
      />
      <Ring
        isDebug={isDebug}
        line={upperLine}
        points={upperPoints}
        color="red"
        y={TILE_Y_DEPTH * 2}
      />
      {isDebug && Object.entries(labels).map(([label, location]) => (
        <Text
          key={label}
          position={[location.x, location.y + 50, location.z]}
          fontSize={10}
          color="white"
          anchorX="center"
          anchorY="bottom"
        >
          {label}
        </Text>
      ))}
    </group>
  )
}

export default Model;