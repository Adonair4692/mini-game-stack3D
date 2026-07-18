const EPSILON = 1e-9;

function getAxisSize(block, axis) {
  return axis === 'x' ? block.width : block.depth;
}

/**
 * Calculate one-axis overlap, retained section and cut fragment.
 * Blocks are axis-aligned and represented by center coordinates and dimensions.
 */
export function calculatePlacement(lower, moving, axis, perfectTolerance = 0) {
  if (axis !== 'x' && axis !== 'z') throw new Error('axis must be x or z');

  const lowerSize = getAxisSize(lower, axis);
  const movingSize = getAxisSize(moving, axis);
  const lowerCenter = lower[axis];
  const movingCenter = moving[axis];
  const delta = movingCenter - lowerCenter;

  const lowerMin = lowerCenter - lowerSize / 2;
  const lowerMax = lowerCenter + lowerSize / 2;
  const movingMin = movingCenter - movingSize / 2;
  const movingMax = movingCenter + movingSize / 2;

  if (Math.abs(delta) <= perfectTolerance) {
    return {
      hit: true,
      perfect: true,
      delta,
      overlap: Math.min(lowerSize, movingSize),
      retained: {
        center: lowerCenter,
        size: Math.min(lowerSize, movingSize),
      },
      fragment: null,
    };
  }

  const intersectionStart = Math.max(lowerMin, movingMin);
  const intersectionEnd = Math.min(lowerMax, movingMax);
  const overlap = intersectionEnd - intersectionStart;

  if (overlap <= EPSILON) {
    return {
      hit: false,
      perfect: false,
      delta,
      overlap: 0,
      retained: null,
      fragment: {
        center: movingCenter,
        size: movingSize,
      },
    };
  }

  const retainedCenter = (intersectionStart + intersectionEnd) / 2;
  let fragment = null;

  if (movingCenter >= lowerCenter) {
    const size = movingMax - intersectionEnd;
    if (size > EPSILON) {
      fragment = {
        center: intersectionEnd + size / 2,
        size,
        side: 1,
      };
    }
  } else {
    const size = intersectionStart - movingMin;
    if (size > EPSILON) {
      fragment = {
        center: movingMin + size / 2,
        size,
        side: -1,
      };
    }
  }

  return {
    hit: true,
    perfect: false,
    delta,
    overlap,
    retained: {
      center: retainedCenter,
      size: overlap,
    },
    fragment,
  };
}
/**
 * Calculate a full two-axis placement.
 * Used for milestone blocks that can be displaced on both X and Z.
 */
export function calculatePlacement2D(
  lower,
  moving,
  perfectTolerance = 0,
) {
  const deltaX = moving.x - lower.x;
  const deltaZ = moving.z - lower.z;

  const lowerMinX = lower.x - lower.width / 2;
  const lowerMaxX = lower.x + lower.width / 2;
  const lowerMinZ = lower.z - lower.depth / 2;
  const lowerMaxZ = lower.z + lower.depth / 2;

  const movingMinX = moving.x - moving.width / 2;
  const movingMaxX = moving.x + moving.width / 2;
  const movingMinZ = moving.z - moving.depth / 2;
  const movingMaxZ = moving.z + moving.depth / 2;

  const perfect =
    Math.abs(deltaX) <= perfectTolerance &&
    Math.abs(deltaZ) <= perfectTolerance;

  if (perfect) {
    return {
      hit: true,
      perfect: true,
      deltaX,
      deltaZ,
      retained: {
        x: lower.x,
        z: lower.z,
        width: Math.min(lower.width, moving.width),
        depth: Math.min(lower.depth, moving.depth),
      },
      fragments: [],
    };
  }

  const intersectionMinX = Math.max(lowerMinX, movingMinX);
  const intersectionMaxX = Math.min(lowerMaxX, movingMaxX);
  const intersectionMinZ = Math.max(lowerMinZ, movingMinZ);
  const intersectionMaxZ = Math.min(lowerMaxZ, movingMaxZ);

  const overlapX = intersectionMaxX - intersectionMinX;
  const overlapZ = intersectionMaxZ - intersectionMinZ;

  if (overlapX <= EPSILON || overlapZ <= EPSILON) {
    return {
      hit: false,
      perfect: false,
      deltaX,
      deltaZ,
      retained: null,
      fragments: [
        {
          x: moving.x,
          z: moving.z,
          width: moving.width,
          depth: moving.depth,
        },
      ],
    };
  }

  const retained = {
    x: (intersectionMinX + intersectionMaxX) / 2,
    z: (intersectionMinZ + intersectionMaxZ) / 2,
    width: overlapX,
    depth: overlapZ,
  };

  const fragments = [];

  // First fragment: the portion outside the overlap along X.
  if (movingMaxX > intersectionMaxX + EPSILON) {
    const width = movingMaxX - intersectionMaxX;

    fragments.push({
      x: intersectionMaxX + width / 2,
      z: moving.z,
      width,
      depth: moving.depth,
      axis: 'x',
      side: 1,
    });
  } else if (movingMinX < intersectionMinX - EPSILON) {
    const width = intersectionMinX - movingMinX;

    fragments.push({
      x: movingMinX + width / 2,
      z: moving.z,
      width,
      depth: moving.depth,
      axis: 'x',
      side: -1,
    });
  }

  // Second fragment: the portion outside the overlap along Z.
  // Its width is limited to the retained width to avoid overlapping
  // the first fragment.
  if (movingMaxZ > intersectionMaxZ + EPSILON) {
    const depth = movingMaxZ - intersectionMaxZ;

    fragments.push({
      x: retained.x,
      z: intersectionMaxZ + depth / 2,
      width: retained.width,
      depth,
      axis: 'z',
      side: 1,
    });
  } else if (movingMinZ < intersectionMinZ - EPSILON) {
    const depth = intersectionMinZ - movingMinZ;

    fragments.push({
      x: retained.x,
      z: movingMinZ + depth / 2,
      width: retained.width,
      depth,
      axis: 'z',
      side: -1,
    });
  }

  return {
    hit: true,
    perfect: false,
    deltaX,
    deltaZ,
    retained,
    fragments,
  };
}
