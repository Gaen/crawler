#!/usr/bin/env node

import Spawner from './Spawner';

const prompts = require('prompts');

import {CombatLogEntry, FighterModel, simulateCombat, simulateFlee} from './combat';
import {rollPerception} from './mechanics';
import {CharacterModel, GameModel} from './models';

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

async function showPlayerStats(game: GameModel) {
  console.log(`damage:   ${game.player.damage.min} - ${game.player.damage.max}`);
  console.log(`cooldown: ${game.player.cooldown}`);
}

async function processStairs(game: GameModel) {

  const {value} = await prompts({
    message: `Dungeon | hp: ${game.player.hp}`,
    name: 'value',
    type: 'select',
    choices: [
      {title: 'Surface', value: 'surface'},
      {title: 'Dungeon level 1', value: 'd1'},
      {title: 'Dungeon level 2', value: 'd2'},
      {title: 'Dungeon level 3', value: 'd3'},
      {title: 'Dungeon level 4', value: 'd4', disabled: true},
      {title: 'Dungeon level 5', value: 'd5', disabled: true},
    ],
  });

  switch (value) {
    case 'surface':
      game.location = {type: 'surface'};
      break;
    case 'd1':
      game.location = {type: 'dungeon', level: 1};
      break;
    case 'd2':
      game.location = {type: 'dungeon', level: 2};
      break;
    case 'd3':
      game.location = {type: 'dungeon', level: 3};
      break;
    case 'd4':
      game.location = {type: 'dungeon', level: 4};
      break;
    case 'd5':
      game.location = {type: 'dungeon', level: 5};
      break;
  }
}

async function processSurface(game: GameModel) {

  const {value} = await prompts({
    message: `Surface | hp: ${game.player.hp}`,
    name: 'value',
    type: 'select',
    choices: [
      {title: 'Stairs', description: 'Go to stairs', value: 'stairs'},
      {title: 'Well', description: 'Restore hp', value: 'well'},
      {title: 'Stats', description: 'Show player stats', value: 'stats'},
      {title: 'Exit', description: 'Exit game', value: 'exit'},
    ],
  });

  switch (value) {
    case 'stairs':
      await processStairs(game);
      break;
    case 'well':
      game.player.hp = game.player.maxHp;
      console.log('You feel refreshed');
      break;
    case 'stats':
      await showPlayerStats(game);
      break;
    case 'exit':
      console.log('Exiting');
      game.exit = true;
      break;
    default:
      throw new Error(`Unsupported choice: ${value}`);
  }
}

async function processDungeon(game: GameModel) {

  if(game.location.type !== 'dungeon')
    throw new Error('Not in dungeon');

  const {value} = await prompts({
    message: `Dungeon ${game.location.level} | hp: ${game.player.hp}`,
    name: 'value',
    type: 'select',
    choices: [
      {title: 'Explore', description: 'Pick a fight', value: 'explore'},
      {title: 'Stairs', description: 'Go to stairs', value: 'stairs'},
      {title: 'Stats', description: 'Show player stats', value: 'stats'},
      {title: 'Exit', description: 'Exit game', value: 'exit'},
    ],
  });

  switch (value) {
    case 'explore':
      await processExplore(game);
      break;
    case 'stairs':
      await processStairs(game);
      break;
    case 'stats':
      await showPlayerStats(game);
      break;
    case 'exit':
      console.log('exiting');
      game.exit = true;
      break;
    default:
      throw new Error(`Unsupported choice: ${value}`);
  }
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

  const player = makeFighterModel(game.player);
  const monster = makeFighterModel(game.spawner.spawn(1.0));

  console.log();
  console.log('You see a monster, its stats are:');
  console.log(`hp:       ${monster.state.hp}`);
  console.log(`damage:   ${monster.def.damage.min} - ${monster.def.damage.max}`);
  console.log(`cooldown: ${monster.def.cooldown}`);
  console.log();

  if(rollPerception()) {

    console.log('It didn\'t notice you.');
    console.log();

    const {value} = await prompts({
      message: `Monster | hp: ${game.player.hp}`,
      name: 'value',
      type: 'select',
      choices: [
        {title: 'Fight', description: 'Start a fight', value: 'fight'},
        {title: 'Retreat', description: 'Retreat safely', value: 'retreat'},
      ],
    });

    switch (value) {
      case 'retreat':
        console.log('Retreating');
        return;
      case 'fight':
        const log = simulateCombat(player, monster);
        log.forEach(entry => console.log(formatLogEntry(entry)))
        console.log();
        break;
    }

  } else {

    console.log('It noticed you!');
    console.log();

    const {value} = await prompts({
      message: `Monster | hp: ${game.player.hp}`,
      name: 'value',
      type: 'select',
      choices: [
        {title: 'Fight', description: 'Start a fight', value: 'fight'},
        {title: 'Flee', description: 'Flee and get hit in the back', value: 'flee'},
      ],
    });

    switch (value) {
      case 'flee':
        const fleeLog = simulateFlee(player, monster);
        fleeLog.forEach(entry => console.log(formatLogEntry(entry)));
        console.log();
        break;
      case 'fight':
        const log = simulateCombat(player, monster);
        log.forEach(entry => console.log(formatLogEntry(entry)));
        console.log();
        break;
    }
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

