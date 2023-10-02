import {CharacterModel} from './models';

function random({min, max}: {min: number, max: number}): number {
  return min + Math.round(Math.random() * (max - min));
}

function scale(value: number, multiplier: number): number {
  return Math.round(value * multiplier);
}

export type MonsterSpawnDefinition = {
  hp: {min: number, max: number},
  damage: {
    min: {min: number, max: number},
    max: {min: number, max: number},
  },
  cooldown: {min: number, max: number},
};

export default class Spawner {

  constructor(private readonly _def: MonsterSpawnDefinition) {}

  public spawn(difficulty: number): CharacterModel {

    const hp = scale(random(this._def.hp), difficulty);
    const cooldown = scale(random(this._def.cooldown), difficulty);
    const damage = {
      min: scale(random(this._def.damage.min), difficulty),
      max: scale(random(this._def.damage.max), difficulty),
    };

    return {
      hp,
      maxHp: hp,
      damage,
      cooldown,
    }
  }
}