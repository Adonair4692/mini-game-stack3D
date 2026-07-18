/** Return true when a numbered block is a milestone block. */
export function isMilestoneBlock(blockNumber, everyBlocks = 5) {
  if (!Number.isInteger(blockNumber) || blockNumber < 1) return false;
  if (!Number.isInteger(everyBlocks) || everyBlocks < 1) return false;
  return blockNumber % everyBlocks === 0;
}

/** Calculate the uncapped regular height for a numbered block. */
export function getRegularHeightCm(blockNumber, blockConfig) {
  if (!Number.isInteger(blockNumber) || blockNumber < 1) {
    throw new RangeError('blockNumber must be a positive integer');
  }

  const raw =
    blockConfig.initialHeightCm +
    (blockNumber - 1) * blockConfig.increasePerPlacedBlockCm;

  if (blockConfig.maximumRegularHeightCm == null) return Math.round(raw);
  return Math.round(Math.min(raw, blockConfig.maximumRegularHeightCm));
}

/** Calculate the actual block height, including milestone multiplication. */
export function getBlockHeightCm(blockNumber, blockConfig, milestoneConfig) {
  const regular = getRegularHeightCm(blockNumber, blockConfig);
  return isMilestoneBlock(blockNumber, milestoneConfig.everyBlocks)
    ? Math.round(regular * milestoneConfig.heightMultiplier)
    : regular;
}

/** Convert logical centimetres to rendering/physics world units. */
export function cmToWorld(cm, worldUnitsPerCm) {
  if (!Number.isFinite(cm) || cm < 0) throw new RangeError('cm must be non-negative');
  if (!Number.isFinite(worldUnitsPerCm) || worldUnitsPerCm <= 0) {
    throw new RangeError('worldUnitsPerCm must be positive');
  }
  return cm * worldUnitsPerCm;
}

/** Calculate regular movement speed for the next block. */
export function getCurrentSpeed(placedBlocks, movementConfig) {
  const speed =
    movementConfig.initialSpeed +
    placedBlocks * movementConfig.speedIncreasePerPlacedBlock;
  return Math.min(speed, movementConfig.maximumSpeed);
}

/** Calculate actual movement speed, including a temporary milestone slowdown. */
export function getBlockSpeed(blockNumber, placedBlocks, movementConfig, milestoneConfig) {
  const regular = getCurrentSpeed(placedBlocks, movementConfig);
  return isMilestoneBlock(blockNumber, milestoneConfig.everyBlocks)
    ? regular * milestoneConfig.speedMultiplier
    : regular;
}

/** Integer-safe accumulation of the height score. */
export function addHeightCm(totalHeightCm, blockHeightCm) {
  return Math.round(totalHeightCm) + Math.round(blockHeightCm);
}
