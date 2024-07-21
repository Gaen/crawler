import {ICharacter} from './models';

/**
 * Perception roll.
 * @returns true if player wins
 */
export function rollPerception(): boolean {
  // TODO respect player and monster stats
  return Math.random() > 0.5;
}

export function rollHit(source: ICharacter, target: ICharacter): boolean {
  // TODO respect characters stats
  return Math.random() > 0.1;
}

export function rollDamage(source: ICharacter, target: ICharacter): number {
  return source.damageMin + Math.round(Math.random() * (source.damageMax - source.damageMin));
}