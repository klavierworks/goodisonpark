import { BufferGeometry, Color, EdgesGeometry, Mesh, type MeshBasicMaterial } from "three";
import { $hoveredEntry } from "../../../store/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import Controls from "../../Stadium/Controls/Controls";
import StadiumModel from "../../StadiumModel";
import { useFrame, useThree } from "@react-three/fiber";
import { $activeFilters, $allEntries, $entries } from "../../../store/data";
import type { Group } from "three";

type Props = {
  isAutoRotating?: boolean;
  isShowingPoints?: boolean;
}
const Overview = ({ isAutoRotating, isShowingPoints }: Props) => {
  const [edges, setEdges] = useState<BufferGeometry | null>(null);
  const [node, setNode] = useState<Mesh | null>(null);
  const [blocks, setBlocks] = useState<Mesh[]>([]);

  const handleRef = useCallback((node: Mesh) => {
    if (!node) {
      return;
    }
    const stadium = node.getObjectByName('GoodisonFull')! as Mesh;
    setEdges(
      new EdgesGeometry(stadium.geometry.clone(), 15)
    );
    setNode(node);

    const blockMeshes: Mesh[] = [];
    node.traverse((child) => {
      if (child instanceof Mesh && child.name !== 'GoodisonFull') {
        const block = child.clone();
        const material = block.material.clone();
        block.material = material;
        block.scale.set(4,4,4);
        blockMeshes.push(block);
      }
    });
    setBlocks(blockMeshes);
  }, []);

  const invalidate = useThree((state) => state.invalidate);

  const updateActiveMemory = useCallback((memory: string | undefined) => {
    const matchingBlocks = 
      memory ? 
      $allEntries.get().filter(entry => entry.memory.toLowerCase() === memory.toLowerCase()).map(entry => entry.block)
      : [];

    blocks.forEach((block) => {
      (block.material as MeshBasicMaterial).color = new Color(0xffffff);
      (block.material as MeshBasicMaterial).visible = matchingBlocks.includes(block.name);
    });
    invalidate();
  }, [blocks, invalidate]);

  useEffect(() => {
    if (!node && isShowingPoints) {
      return;
    }
    const unsubscribe1 = $hoveredEntry.subscribe((hoveredEntry) => {
      const memory = hoveredEntry?.memory;
      updateActiveMemory(memory);
    });
    const unsubscribe2 = $activeFilters.subscribe((activeFilters) => {
      const memory = activeFilters.memory;
      updateActiveMemory(memory);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [node]);

  useEffect(() => {
    if (!isShowingPoints) {
      return;
    }

    const unsubscribe = $entries.subscribe((newEntries) => {
      const entries = newEntries as Entry[];
      blocks.forEach((block) => {
        (block.material as MeshBasicMaterial).color = new Color(0xffffff);
        (block.material as MeshBasicMaterial).visible = entries.find(entry => entry.block === block.name) !== undefined;
      });
      invalidate();
    });

    return () => {
      unsubscribe();
    };
  }, [blocks, isShowingPoints]);

  const introRef = useRef<Group>(null);
  useFrame(() => {
    if (!introRef.current || !isAutoRotating) {
      return;
    }
    introRef.current.position.y = 20
    introRef.current.position.x = 0
    introRef.current.position.z = 0
    introRef.current.rotation.x = Math.PI / 7
    introRef.current.rotation.y -= 0.001;
    invalidate();
  });

  return (
    <group position={[0,20,0]} ref={introRef}>
      <Controls isController={false} isTarget={true}>
        <StadiumModel ref={handleRef} visible={false} />
        <group rotation={[Math.PI / 2,0,Math.PI / -1.7]} position={[0,0,0]}>
        {edges && (
          <lineSegments geometry={edges} position={[0, 0,0]}>
            <lineBasicMaterial color="white" opacity={0.1} transparent />
          </lineSegments>
        )}
        </group>
  
        <group rotation={[0,Math.PI ,0]}>
          {isShowingPoints && blocks.map(block => <primitive key={block.uuid} object={block} />)}
        </group>
      </Controls>
    </group>
  )
};

export default Overview;