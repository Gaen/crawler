import {scale} from './utils';

export type GameModel = {
  exit: boolean,
  location: PlayerLocation,
  player: CharacterModel,
  dungeon: DungeonModel,
}

// region character

export type CharacterModel = {
  hp: number,
  maxHp: number,
  damage: {min: number, max: number},
  cooldown: number,
};

// endregion

// region location

export type PlayerLocation = SurfaceLocation | DungeonLocation;

export type SurfaceLocation = {
  type: 'surface',
}

export type DungeonLocation = {
  type: 'dungeon',
  level: number,
}

// endregion

// region dungeon

export interface MonsterDefinition {
  hp: number,
  damage: {
    min: number,
    max: number,
  },
  cooldown: number,
}

export interface DungeonLevelDefinition {
  monster: MonsterDefinition,
  boss: MonsterDefinition,
  difficulty: number,
}

export class DungeonLevelModel {

  constructor(private readonly _def: DungeonLevelDefinition) {}

  public spawnMonster(): CharacterModel {
    return this.spawn(this._def.monster, this._def.difficulty);
  }

  public spawnBoss(): CharacterModel {
    return this.spawn(this._def.monster, this._def.difficulty);
  }

  private spawn(def: MonsterDefinition, difficulty: number): CharacterModel {

    const hp = scale(def.hp, difficulty);
    const cooldown = scale(def.cooldown, difficulty);
    const damage = {
      min: scale(def.damage.min, difficulty),
      max: scale(def.damage.max, difficulty),
    };

    return {
      hp,
      maxHp: hp,
      damage,
      cooldown,
    }
  }
}

export class DungeonModel {

  private readonly _levels = new Map<number, DungeonLevelModel>();

  constructor(levels: Map<number, DungeonLevelDefinition>) {
    levels.forEach((v, k) => this._levels.set(k, new DungeonLevelModel(v)))
  }

  public levels(): number[] {
    return Array.from(this._levels.keys());
  }

  public level(n: number): DungeonLevelModel {

    if(!this._levels.has(n))
      throw new Error(`No such dungeon level: ${n}`);

    return this._levels.get(n)!;
  }
}

// endregion