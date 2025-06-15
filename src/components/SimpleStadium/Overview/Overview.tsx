import { BufferGeometry, Color, EdgesGeometry, Mesh, type MeshBasicMaterial } from "three";
import { $hoveredEntry } from "../../../store/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import Controls from "../../Stadium/Controls/Controls";
import StadiumModel from "../../StadiumModel";
import { useThree } from "@react-three/fiber";
import { $activeFilters, $allEntries } from "../../../store/data";

const Overview = () => {
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

  useEffect(() => {
    if (!node) {
      return;
    }
    const updateActiveMemory = (memory: string | undefined) => {
      const matchingBlocks = 
        memory ? 
        $allEntries.get().filter(entry => entry.memory.toLowerCase() === memory.toLowerCase()).map(entry => entry.block)
        : [];
      console.log('matchingBlocks', matchingBlocks);
      blocks.forEach((block) => {
        (block.material as MeshBasicMaterial).color = new Color(0xffffff);
        (block.material as MeshBasicMaterial).visible = matchingBlocks.includes(block.name);
      });
      invalidate();
    }
    $hoveredEntry.subscribe((hoveredEntry) => {
      const memory = hoveredEntry?.memory;
      updateActiveMemory(memory);
    });
    $activeFilters.subscribe((activeFilters) => {
      const memory = activeFilters.memory;
      updateActiveMemory(memory);
    });
  }, [node]);

  return (
      <Controls isController={true} isTarget={true}>
        <StadiumModel ref={handleRef} visible={false} />
        
        {edges && (
          <lineSegments geometry={edges} position={[0, 0,0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <lineBasicMaterial color="white" opacity={0.1} transparent />
          </lineSegments>
        )}
  
        <group>
          {blocks.map(block => <primitive key={block.uuid} object={block} />)}
        </group>
      </Controls>
  )
};

export default Overview;