import {random, scale} from './utils';

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

export interface MonsterSpawnDefinition {
  hp: {min: number, max: number},
  damage: {
    min: {min: number, max: number},
    max: {min: number, max: number},
  },
  cooldown: {min: number, max: number},
}

export interface DungeonLevelDefinition {
  monster: MonsterSpawnDefinition,
  boss: MonsterSpawnDefinition,
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

  private spawn(def: MonsterSpawnDefinition, difficulty: number): CharacterModel {

    const hp = scale(random(def.hp), difficulty);
    const cooldown = scale(random(def.cooldown), difficulty);
    const damage = {
      min: scale(random(def.damage.min), difficulty),
      max: scale(random(def.damage.max), difficulty),
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