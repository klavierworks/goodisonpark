import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import Overview from './Overview/Overview';
import { useEffect, useMemo, useState } from 'react';
import { $currentView } from '../../store/ui';
import { $activeFilters } from '../../store/data';
import useAtomState from '../World/useAtomState';

type Props = {
  className?: string;
  isSplash?: boolean;
}
const SimpleStadium = ({ className, isSplash } : Props) => {
  const [currentView] = useAtomState($currentView);
  const [activeFilters] = useAtomState($activeFilters);

  const isShowingPoints = useMemo(() => {
    const hasActiveFilters = Object.values(activeFilters).length > 0;
    return hasActiveFilters && !isSplash;
  }, [activeFilters, isSplash]);

  const isAutoRotating = useMemo(() => {
    return currentView !== 'space' || isSplash;
  }, [currentView, isSplash]);

  const [hasClosed, setHasClosed] = useState(false);

  useEffect(() => {
    const closeSplash = () => {
      setHasClosed(true);
    };
    if (!isSplash) {
      return;
    }
    document.addEventListener('splashcomplete', closeSplash);
    return () => {
      document.removeEventListener('splashcomplete', closeSplash);
    };
  }, []);

  return (
    <Canvas flat frameloop='demand' className={className} camera={{
      position: [0, 180, -100],
    }}>
      {!hasClosed && (
        <>
          <Preload all />
          <Overview isAutoRotating={isAutoRotating} isShowingPoints={isShowingPoints} />
        </>
      )}
    </Canvas>
  );
}

export default SimpleStadium;