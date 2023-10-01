enum Fighter {
  Player = 'PLAYER',
  Monster = 'MONSTER',
}

interface FighterModel {
  readonly def: FighterDefinition,
  readonly state: FighterState,
}

interface FighterDefinition {
  readonly damage: {
    readonly min: number,
    readonly max: number,
  };
  readonly cooldown: number;
}

type FighterState = {
  hp: number,
}

// region combat log types

type CombatLog = CombatLogEntry[];

type CombatLogEntry = {at: number} & (InitiativeEntry | HitEntry);

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

function simulateCombat(player: FighterModel, monster: FighterModel): CombatLog {

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

///

function formatLogEntry(entry: CombatLogEntry): string {
  switch (entry.type) {
    case 'initiative':
      return `at ${String(entry.at).padStart(3)} ${entry.winner} wins initiative`;
    case 'hit':
      return `at ${String(entry.at).padStart(3)} ${entry.source} hits ${entry.target} for ${entry.damage}, hp ${entry.hpBefore} -> ${entry.hpAfter}`;
    default:
      throw new Error(`Unsupported log entry type: ${(entry as {type: string}).type}`)
  }
}

///

const player: FighterModel = {
  def: {
    damage: {min: 10, max: 20},
    cooldown: 117,
  },
  state: {
    hp: 100,
  }
}

const monster: FighterModel = {
  def: {
    damage: {min: 10, max: 15},
    cooldown: 131,
  },
  state: {
    hp: 100,
  }
}

console.log('Player before fight:', player);
console.log('Monster before fight:', monster);

console.log();

const log = simulateCombat(player, monster);
log.forEach(entry => console.log(formatLogEntry(entry)));

console.log();

console.log('Player after fight:', player);
console.log('Monster after fight:', monster);