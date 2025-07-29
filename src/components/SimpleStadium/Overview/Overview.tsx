import { BufferGeometry, Color, EdgesGeometry, Mesh, MeshBasicMaterial } from "three";
import { $hoveredEntry } from "../../../store/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import StadiumModel from "../../StadiumModel";
import { useThree } from "@react-three/fiber";
import { $activeFilters, $entries, $focusedEntry } from "../../../store/data";

type Props = {
  hasStadium?: boolean;
  hasPoints?: boolean;
}

const Overview = ({ hasStadium, hasPoints }: Props) => {
  const stadiumRef = useRef<Mesh>(null);
  const [edges, setEdges] = useState<BufferGeometry | null>(null);

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
    setBlocks(blockMeshes);
  }, []);

  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!hasPoints) {
      return;
    }

    const updateBlocksVisibility = () => {
      const entries = $entries.get() as Entry[];
      const hoveredEntry = $hoveredEntry.get();
      const hoveredBlock = hoveredEntry ? blocks.find(block => block.name === hoveredEntry.block) : null;
      const focusedEntryId = $focusedEntry.get();
      const focusedEntryBlock = entries.find(entry => entry.id === focusedEntryId)?.block;
      
      const activeFilters = $activeFilters.get();
      const hasActiveFilters = Object.values(activeFilters).length > 0;

      blocks.forEach((block) => {
        const material = block.material as MeshBasicMaterial;
        material.color = new Color(5,5,5);
        material.transparent = true;
        material.opacity = 1;
        block.scale.set(1,1,1)
        
        if (focusedEntryBlock && focusedEntryBlock === block.name) {
          block.scale.set(4,4,4);
          material.visible = true;
        } else if (hoveredBlock && hoveredBlock.name === block.name) {
          block.scale.set(4,4,4);
          material.visible = true;
        } else if (hasActiveFilters) {
          material.visible = entries.find(entry => entry.block === block.name) !== undefined;
        } else {
          material.visible = false;
        }
      });
      invalidate();
    }

    const unsubscribe = $entries.subscribe(() => {
      updateBlocksVisibility();
    });

    const unsubscribeFocus = $focusedEntry.subscribe(() => {
      updateBlocksVisibility();
    });


    const unsubscribeHover = $hoveredEntry.subscribe(() => {
      updateBlocksVisibility();
      console.log('hovered entry changed', $hoveredEntry.get());
    });

    return () => {
      unsubscribe();
      unsubscribeHover();
      unsubscribeFocus();
    };
  }, [blocks, hasPoints]);

  useEffect(() => {
    let raf: number;
    const ADJUSTMENT_Y = Math.PI / -2;
    const ADJUSTMENT_X = -0.5;
    const handleFrame = () => {
      if (!stadiumRef.current || !window.modelRotation) {
        raf = window.requestAnimationFrame(handleFrame);
        return;
      }

      const yRotation = window.modelRotation.y * (Math.PI * 2);
      const xRotation = window.modelRotation.x;
      const y = yRotation + ADJUSTMENT_Y;
      const x = ((xRotation - 0.5) * ADJUSTMENT_X) + 0.4;
      if (y !== stadiumRef.current.rotation.y) {
        stadiumRef.current.rotation.set(x, y, 0);
        invalidate();
      }

      raf = window.requestAnimationFrame(handleFrame);
    }

    raf = window.requestAnimationFrame(handleFrame);
    return () => {
      window.cancelAnimationFrame(raf);
    }
  }, [invalidate]);

  return (
    <group position={[0,20,0]} ref={stadiumRef}>
      <StadiumModel ref={handleRef} visible={false} />
      {hasStadium && (
        <>
          <group rotation={[Math.PI / 2,0,Math.PI / -1.7]} position={[0,0,0]}>
            {edges && (
              <lineSegments geometry={edges} position={[0, 0,0]}>
                <lineBasicMaterial color="white" opacity={0.1} transparent />
              </lineSegments>
            )}
          </group>
        </>
      )}
      {hasPoints && (
        <group rotation={[0,Math.PI ,0]}>
          {blocks.map(block => <primitive key={block.uuid} object={block} />)}
        </group>
      )}
    </group>
  )
};

export default Overview;