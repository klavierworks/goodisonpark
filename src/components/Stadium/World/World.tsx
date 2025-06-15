import { AdaptiveDpr, AdaptiveEvents, Bvh, Preload, useTrail } from '@react-three/drei'
import Model from '../Model/Model'
import Controls from '../Controls/Controls'
import { Suspense, useEffect, useRef, useState } from 'react';
import { $entries } from '../../../store/data';
import { useFrame, useThree } from '@react-three/fiber';
import Fallback from './Fallback';

type WorldProps = {
  isController: boolean;
  isTarget: boolean;
}
const World = ({ isController, isTarget}: WorldProps) => {
  return (
    <Bvh>
      <AdaptiveEvents />
      <AdaptiveDpr />
      <Preload all />
      <Controls isController={true} isTarget={true}>
        <Suspense fallback={<Fallback />}>
          <Model />
        </Suspense>
      </Controls>
    </Bvh>
  );
}

export default World;