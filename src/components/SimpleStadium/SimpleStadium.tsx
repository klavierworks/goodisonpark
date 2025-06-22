import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import Overview from './Overview/Overview';

type Props = {
  autoRotate?: boolean;
  className?: string;
  isShowingPoints?: boolean;
}
const SimpleStadium = ({ autoRotate, className, isShowingPoints } : Props) => {
  if (window.innerWidth < 600 && !autoRotate) {
    return null; // Hide the component on small screens
  }

  return (
    <Canvas flat frameloop='demand' className={className} camera={{
      position: [0, 180, -100],
    }}>
      <Preload all />
      <ambientLight intensity={10} />
      <directionalLight position={[0, 10, 0]} intensity={10} />
      <Overview autoRotate={autoRotate} isShowingPoints={isShowingPoints} />
    </Canvas>
  );
}

export default SimpleStadium;