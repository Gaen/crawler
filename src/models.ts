import {scale} from './utils';

export type GameModel = {
  exit: boolean,
  location: PlayerLocation,
  player: PlayerModel,
  dungeon: DungeonModel,
}

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

// region character

export interface ICharacter {
  readonly hpMax: number,
  readonly hpCurrent: number,
  readonly damageMin: number,
  readonly damageMax: number,
  readonly cooldown: number,
}

// endregion

// region player

export interface PlayerDefinition {
  hp: number,
  damage: {
    min: number,
    max: number,
  },
  cooldown: number,
}

export class PlayerModel implements ICharacter {

  public hpMax: number;
  public hpCurrent: number;
  public damageMin: number;
  public damageMax: number;
  public cooldown: number;

  constructor(def: PlayerDefinition) {
    this.hpMax = def.hp;
    this.hpCurrent = def.hp;
    this.damageMin = def.damage.min;
    this.damageMax = def.damage.max;
    this.cooldown = def.cooldown;
  }
}

// endregion

// region monster

export interface MonsterVisualDefinition {
  nameShort: string,
  nameIndefinite: string,
  nameDefinite: string,
}

export interface MonsterDefinition {
  visual: MonsterVisualDefinition,
  hp: number,
  damage: {
    min: number,
    max: number,
  },
  cooldown: number,
}

export class MonsterVisualModel {

  constructor(private readonly _def: MonsterVisualDefinition) {}

  get nameShort() { return this._def.nameShort }
  get nameIndefinite() { return this._def.nameIndefinite }
  get nameDefinite() { return this._def.nameDefinite }
}

export class MonsterModel implements ICharacter {

  public readonly visual: MonsterVisualModel;

  private readonly _def: MonsterDefinition;
  private readonly _multiplier: number;

  constructor(def: MonsterDefinition, multiplier: number = 1) {
    this._def = def;
    this._multiplier = multiplier;
    this.visual = new MonsterVisualModel(def.visual);
  }

  public get hpMax() { return scale(this._def.hp, this._multiplier) }
  public get hpCurrent() { return scale(this._def.hp, this._multiplier) };
  public get damageMin() { return scale(this._def.damage.min, this._multiplier) };
  public get damageMax() { return scale(this._def.damage.max, this._multiplier) };
  public get cooldown() { return scale(this._def.cooldown, this._multiplier) };
}

// endregion

// region dungeon

export interface DungeonLevelDefinition {
  monster: MonsterDefinition,
  boss: MonsterDefinition,
  difficulty: number,
}

export class DungeonLevelModel {

  constructor(private readonly _def: DungeonLevelDefinition) {}

  public spawnMonster(): MonsterModel {
    return new MonsterModel(this._def.monster, this._def.difficulty);
  }

  public spawnBoss(): MonsterModel {
    return new MonsterModel(this._def.boss, this._def.difficulty);
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