import Point from "./Point/Point";

const DIAMETER = 40;
const ITEM_COUNT = 10

type ModelProps = {
  onItemFocused: () => void;
}

const Model = ({ onItemFocused }: ModelProps) => {
  return (
    <group>
      {[].map((data, index) => {
        // Calculate angle in radians based on index and total count
        const angle = (index / ITEM_COUNT) * Math.PI * 2;
        
        // Calculate x and z coordinates for a circle around the origin
        const x = Math.cos(angle) * (DIAMETER / 2);
        const z = Math.sin(angle) * (DIAMETER / 2);
        
        // Return Point component with proper circular positioning
        return (
          <Point 
            data={data}
            key={index} 
            position={[x, 0, z]}
            onItemFocused={onItemFocused}
          />
        );
      })}
    </group>
  )
}

export default Model;