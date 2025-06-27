import { BufferGeometry, Color, EdgesGeometry, Mesh, MeshBasicMaterial } from "three";
import { $hoveredEntry } from "../../../store/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import StadiumModel from "../../StadiumModel";
import { useFrame, useThree } from "@react-three/fiber";
import { $activeFilters, $allEntries, $entries } from "../../../store/data";
import type { Group } from "three";
import useAtomState from "../../World/useAtomState";

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

    const blockMeshes: Mesh[] = [];
    node.traverse((child) => {
      if (child instanceof Mesh) {
        child.material = new MeshBasicMaterial({
          color: new Color(0xffffff),
        })
      }
      if (child instanceof Mesh && child.name !== 'GoodisonFull') {
        const block = child.clone(); 
        block.scale.set(4,4,4);
        blockMeshes.push(block);
      }
    });
    setEdges(
      new EdgesGeometry(stadium.geometry.clone(), 15)
    );
    setNode(node);
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

  const [hoveredEntry] = useAtomState($hoveredEntry);
  const [activeFilters] = useAtomState($activeFilters);

  useEffect(() => {
    if (hoveredEntry) {
      updateActiveMemory(hoveredEntry?.memory);
    }
    updateActiveMemory(activeFilters.memory);
  }, [hoveredEntry, activeFilters]);

  useEffect(() => {
    if (!isShowingPoints) {
      return;
    }

    const updateBlocksVisibility = () => {
      const entries = $entries.get() as Entry[];
      const hoveredEntry = $hoveredEntry.get();
      const hoveredBlock = hoveredEntry ? blocks.find(block => block.name === hoveredEntry.block) : null;
      blocks.forEach((block) => {
        (block.material as MeshBasicMaterial).color = new Color(0xffffff);
        block.scale.set(4,4,4);
        if (hoveredBlock && hoveredBlock.name === block.name) {
          block.scale.set(8,8,8);
        }
        (block.material as MeshBasicMaterial).visible = entries.find(entry => entry.block === block.name) !== undefined;
      });
      invalidate();
    }

    const unsubscribe = $entries.subscribe(() => {
      updateBlocksVisibility();
    });

    const unsubscribeHover = $hoveredEntry.subscribe(() => {
      updateBlocksVisibility();
    });

    return () => {
      unsubscribe();
      unsubscribeHover();
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

  useEffect(() => {
    if (isAutoRotating) {
      return;
    }

    let raf: number;
    const ADJUSTMENT_Y = Math.PI / -2;
    const handleFrame = () => {
      if (!introRef.current || !window.modelRotation) {
        raf = window.requestAnimationFrame(handleFrame);
        return;
      }

      const yRotation = window.modelRotation * (Math.PI * 2);
      const y = yRotation + ADJUSTMENT_Y;
      if (y !== introRef.current.rotation.y) {
        introRef.current.rotation.set(0, y, 0);
        invalidate();
      }

      raf = window.requestAnimationFrame(handleFrame);
    }

    raf = window.requestAnimationFrame(handleFrame);
    return () => {
      window.cancelAnimationFrame(raf);
    }
  }, [isAutoRotating, invalidate]);

  return (
    <group position={[0,20,0]} ref={introRef}>
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
    </group>
  )
};

export default Overview;