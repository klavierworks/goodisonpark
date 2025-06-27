import { useCursor, useTexture } from "@react-three/drei";
import { ASSET_URL } from "astro:env/client";
import Outline from "./Outline/Outline";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Group, MeshBasicMaterial, type Sprite } from "three";
import Thumbnail from "./Thumbnail/Thumbnail";
import useAtomState from "../useAtomState";
import { $entries } from "../../../store/data";
import { config, useSpring } from "@react-spring/core";
import { useFrame, useThree } from "@react-three/fiber";
import { $hoveredEntry, $hoveredWithIntentionEntryId, $isTransitioning, $selectedEntry } from "../../../store/ui";

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
  const isHoveredWithIntention = hoveredWithIntentionEntryId === entry.id;

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
  const [pointerHoverSpring] = useSpring(() => ({
    x: 0,
    y: 0,
    config: config.stiff,
  }), []);

  const pointerAttributes = useMemo(() => canInteract ? ({
    onPointerOver: (e) => {
      const closestObjectUuid = e.intersections[0].object.uuid;
      
      if (!spriteRef.current || spriteRef.current.uuid !== closestObjectUuid) {
        return;
      }

      setIsHovered(true);
    },
    onPointerOut: () => {
      setIsHovered(false);
      $hoveredWithIntentionEntryId.set(null);
    },
    onPointerDown: (e) => {
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
    onPointerMove: (e) => {
      pointerDownPosition.current.movementX += e.movementX;
      pointerDownPosition.current.movementY += e.movementY;
      pointerHoverSpring.x.start(e.uv.x);
      pointerHoverSpring.y.start(e.uv.y);
    },
    onPointerUp: (e) => {
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
  const spring = useSpring({
    x: isVisible && isActive ? entry.thumbnail.width : 0,
    y: isVisible && isActive ? entry.thumbnail.height : 0,
    opacity: !isHoveredWithIntention && hoveredWithIntentionEntryId ? 0 : 1,
    onChange: () => {
      invalidate()
    }
  })

  const [isTransitioning] = useAtomState($isTransitioning);
  useEffect(() => {
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
    const opacity = spring.opacity.get();
    if (currentScale.x === x && currentScale.y === y && spriteRef.current.material.opacity === opacity) {
      return;
    }
    spriteRef.current.material.opacity = opacity;
    spriteRef.current.scale.set(spring.x.get(), spring.y.get(), 1);
    invalidate();
  });

  const groupRef = useRef<Group>(null);
  useFrame(({ scene }) => {
    if (!isHoveredWithIntention) {
      groupRef.current?.rotation.set(0, 0, 0);
      return;
    }

    if (!groupRef.current) {
      return;
    }

    const x = pointerHoverSpring.y.get() * 2 - 1;
    const y = pointerHoverSpring.x.get() * 2 - 1;

    groupRef.current.rotation.set(
      -0.25 * x,
      0.25 * y,
      0
    );
  });

  return (
    <group ref={groupRef} {...rest} {...pointerAttributes}>
      <mesh
        ref={spriteRef}
        name={entry.id}
        scale={[entry.thumbnail.width, entry.thumbnail.height, 1]}
        >
        <planeGeometry args={[1, 1]} />
        <Suspense fallback={<></>}>
          <Thumbnail filename={entry.filename} isHovered={isHoveredWithIntention} />
        </Suspense>
      </mesh>
      <Outline entry={entry} isHovered={isHovered} spriteRef={spriteRef} />
      <group name={`${entry.id}--related`}>
        {isHoveredWithIntention && entries.filter(e => e.memory === entry.memory && e.id !== entry.id && e.thumbnail.height < entry.thumbnail.height).sort((a,b) => a.thumbnail.height > b.thumbnail.height ? 1 : 0).map((relatedEntry, index) => (
          <mesh
            key={relatedEntry.id}
            name={`${entry.id}--related-${relatedEntry.id}`}
            scale={[entry.thumbnail.width, entry.thumbnail.height, 1]}
            position={[0,0,-150 * (index + 1)]}
            >
            <planeGeometry args={[1, 1]} />
            <Suspense fallback={<></>}>
              <Thumbnail filename={relatedEntry.filename} isHovered={false} opacity={0.7} />
            </Suspense>
          </mesh>
        ))}
      </group>
    </group>
  )
}

export default Tile;