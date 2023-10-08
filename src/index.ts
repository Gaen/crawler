#!/usr/bin/env node

import Spawner from './Spawner';
import {CombatLogEntry, Fighter, FighterModel, simulateCombat, simulateFlee} from './combat';
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

  const monster = game.spawner.spawn(difficulty);

  console.log();
  console.log('You see a monster, its stats are:');
  console.log(`hp:       ${monster.hp}`);
  console.log(`damage:   ${monster.damage.min} - ${monster.damage.max}`);
  console.log(`cooldown: ${monster.cooldown}`);
  console.log();

  if(rollPerception())
    await processEncounterUnnoticed(game, monster);
  else
    await processEncounterNoticed(game, monster);
}

async function processEncounterNoticed(game: GameModel, monster: CharacterModel) {

  console.log('It noticed you!');
  console.log();

  await ui.select(
    `Monster | hp: ${game.player.hp}`,
    [
      {
        title: 'Fight',
        description: 'Start a fight',
        action: async () => await processFight(game, monster, false),
      },
      {
        title: 'Flee',
        description: 'Flee and get hit in the back',
        action: async () => await processFlee(game, monster),
      },
    ],
  );
}

async function processEncounterUnnoticed(game: GameModel, monster: CharacterModel) {

  console.log('It didn\'t notice you.');
  console.log();

  await ui.select(
    `Monster | hp: ${game.player.hp}`,
    [
      {
        title: 'Fight',
        description: 'Start a fight',
        action: async () => await processFight(game, monster, true),
      },
      {
        title: 'Retreat',
        description: 'Retreat safely',
        action: async () => await processRetreat(game),
      },
    ],
  );
}

async function processFight(game: GameModel, monster: CharacterModel, playerInitiative: boolean) {

  const playerFighter = makeFighterModel(game.player);
  const monsterFighter = makeFighterModel(monster);

  const log = simulateCombat(playerFighter, monsterFighter, playerInitiative ? Fighter.Player : Fighter.Monster);

  console.log();

  if(playerInitiative)
    console.log('You strike first!');
  else
    console.log('Monster strikes first!');

  console.log();

  log.forEach(entry => console.log(formatLogEntry(entry)))

  console.log();

  if(playerFighter.state.hp <= 0) {
    await processDeath(game);
    return;
  }

  game.player.hp = playerFighter.state.hp;

  console.log('You survived!');
  console.log();

  // TODO drop loot, give exp, etc
}

async function processFlee(game: GameModel, monster: CharacterModel) {

  const playerFighter = makeFighterModel(game.player);
  const monsterFighter = makeFighterModel(monster);

  const log = simulateFlee(playerFighter, monsterFighter);

  console.log();
  log.forEach(entry => console.log(formatLogEntry(entry)));
  console.log();

  if(playerFighter.state.hp <= 0) {
    await processDeath(game);
    return;
  }

  game.player.hp = playerFighter.state.hp;

  console.log('You survived!');
  console.log();
}

async function processRetreat(game: GameModel) {
  console.log('Retreating');
}

async function processDeath(game: GameModel) {
  console.log('You died and revived at the well');
  console.log();
  game.player.hp = game.player.maxHp;
  game.location = {type: 'surface'};
}

function formatLogEntry(entry: CombatLogEntry): string {
  switch (entry.type) {
    case 'hit':
      if(entry.source === Fighter.Player && entry.target === Fighter.Monster)
        return `${String(entry.at).padStart(3)}: You hit monster for ${entry.damage}, hp ${entry.hpBefore} -> ${entry.hpAfter}`;
      if(entry.source === Fighter.Monster && entry.target === Fighter.Player)
        return `${String(entry.at).padStart(3)}: Monster hits you for ${entry.damage}, hp ${entry.hpBefore} -> ${entry.hpAfter}`;
      throw new Error(`Invalid source and target for hit entry`);
    default:
      throw new Error(`Unsupported log entry type: ${(entry as {type: string}).type}`)
  }
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

