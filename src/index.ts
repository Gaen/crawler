#!/usr/bin/env node

import Spawner from './Spawner';
import {CombatLogEntry, FighterModel, simulateCombat, simulateFlee} from './combat';
import {rollPerception} from './mechanics';
import {CharacterModel, GameModel} from './models';
import * as ui from './ui';

function makeFighterModel(character: CharacterModel): FighterModel {
  return {
    def: {
      damage: {
        min: character.damage.min,
        max: character.damage.max,
      },
      cooldown: character.cooldown,
    },
    state: {
      hp: character.hp,
    }
  }
}

function initGame(): GameModel {
  return {
    exit: false,
    location: {type: 'surface'},
    player: {
      hp: 100,
      maxHp: 100,
      damage: {min: 10, max: 20},
      cooldown: 117,
    },
    spawner: new Spawner({
      hp: {min: 50, max: 100},
      damage: {
        min: {min: 5, max: 10},
        max: {min: 10, max: 20},
      },
      cooldown: {min: 100, max: 200},
    }),
  };
}

async function processExit(game: GameModel) {
  console.log('Exiting');
  game.exit = true;
}

async function processPlayerStats(game: GameModel) {
  console.log(`damage:   ${game.player.damage.min} - ${game.player.damage.max}`);
  console.log(`cooldown: ${game.player.cooldown}`);
}

async function processStairs(game: GameModel) {
  await ui.select(
    `Dungeon | hp: ${game.player.hp}`,
    [
      {
        title: 'Surface',
        action: () => game.location = {type: 'surface'},
      },
      {
        title: 'Dungeon level 1',
        action: () => game.location = {type: 'dungeon', level: 1},
      },
      {
        title: 'Dungeon level 2',
        action: () => game.location = {type: 'dungeon', level: 2},
      },
      {
        title: 'Dungeon level 3',
        action: () => game.location = {type: 'dungeon', level: 3},
      },
    ]
  );
}

async function processSurface(game: GameModel) {

  await ui.select(
    `Surface | hp: ${game.player.hp}`,
    [
      {
        title: 'Stairs',
        description: 'Go to stairs',
        action: async () => await processStairs(game),
      },
      {
        title: 'Well',
        description: 'Restore hp',
        action: async () => {
          game.player.hp = game.player.maxHp;
          console.log('You feel refreshed');
        },
      },
      {
        title: 'Stats',
        description: 'Show player stats',
        action: async () => await processPlayerStats(game),
      },
      {
        title: 'Exit',
        description: 'Exit game',
        action: async () => await processExit(game),
      },
    ],
  );
}

async function processDungeon(game: GameModel) {

  if(game.location.type !== 'dungeon')
    throw new Error('Not in dungeon');

  await ui.select(
    `Dungeon ${game.location.level} | hp: ${game.player.hp}`,
    [
      {
        title: 'Explore',
        description: 'Pick a fight',
        action: async () => await processExplore(game),
      },
      {
        title: 'Stairs',
        description: 'Go to stairs',
        action: async () => await processStairs(game),
      },
      {
        title: 'Stats',
        description: 'Show player stats',
        action: async () => await processPlayerStats(game),
      },
      {
        title: 'Exit',
        description: 'Exit game',
        action: async () => await processExit(game),
      },
    ],
  );
}

async function processExplore(game: GameModel) {

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

  if(game.location.type !== 'dungeon')
    throw new Error('Not in dungeon');

  const difficulty = (() => {
    switch (game.location.level) {
      case 1: return 1.0;
      case 2: return 1.2;
      case 3: return 1.5;
      case 4: return 2.0;
      case 5: return 2.5;
      default:
        throw new Error(`Unsupported dungeon level: ${game.location.level}`);
    }
  })();

  const player = makeFighterModel(game.player);
  const monster = makeFighterModel(game.spawner.spawn(difficulty));

  console.log();
  console.log('You see a monster, its stats are:');
  console.log(`hp:       ${monster.state.hp}`);
  console.log(`damage:   ${monster.def.damage.min} - ${monster.def.damage.max}`);
  console.log(`cooldown: ${monster.def.cooldown}`);
  console.log();

  if(rollPerception()) {

    console.log('It didn\'t notice you.');
    console.log();

    await ui.select(
      `Monster | hp: ${game.player.hp}`,
      [
        {
          title: 'Fight',
          description: 'Start a fight',
          action: async () => {
            const log = simulateCombat(player, monster);
            log.forEach(entry => console.log(formatLogEntry(entry)))
            console.log();
          },
        },
        {
          title: 'Retreat',
          description: 'Retreat safely',
          action: async () => {
            console.log('Retreating');
          },
        },
      ],
    );

  } else {

    console.log('It noticed you!');
    console.log();

    await ui.select(
      `Monster | hp: ${game.player.hp}`,
      [
        {
          title: 'Fight',
          description: 'Start a fight',
          action: async () => {
            const log = simulateCombat(player, monster);
            log.forEach(entry => console.log(formatLogEntry(entry)))
            console.log();
          },
        },
        {
          title: 'Flee',
          description: 'Flee and get hit in the back',
          action: async () => {
            const fleeLog = simulateFlee(player, monster);
            fleeLog.forEach(entry => console.log(formatLogEntry(entry)));
            console.log();
          },
        },
      ],
    );
  }

  if(player.state.hp <= 0) {
    console.log('You died and revived at the well');
    console.log();
    game.player.hp = game.player.maxHp;
    game.location = {type: 'surface'};
    return;
  }

  game.player.hp = player.state.hp;

  console.log('You survived!');
  console.log();
  // TODO drop loot, give exp, etc - fight only, not flee
}

(async () => {

  const game = initGame();

  while (true) {

    if(game.exit)
      break;

    switch (game.location.type) {
      case 'surface':
        await processSurface(game);
        break;
      case 'dungeon':
        await processDungeon(game);
        break;
      default:
        throw new Error(`Unsupported location: ${game.location}`);
    }
  }
})();

