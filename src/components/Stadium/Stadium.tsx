import { AdaptiveDpr, Bvh, Preload, PresentationControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import Model from './Model/Model'
import styles from './Stadium.module.pcss'
import Controls from './Controls/Controls'
import { useState } from 'react'
import type { Data, DataKey } from '../../api/api'

export default function Stadium({ isController, isTarget }: { isController: boolean, isTarget: boolean }) {
  const [activeData, setActiveData] = useState<[DataKey, Data] | null>(null)
  return (
    <>
      <Canvas flat className={styles.canvas} camera={{ position: [0, 0, 0] }}>
        <Bvh>
          <AdaptiveDpr />
          <Preload all />
          <Controls isController={isController} isTarget={isTarget}>
            <Model onItemFocused={setActiveData} />
          </Controls>
        </Bvh>
      </Canvas>
      {activeData && (
        <>
          <h2 className={styles.focused}>{activeData[0]}</h2>
          <ul>
            {Object.entries(activeData[1]).map(([key, value]) => (
              <li key={key}>
                <strong>{value.NAME}</strong>: {value.BLOCK} - {value.YEAR}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
