import {CombatLogEntry, FighterModel, simulateCombat} from './combat';

const prompts = require('prompts');

enum PlayerLocation {
  Surface = 'SURFACE',
  Dungeon = 'DUNGEON',
}

type Game = {
  exit: boolean,
  location: PlayerLocation,
  player: {
    hp: number,
    damage: {min: number, max: number},
    cooldown: number,
  }
}

function initGame(): Game {
  return {
    exit: false,
    location: PlayerLocation.Surface as PlayerLocation,
    player: {
      hp: 100,
      damage: {min: 10, max: 20},
      cooldown: 117,
    }
  };
}

async function processSurface(game: Game) {

  const {value} = await prompts({
    message: `Surface | hp: ${game.player.hp}`,
    name: 'value',
    type: 'select',
    choices: [
      {title: 'Dungeon', description: 'Go to dungeon', value: 'dungeon'},
      {title: 'Exit', description: 'Exit game', value: 'exit'},
    ],
  });

  switch (value) {
    case 'dungeon':
      console.log('Descending to dungeon');
      game.location = PlayerLocation.Dungeon;
      break;
    case 'exit':
      console.log('Exiting');
      game.exit = true;
      break;
    default:
      throw new Error(`Unsupported choice: ${value}`);
  }
}

async function processDungeon(game: Game) {

  const {value} = await prompts({
    message: `Dungeon | hp: ${game.player.hp}`,
    name: 'value',
    type: 'select',
    choices: [
      {title: 'Explore', description: 'Pick a fight', value: 'explore'},
      {title: 'Surface', description: 'Go to surface', value: 'surface'},
      {title: 'Exit', description: 'Exit game', value: 'exit'},
    ],
  });

  switch (value) {
    case 'explore':
      await processExplore(game);
      break;
    case 'surface':
      console.log('Ascending to surface');
      game.location = PlayerLocation.Surface;
      break;
    case 'exit':
      console.log('exiting');
      return;
    default:
      throw new Error(`Unsupported choice: ${value}`);
  }
}

async function processExplore(game: Game) {

  const player: FighterModel = {
    def: {
      damage: game.player.damage,
      cooldown: game.player.cooldown,
    },
    state: {
      hp: game.player.hp,
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

  console.log();
  console.log('You meet a monster, its stats are:');
  console.log(`hp:       ${monster.state.hp}`);
  console.log(`damage:   ${monster.def.damage.min} - ${monster.def.damage.max}`);
  console.log(`cooldown: ${monster.def.cooldown}`);
  console.log();

  const log = simulateCombat(player, monster);

  log.forEach(entry => console.log((() => {
    switch (entry.type) {
      case 'initiative':
        return `at ${String(entry.at).padStart(3)} ${entry.winner} wins initiative`;
      case 'hit':
        return `at ${String(entry.at).padStart(3)} ${entry.source} hits ${entry.target} for ${entry.damage}, hp ${entry.hpBefore} -> ${entry.hpAfter}`;
      default:
        throw new Error(`Unsupported log entry type: ${(entry as {type: string}).type}`)
    }
  })()));

  console.log();

  if(player.state.hp <= 0) {
    console.log('You died and revived at the surface');
    game.player.hp = 100;
    game.location = PlayerLocation.Surface;
    return;
  }

  game.player.hp = player.state.hp;

  console.log('You survived!');
  // TODO drop loot, give exp, etc
}

(async () => {

  const game = initGame();

  while (true) {

    if(game.exit)
      break;

    switch (game.location) {
      case PlayerLocation.Surface:
        await processSurface(game);
        break;
      case PlayerLocation.Dungeon:
        await processDungeon(game);
        break;
      default:
        throw new Error(`Unsupported location: ${game.location}`);
    }
  }
})();

