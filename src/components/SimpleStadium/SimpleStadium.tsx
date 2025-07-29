import styles from './SimpleStadium.module.css';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import Overview from './Overview/Overview';
import { useEffect, useMemo, useState } from 'react';
import { $currentView } from '../../store/ui';
import { $activeFilters } from '../../store/data';
import useAtomState from '../World/useAtomState';
import { EffectComposer,  DepthOfField, Bloom } from '@react-three/postprocessing';

type Props = {
  isSplash?: boolean;
}

const SimpleStadium = ({ isSplash } : Props) => {
  return (
    <>
      <Canvas flat frameloop='demand' className={styles.stadium} camera={{
        position: [0, 180, -100],
      }}>
        <Preload all />
        <Overview hasStadium />
      </Canvas>
      <Canvas flat frameloop='demand' className={styles.points} camera={{
        position: [0, 180, -100],
      }}>
        <Preload all />
        <Overview hasPoints />
        <EffectComposer>
          <DepthOfField  
            focusDistance={0}
            bokehScale={2}
          />
          <Bloom
            luminanceThreshold={0.1}
            luminanceSmoothing={0.9}
            intensity={0.4}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </>
  );
}

export default SimpleStadium;