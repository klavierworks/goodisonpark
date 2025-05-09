import { getGroupedData, type Data, type DataKey } from "../../../api/api";
import Point from "./Point/Point";

const db = getGroupedData('MEMORY')
const DIAMETER = 40; // Diameter of the circle
const ITEM_COUNT = Object.keys(db).length; // Total number of items

type ModelProps = {
  onItemFocused: (data: [DataKey, Data]) => void;
}

const Model = ({ onItemFocused }: ModelProps) => {
  return (
    <group>
      {Object.entries(db).map((data, index) => {
        // Calculate angle in radians based on index and total count
        const angle = (index / ITEM_COUNT) * Math.PI * 2;
        
        // Calculate x and z coordinates for a circle around the origin
        const x = Math.cos(angle) * (DIAMETER / 2);
        const z = Math.sin(angle) * (DIAMETER / 2);
        
        // Return Point component with proper circular positioning
        return (
          <Point 
            data={data as [DataKey, Data]}
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