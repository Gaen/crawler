/**
 * Perception roll.
 * @returns true if player wins
 */
export function rollPerception(): boolean {
  // TODO respect player and monster stats
  return Math.random() > 0.5;
}