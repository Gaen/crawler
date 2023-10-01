export enum Fighter {
  Player = 'PLAYER',
  Monster = 'MONSTER',
}

export interface FighterModel {
  readonly def: FighterDefinition,
  readonly state: FighterState,
}

export interface FighterDefinition {
  readonly damage: {
    readonly min: number,
    readonly max: number,
  };
  readonly cooldown: number;
}

export type FighterState = {
  hp: number,
}

// region combat log types

export type CombatLog = CombatLogEntry[];

export type CombatLogEntry = {at: number} & (InitiativeEntry | HitEntry);

type InitiativeEntry = {
  type: 'initiative',
  winner: Fighter,
}

type HitEntry = {
  type: 'hit',
  source: Fighter,
  target: Fighter,
  damage: number,
  hpBefore: number,
  hpAfter: number,
}

// endregion

export function simulateCombat(player: FighterModel, monster: FighterModel): CombatLog {

  let now = 0;
  let playerReadyAt;
  let monsterReadyAt;

  const log = [];

  const initiativeWinner = rollInitiative(player, monster);

  switch (initiativeWinner) {
    case Fighter.Player:
      playerReadyAt = 0;
      monsterReadyAt = monster.def.cooldown;
      break;
    case Fighter.Monster:
      monsterReadyAt = 0;
      playerReadyAt = player.def.cooldown;
      break;
    default:
      throw new Error(`Impossible initiative winner: ${initiativeWinner}`);
  }

  log.push({
    at: now,
    type: 'initiative' as const,
    winner: initiativeWinner,
  });

  let safety = 1000;

  do {

    now = Math.min(playerReadyAt, monsterReadyAt);

    if(playerReadyAt <= now) {

      const damage = rollDamage(player, monster);

      monster.state.hp -= damage;
      playerReadyAt += player.def.cooldown;

      log.push({
        at: now,
        type: 'hit' as const,
        source: Fighter.Player,
        target: Fighter.Monster,
        damage,
        hpBefore: monster.state.hp + damage,
        hpAfter: monster.state.hp,
      });
    }

    if(monsterReadyAt <= now) {

      const damage = rollDamage(monster, player);

      player.state.hp -= damage;
      monsterReadyAt += monster.def.cooldown;

      log.push({
        at: now,
        type: 'hit' as const,
        source: Fighter.Monster,
        target: Fighter.Player,
        damage,
        hpBefore: player.state.hp + damage,
        hpAfter: player.state.hp,
      });
    }

    safety--;

    if(safety < 0)
      throw new Error('Iteration limit exceeded');

  } while (player.state.hp > 0 && monster.state.hp > 0);

  return log;
}

function rollInitiative(player: FighterModel, monster: FighterModel): Fighter {
  // TODO учитывать характеристики
  return Math.random() > 0.5 ? Fighter.Player : Fighter.Monster;
}

function rollDamage(source: FighterModel, target: FighterModel): number {
  // TODO учитывать характеристики
  // принимаем модель а не деф тк на модели могут быть эффекты (бафы)
  const {min, max} = source.def.damage;
  return min + Math.round(Math.random() * (max - min));
}
