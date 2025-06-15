import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Tile from "./Tile/Tile";
import { SPHERE_SCALE, STADIUM_SCALE, STADIUM_Y_POSITION, TILE_DEPTH, TILE_HEIGHT } from "../constants";
import StadiumModel from "../../StadiumModel.tsx";
import { getEntriesPlacements } from "./utils";
import { $activeFilters, $allEntries, $entries } from "../../../store/data.ts";
import { DoubleSide, FrontSide, Group, Mesh,type Line as LineType, MeshBasicMaterial, Vector3, EllipseCurve } from "three";
import { useFrame } from "@react-three/fiber";
import { Line, Sphere, Text } from "@react-three/drei";
import { distributeElementsOnStadium, drawStadiumShape } from "./drawUtils.ts";

type ModelProps = {
  entries: Entry[]
}

const Model = ({ }: ModelProps) => {
  const [isDebug] = useState(() => {
    const url = new URL(window.location.href);
    return url.searchParams.get('isDebug') === 'true';
  }) 
  const [allEntries] = useState($allEntries.get());

  const [entries, setEntries] = useState($entries.get());

  useEffect(() => {
    const unsubscribe = $entries.subscribe((newEntries) => {
      setEntries(newEntries as Entry[]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleFiltering = async (event: CustomEvent) => {
      $activeFilters.set(event.detail.filters);
    }

    document.addEventListener('filtering', handleFiltering);
    return () => {
      document.removeEventListener('filtering', handleFiltering);
    };
  }, []);

  const [labels, setLabels] = useState<Record<string, Vector3>>({});
  const modelRef = useRef<Group>(null);

  useFrame(() => {
    if (!modelRef.current || !isDebug) {
      return;
    }
    modelRef.current.traverse((child) => {
      if (child instanceof Mesh) {
        (child.material as MeshBasicMaterial).side = FrontSide
        setLabels(currentLabels => ({
          ...currentLabels,
          [child.name]: child.getWorldPosition(new Vector3())
        }));
      }
    });
  });
  
  const cameraLine = useMemo(() => drawStadiumShape(1.1), []);

  const [lowerLine, lowerPoints] = useMemo(() => {
    const line = drawStadiumShape(1);
    
    const points = distributeElementsOnStadium(line, allEntries.filter(entry => entry.block), 'lower');
    return [
      line,
      points
    ]
  }, []);

  const [middleLine, middlePoints] = useMemo(() => {
    const line = drawStadiumShape(1);
    
    const points = distributeElementsOnStadium(line, allEntries.filter(entry => entry.block), 'middle');
    return [
      line,
      points
    ]
  }, []);

  const [upperLine, upperPoints] = useMemo(() => {
    const line = drawStadiumShape(1);
    
    const points = distributeElementsOnStadium(line, allEntries.filter(entry => entry.block), 'upper');
    return [
      line,
      points
    ]
  }, []);

  return (
    <group>
      <StadiumModel ref={modelRef} />
      <group rotation={[Math.PI / 2, 0, 0]} position={[0,0,2]}>
        <Line
          points={cameraLine.getPoints(100)}
          color="white"
          lineWidth={2}
          visible={isDebug}
        />
        <Line
          points={lowerLine.getPoints(100)}
          color="red"
          lineWidth={2}
          visible={isDebug}
        />  
        {lowerPoints.map((tile) => (
          <Suspense key={tile.id} fallback={null}>
            <Tile
              data={tile}
              position={[tile.position[0], tile.position[1], tile.position[2]]}
              isVisible={true}
              rotation={tile.rotation}
              scale={1}
            />
          </Suspense>
        ))}
      </group>
      <group rotation={[Math.PI / 2, 0, 0]} position={[0,6,2]}>
        <Line
          points={middleLine.getPoints(100)}
          color="blue"
          lineWidth={2}
          visible={isDebug}
        />
        {middlePoints.map((tile) => (
          <Suspense key={tile.id} fallback={null}>
            <Tile
              data={tile}
              position={[tile.position[0], tile.position[1], tile.position[2]]}
              isVisible={true}
              rotation={tile.rotation}
              scale={1}
            />
          </Suspense>
        ))}
      </group>
      <group rotation={[Math.PI / 2, 0, 0]} position={[0,8,2]}>
        <Line
          points={upperLine.getPoints(100)}
          color="yellow"
          lineWidth={2}
          visible={isDebug}
        />
        {upperPoints.map((tile) => (
          <Suspense key={tile.id} fallback={null}>
            <Tile
              data={tile}
              position={[tile.position[0], tile.position[1], tile.position[2]]}
              isVisible={true}
              rotation={tile.rotation}
              scale={1}
            />
          </Suspense>
        ))}
      </group>
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