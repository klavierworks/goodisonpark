import { AdaptiveDpr, Bvh, Preload, PresentationControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import Model from './Model/Model'
import styles from './Stadium.module.pcss'
import Controls from './Controls/Controls'
import { useState } from 'react'

export default function Stadium({ isController, isTarget }: { isController: boolean, isTarget: boolean }) {
  return (
    <>
      <Canvas flat className={styles.canvas} camera={{ position: [0, 0, 0] }}>
        <Bvh>
          <AdaptiveDpr />
          <Preload all />
          <Controls isController={isController} isTarget={isTarget}>
            <Model onItemFocused={() => null} />
          </Controls>
        </Bvh>
      </Canvas>
    </>
  )
}
