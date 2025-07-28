import { useCursor } from "@react-three/drei";
import Outline from "./Outline/Outline";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Group, MeshBasicMaterial, type Sprite } from "three";
import Thumbnail from "./Thumbnail/Thumbnail";
import useAtomState from "../useAtomState";
import { $entries } from "../../../store/data";
import { config, useSpring } from "@react-spring/core";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { $currentView, $hoveredEntry, $hoveredWithIntentionEntryId, $isTransitioning } from "../../../store/ui";
import { tileGeometry } from "../../../store/textureCache";

type TileProps = {
  canInteract?: boolean;
  entry: Entry
  isActive?: boolean;
  onClick?: (entry: Entry) => void;
} & React.ComponentPropsWithoutRef<'group'>;

const INTENTION_PAUSE = 1000; // ms
const Tile = ({ canInteract = true, entry, isActive = true, onClick, ...rest }: TileProps) => {
  const spriteRef = useRef<Sprite>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [hoveredWithIntentionEntryId] = useAtomState($hoveredWithIntentionEntryId);
  const [isTransitioning] = useAtomState($isTransitioning);
  const isHoveredWithIntention = hoveredWithIntentionEntryId === entry.id && !isTransitioning;

  useFrame(({ invalidate }) => {
    if (isHoveredWithIntention) {
      invalidate();
    }
  });

  useEffect(() => {
    if (!isHovered || !canInteract) {
      return;
    }
    $hoveredEntry.set(entry);
    let timer = setTimeout(() => {
      $hoveredWithIntentionEntryId.set(entry.id);
    }, INTENTION_PAUSE);
    return () => {
      $hoveredEntry.set(null);
      $hoveredWithIntentionEntryId.set(null);
      clearTimeout(timer);
    }
  }, [isHovered, entry]);

  const isTouchDevice = useMemo(() => window.matchMedia('(pointer: coarse)').matches, []);
  const pointerDownPosition = useRef<{ movementX: number, movementY: number }>({
    movementX: 0,
    movementY: 0,
  });

  const pointerDownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const pointerAttributes = useMemo(() => canInteract ? ({
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      const closestObjectUuid = e.intersections[0].object.uuid;
      
      const isNear = $currentView.get() === 'grid' || e.distance < 100;
      if (!spriteRef.current || spriteRef.current.uuid !== closestObjectUuid || !isNear) {
        return;
      }

      setIsHovered(true);
    },
    onPointerOut: () => {
      setIsHovered(false);
      $hoveredWithIntentionEntryId.set(null);
    },
    onPointerDown: () => {
      if (isTouchDevice) {
        setIsHovered(true);
      }

      pointerDownPosition.current = {
        movementX: 0,
        movementY: 0,
      };

      if (onClick && (isHovered && !isTouchDevice)) {
        onClick(entry);
      }
      pointerDownTimerRef.current = setTimeout(() => {
        if (pointerDownPosition.current.movementX > 5 || pointerDownPosition.current.movementY > 5) {
          return;
        }
        $hoveredWithIntentionEntryId.set(entry.id);
      }, INTENTION_PAUSE);
    },
    onPointerUp: () => {
      const isTap = Math.abs(pointerDownPosition.current.movementX) < 5 && Math.abs(pointerDownPosition.current.movementY) < 5;
      clearTimeout(pointerDownTimerRef.current as NodeJS.Timeout);
      if (onClick && isTouchDevice && isTap) {
        setIsHovered(false);

        // Hack: we're getting double pointerUp events on mobile, so we need to debounce the click
        window.setTimeout(() => {
          onClick(entry);
        }, 150);
      }
    }
  }) : null, [isHovered]);

  useCursor(isHovered, 'pointer', 'auto');

  const [entries] = useAtomState($entries);

  const isVisible = useMemo(() => {
    return entries.some(e => e.id === entry.id);
  }, [entries, entry.id]);

  const invalidate = useThree((state) => state.invalidate);
  const [spring] = useSpring(() => ({
    x: isVisible && isActive ? entry.thumbnail.width : 0,
    y: isVisible && isActive ? entry.thumbnail.height : 0,
    onChange: () => {
      invalidate()
    }
  }), [isVisible, isActive, entry.thumbnail.width, entry.thumbnail.height]);

  useEffect(() => {
    if (!isHovered) {
      return;
    }
    setIsHovered(false);
    $hoveredWithIntentionEntryId.set(null);
  }, [isTransitioning]);

  useFrame(() => {
    if (!spriteRef.current) {
      return;
    }

    const x = spring.x.get();
    const y = spring.y.get();

    const currentScale = spriteRef.current.scale;
    if (currentScale.x === x && currentScale.y === y) {
      return;
    }
    spriteRef.current.scale.set(spring.x.get(), spring.y.get(), 1);
    invalidate();
  });

  const groupRef = useRef<Group>(null);

  return (
    <group ref={groupRef} {...rest} {...pointerAttributes}>
      <mesh
        ref={spriteRef}
        name={entry.id}
        scale={[entry.thumbnail.width, entry.thumbnail.height, 1]}
        >
        <primitive object={tileGeometry} attach="geometry" />
        <Suspense fallback={<></>}>
          <Thumbnail filename={entry.id} isHovered={isHoveredWithIntention} />
        </Suspense>
      </mesh>
      <Outline entry={entry} isHovered={isHovered} spriteRef={spriteRef} />
    </group>
  )
}

export default Tile;