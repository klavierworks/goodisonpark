import { PresentationControls } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useRef, type ReactNode } from "react"
import { Euler, type Group } from "three"

type ControlsProps = {
  children: ReactNode
  isController: boolean
  isTarget: boolean
}

window.modelRotation = new Euler();

const Controls = ({ children, isController, isTarget }: ControlsProps) => {
  const interactiveModelRef = useRef<Group>(null)
  const controlledModelRef = useRef<Group>(null)

  useFrame((state) => {
    if ((!isController || isTarget) || !interactiveModelRef.current?.parent) {
      return;
    }
    window.modelRotation.copy(interactiveModelRef.current.parent.rotation);
  })

  useFrame((state) => {
    if ((isTarget && isController) || !controlledModelRef.current) {
      return;
    }
    controlledModelRef.current.rotation.copy(window.modelRotation);
  })

  if (isTarget && !isController) {
    return (
      <group ref={controlledModelRef}>
        {children}
      </group>
    );
  }

  return (
    <PresentationControls global={true} speed={4} polar={[0, 0]}>
      <group ref={interactiveModelRef}>
        {children}
      </group>
    </PresentationControls>
  )  
}

export default Controls