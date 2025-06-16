import { Html, OrbitControls, PresentationControls, Sphere } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { Euler, type Group } from "three"
import { useDrag } from '@use-gesture/react'
import { useSpring } from "@react-spring/core"
import styles from "./Controls.module.css"

type ControlsProps = {
  children: ReactNode
  isController: boolean
  isTarget: boolean
}

window.modelRotation = {
  x: 0,
  y: 0,
}

const Controls = ({ children, isController, isTarget }: ControlsProps) => {
  const controlsTargetRef = useRef<Group>(null)
  const interactiveModelRef = useRef<Group>(null)

  useFrame(() => {
    if (!isController || !controlsTargetRef.current?.parent) {
      return;
    }

    window.modelRotation = {
      x: controlsTargetRef.current.parent.rotation.y % (Math.PI * 2),
      y: controlsTargetRef.current.parent.rotation.x,
    }
    if (window.modelRotation.x < 0) {
      window.modelRotation.x = window.modelRotation.x + (Math.PI * 2);
    }
  })

  useFrame((state) => {
    if (isController || !interactiveModelRef.current) {
      return;
    }
    interactiveModelRef.current.rotation.set(
      0,
      window.modelRotation.x + Math.PI / -2,
      0,
    )
  })

  return (
    <>
      <PresentationControls global={true} speed={4} polar={[0, 1]} rotation={[0, Math.PI / 3, 0]}>
        <group ref={controlsTargetRef}>
          <Sphere args={[1, 1, 1]} scale={1} visible={false} />
        </group>
      </PresentationControls>
      <group ref={interactiveModelRef} name="contents">
        {children}
      </group>
    </>
  )  
}

export default Controls