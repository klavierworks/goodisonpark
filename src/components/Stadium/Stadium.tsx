import { AdaptiveDpr, Bvh, Preload, PresentationControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import Model from './Model/Model'
import styles from './Stadium.module.pcss'
import Controls from './Controls/Controls'

export default function Stadium({ isController }: { isController: boolean }) {
  return (
    <Canvas flat className={styles.canvas}>
      <Bvh>
        <AdaptiveDpr />
        <Preload all />
        <Controls isController={isController}>
          <Model />
        </Controls>
      </Bvh>
    </Canvas>
  )
}
