import {ICharacter} from './models';

/**
 * Sneak roll.
 * @returns true source has been able to sneak on target
 */
export function rollSneak(source: ICharacter, target: ICharacter): boolean {
  return Math.random() * source.perception > Math.random() * target.perception;
}

export function rollHit(source: ICharacter, target: ICharacter): boolean {
  // TODO respect characters stats
  return Math.random() > 0.1;
}

export function rollDamage(source: ICharacter, target: ICharacter): number {
  return source.damageMin + Math.round(Math.random() * (source.damageMax - source.damageMin));
}