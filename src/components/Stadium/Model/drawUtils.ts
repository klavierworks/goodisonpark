import { Curve, EllipseCurve, Vector2, Vector3, type BufferGeometry, type Line } from "three"
import { TILE_DEPTH, TILE_Y_DEPTH } from "../constants"

export const drawStadiumShape = (scale = 1) => {
 return new EllipseCurve( 
    0,0,
    54 * scale,35 * scale,
    0, Math.PI * 2,
    false,
    0
  )
}


type Tier = 'lower' | 'middle' | 'upper'
type Section = 'topSemicircle' | 'leftStraight' | 'bottomSemicircle' | 'rightStraight'

const sections: Record<Section, {start: number, end: number}> = {
  leftStraight: {
    start: 0.12,
    end: 0.35
  },
  topSemicircle: {
    start: 0.35,
    end: 0.62
  },
  rightStraight: {
    start: 0.62,
    end: 0.87
  },
  bottomSemicircle: {
    start: 0.87,
    end: 1.12
  },
}

const layout: Record<Tier, Record<Section, string[]>> = {
  lower: {
    topSemicircle: [
      'PE7', 'PE6', 'PE5', 'PE4', 'PE3', 'PE2', 'PE1',
    ],
    leftStraight: [
      'PK5', 'PK4', 'PK3', 'PK2', 'LV4', 'LV3',
    ],
    bottomSemicircle: [
      'GT1', 'GT2', 'GT3', 'GT4', 'GT5', 'GT6', 'GT7', 'GT8'
    ],
    rightStraight: [
      'FE9', 'FE8', 'FE7', 'FE6', 'FE5', 'FE4', 'FE3', 'FE2', 'FE1'
    ]
  },
  middle: {
    topSemicircle: [],
    leftStraight: [
      'LB6', 'LB5', 'LB4', 'LB3', 'LB2', 'LV2', 'LV1'
    ],
    bottomSemicircle: [
      'GS1', 'GS2', 'GS3', 'GS4', 'GS5',
    ],
    rightStraight: [
      'MS5', 'MS4', 'MS3', 'MS2', 'MS1'
    ]
  },
  upper: {
    topSemicircle: [],
    leftStraight: [
      'UB6', 'UB5', 'UB4', 'UB3', 'UV2', 'UV1',
    ],
    bottomSemicircle: [],
    rightStraight: [
      'TB5', 'TB4', 'TB3', 'TB2', 'TB1'
    ],
  }
}


const distributeInSubsection = (items: Entry[], line: EllipseCurve, subsectionStart: number, subsectionEnd: number) => {
  if (items.length === 0) return []
  
  return items.map((item, index) => {
    let ratio: number
    
    if (items.length === 1) {
      ratio = 0.5 // Center single item
    } else {
      // Distribute evenly with small padding at edges
      const padding = 0.1 // 10% padding on each side
      const usableSpace = 1 - (2 * padding)
      ratio = padding + (index / (items.length - 1)) * usableSpace
    }
    
    const t = subsectionStart + ratio * (subsectionEnd - subsectionStart)
    const point = line.getPoint(t)
    const tangent = line.getTangent(t)

    let inwardOffset = index % 2 * TILE_DEPTH
    if (index % 3 === 0) {
      inwardOffset = -TILE_DEPTH
    }
    if (index % 5 === 0) {
      inwardOffset = TILE_DEPTH * 1.5
    }


    let verticalOffset = index % 3 * TILE_Y_DEPTH
    if (index % 2 === 0) {
      verticalOffset = -TILE_Y_DEPTH
    }
    if (index % 5 === 0) {
      verticalOffset = -TILE_Y_DEPTH * 1.5
    }
    const normalAngle = Math.atan2(tangent.y, tangent.x)
    const normal = new Vector2(-Math.sin(normalAngle), Math.cos(normalAngle))
    const offsetPoint = point.clone().add(normal.multiplyScalar(inwardOffset))
    
    return {
      ...item,
      position: [offsetPoint.x, offsetPoint.y, verticalOffset],
      rotation: [Math.PI / 2, normalAngle, Math.PI]
    }
  })
}

export const distributeElementsOnStadium = (line: EllipseCurve, elements: Entry[], tier: Tier) => {
  const groups = layout[tier]
  
  return Object.entries(groups).flatMap(([sectionName, blockNames]) => {
    const section = sections[sectionName as unknown as Section]
    
    // Skip empty sections
    if (blockNames.length === 0) return []
    
    const sectionLength = section.end - section.start
    const subsectionLength = sectionLength / blockNames.length
    
    return blockNames.flatMap((blockName, blockIndex) => {
      const items = elements.filter(item => item.block === blockName)
      
      // Skip if no items for this block
      if (items.length === 0) return []
      
      const subsectionStart = section.start + (blockIndex * subsectionLength)
      const subsectionEnd = subsectionStart + subsectionLength
      
      return distributeInSubsection(items, line, subsectionStart, subsectionEnd)
    })
  })
}

export const getBlockAtPosition = (x: number, y: number): string | null => {
  // Clamp inputs to valid range
  x = Math.max(0, Math.min(1, x));
  y = Math.max(0, Math.min(1, y));
  
  // Determine tier based on y value
  let tier: Tier;
  if (y < 0.33) {
    tier = 'lower';
  } else if (y < 0.67) {
    tier = 'middle';
  } else {
    tier = 'upper';
  }
  
  // Normalize x to the curve parameter range (0.12 to 1.12)
  const curveParam = 0.12 + x * (1.12 - 0.12);
  
  // Find which section contains this curve parameter
  let currentSection: Section | null = null;
  for (const [sectionName, sectionData] of Object.entries(sections)) {
    if (curveParam >= sectionData.start && curveParam <= sectionData.end) {
      currentSection = sectionName as Section;
      break;
    }
  }
  
  if (!currentSection) return null;
  
  // Get the blocks for this tier and section
  const blocks = layout[tier][currentSection];
  if (blocks.length === 0) return null;
  
  // Calculate which block within the section
  const section = sections[currentSection];
  const relativePosition = (curveParam - section.start) / (section.end - section.start);
  const blockIndex = Math.floor(relativePosition * blocks.length);
  
  // Ensure we don't go out of bounds
  const safeBlockIndex = Math.max(0, Math.min(blockIndex, blocks.length - 1));
  
  return blocks[safeBlockIndex];
}
