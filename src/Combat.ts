import {ICharacter} from './models';
import {rollDamage, rollAttackSuccess, rollEvadeSuccess} from './mechanics';

// region combat log types

export type CombatLog = CombatLogEntry[];

export type CombatLogEntry = {at: number} & (HitEntry | MissEntry | EvadeEntry);

type HitEntry = {
  type: 'hit',
  source: ICharacter,
  target: ICharacter,
  damage: number,
  hpBefore: number,
  hpAfter: number,
}

type MissEntry = {
  type: 'miss',
  source: ICharacter,
  target: ICharacter,
}

type EvadeEntry = {
  type: 'evade',
  source: ICharacter,
  target: ICharacter,
}

// endregion

export class Combat {

  private _fighters: ICharacter[];
  private _readyAt = new Map<ICharacter, number>();
  private _log: CombatLog = [];

  constructor(fighters: ICharacter[], initiator: ICharacter) {
    this._fighters = fighters;
    this._fighters.forEach(fighter => this._readyAt.set(fighter, fighter === initiator ? 0 : fighter.cooldown));
  }

  public canContinue(): boolean {
    return this._fighters.every(fighter => fighter.hpCurrent > 0);
  }

  public tick() {

    const [fighter, readyAt] = this.findNextHit();
    const enemy = this.getEnemy(fighter);

    if (!rollAttackSuccess(fighter, enemy)) {
      this._log.push({
        at: readyAt,
        type: 'miss' as const,
        source: fighter,
        target: enemy,
      });
    } else if (rollEvadeSuccess(fighter, enemy)) {
      this._log.push({
        at: readyAt,
        type: 'evade' as const,
        source: fighter,
        target: enemy,
      });
    } else {

      const damage = rollDamage(fighter, enemy);

      enemy.hpCurrent -= damage;

      this._log.push({
        at: readyAt,
        type: 'hit' as const,
        source: fighter,
        target: enemy,
        damage,
        hpBefore: enemy.hpCurrent + damage,
        hpAfter: enemy.hpCurrent,
      });
    }

    this._readyAt.set(fighter, readyAt + fighter.cooldown);
  }

  public getLog() {
    return this._log;
  }

  private findNextHit() {
    return Array.from(this._readyAt.entries()).reduce((acc, cur) => acc[1] < cur[1] ? acc : cur);
  }

  private getEnemy(fighter: ICharacter): ICharacter {

    if (!this._fighters.includes(fighter))
      throw new Error('Not a fight participant');

    const enemy = this._fighters.find(f => f !== fighter);

    if (!enemy)
      throw new Error('Enemy not found');

    return enemy;
  }
}