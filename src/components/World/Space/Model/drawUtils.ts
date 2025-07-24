import { Curve, Vector3 } from "three"
import { ELLIPSIS_X_RADIUS, ELLIPSIS_Y_RADIUS, TILE_DEPTH, TILE_Y_DEPTH } from "../constants"

export const drawStadiumShape = (scale: number = 1): Curve<Vector3> => {
  class XZEllipseCurve extends Curve<Vector3> {
    private xRadius: number;
    private zRadius: number;
    rotation: number = Math.PI / 2;

    constructor(xRadius: number, zRadius: number) {
      super();
      this.xRadius = xRadius;
      this.zRadius = zRadius;
    }
    
    getPoint(t: number): Vector3 {
      const angle = t * Math.PI * 2;
      const x = Math.cos(angle) * this.xRadius;
      const z = Math.sin(angle) * this.zRadius;
      
      // Apply rotation around Y-axis
      const rotatedX = x * Math.cos(this.rotation) - z * Math.sin(this.rotation);
      const rotatedZ = x * Math.sin(this.rotation) + z * Math.cos(this.rotation);
      
      return new Vector3(rotatedX, 0, rotatedZ);
    }
  }
  
  return new XZEllipseCurve(
    ELLIPSIS_X_RADIUS * scale,
    ELLIPSIS_Y_RADIUS * scale
  );
}

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


export const getStadiumSection =(xAngle: number, yLevel: number) => {
  // Determine tier based on yLevel
  let tier: Tier;
  if (yLevel <= 0.33) {
    tier = 'lower';
  } else if (yLevel <= 0.66) {
    tier = 'middle';
  } else {
    tier = 'upper';
  }

  // Determine section based on xAngle
  let section: Section;
  
  if (xAngle >= -Math.PI * 0.25 && xAngle <= Math.PI * 0.25) {
    // Bottom semicircle: -π/4 to π/4
    section = 'bottomSemicircle';
  } else if (xAngle >= Math.PI * 0.25 && xAngle <= Math.PI * 0.75) {
    // Left straight: π/4 to 3π/4
    section = 'leftStraight';
  } else if (xAngle >= Math.PI * 0.75 || xAngle <= -Math.PI * 0.75) {
    // Top semicircle: 3π/4 to π and -π to -3π/4
    section = 'topSemicircle';
  } else {
    // Right straight: -3π/4 to -π/4
    section = 'rightStraight';
  }

  const sections = layout[tier][section];
  
  // If no sections available for this tier/section combination
  if (sections.length === 0) {
    return null;
  }

  // Map the angle to a specific section within the group
  let normalizedPosition: number;
  
  if (section === 'bottomSemicircle') {
    // Map -π/4 to π/4 onto 0 to 1
    normalizedPosition = (xAngle + Math.PI * 0.25) / (Math.PI * 0.5);
  } else if (section === 'leftStraight') {
    // Map π/4 to 3π/4 onto 0 to 1
    normalizedPosition = (xAngle - Math.PI * 0.25) / (Math.PI * 0.5);
  } else if (section === 'topSemicircle') {
    // Handle the wraparound case: 3π/4 to π and -π to -3π/4
    if (xAngle >= Math.PI * 0.75) {
      // 3π/4 to π maps to 0 to 0.5
      normalizedPosition = (xAngle - Math.PI * 0.75) / (Math.PI * 0.25);
    } else {
      // -π to -3π/4 maps to 0.5 to 1
      normalizedPosition = 0.5 + (xAngle + Math.PI) / (Math.PI * 0.25);
    }
  } else { // rightStraight
    // Map -3π/4 to -π/4 onto 0 to 1
    normalizedPosition = (xAngle + Math.PI * 0.75) / (Math.PI * 0.5);
  }

  // Clamp to [0, 1] and map to section index
  normalizedPosition = Math.max(0, Math.min(1, normalizedPosition));
  const sectionIndex = Math.floor(normalizedPosition * sections.length);
  const clampedIndex = Math.min(sectionIndex, sections.length - 1);
  
  return sections[clampedIndex];
}


const distributeInSubsection = (items: Entry[], line: Curve<Vector3>, subsectionStart: number, subsectionEnd: number) => {
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
    if (index % 4 === 0) {
      inwardOffset = -TILE_DEPTH * 5
    }
    if (index % 5 === 0) {
      inwardOffset = TILE_DEPTH * 2
    }
    if (index % 7 === 0) {
      inwardOffset = TILE_DEPTH * 3
    }


    let verticalOffset = index % 3 * TILE_Y_DEPTH / 2
    const normalAngle = Math.atan2(tangent.z, tangent.x)
    const normal = new Vector3(-Math.sin(normalAngle), 0, Math.cos(normalAngle)) // 3D normal
    const offsetPoint = point.clone().add(normal.multiplyScalar(inwardOffset))    
    return {
      ...item,
      point: t,
      position: [offsetPoint.x, verticalOffset, offsetPoint.z],
      rotation: [0, -normalAngle, 0]
    }
  })
}

export const distributeElementsOnStadium = (line: Curve<Vector3>, elements: Entry[], tier: Tier) => {
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
