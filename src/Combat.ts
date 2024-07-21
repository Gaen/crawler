import {ICharacter} from './models';
import {rollDamage} from './mechanics';

// region combat log types

export type CombatLog = CombatLogEntry[];

export type CombatLogEntry = {at: number} & (HitEntry);

type HitEntry = {
  type: 'hit',
  source: ICharacter,
  target: ICharacter,
  damage: number,
  hpBefore: number,
  hpAfter: number,
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

    const damage = rollDamage(fighter, enemy);

    enemy.hpCurrent -= damage;
    this._readyAt.set(fighter, readyAt + fighter.cooldown);

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