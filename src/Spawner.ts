import {CharacterModel} from './models';

function random({min, max}: {min: number, max: number}): number {
  return min + Math.round(Math.random() * (max - min));
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

  public spawn(): CharacterModel {

    const hp = random(this._def.hp);
    const cooldown = random(this._def.cooldown);
    const damage = {
      min: random(this._def.damage.min),
      max: random(this._def.damage.max),
    };

    return {
      hp,
      maxHp: hp,
      damage,
      cooldown,
    }
  }
}