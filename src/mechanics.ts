import {ICharacter} from './models';

export function rollSneakSuccess(attacker: ICharacter, defender: ICharacter): boolean {
  return Math.random() * attacker.perception > Math.random() * defender.perception;
}

export function rollAttackSuccess(attacker: ICharacter, defender: ICharacter): boolean {
  // TODO respect characters stats
  return Math.random() > 0.1;
}

export function rollEvadeSuccess(attacker: ICharacter, defender: ICharacter): boolean {
  // TODO respect characters stats
  return Math.random() > 0.9;
}

export function rollDamage(source: ICharacter, target: ICharacter): number {
  return source.damageMin + Math.round(Math.random() * (source.damageMax - source.damageMin));
}