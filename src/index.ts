import {
  FighterModel,
  CombatLogEntry,
  simulateCombat,
} from './combat';

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