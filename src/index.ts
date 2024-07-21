#!/usr/bin/env node

import chalk from 'chalk';

import {Combat, CombatLogEntry} from './Combat';
import {rollSneak} from './mechanics';
import {
  ICharacter,
  DungeonModel,
  GameModel,
  PlayerLocation,
  PlayerModel,
  MonsterModel,
} from './models';
import * as ui from './ui';
import {capitalizeFirst} from './utils';

import playerDef from './defs/player';
import dungeonDef from './defs/dungeon';

function initGame(): GameModel {

  return {
    exit: false,
    location: {type: 'surface'},
    player: new PlayerModel(playerDef),
    dungeon: new DungeonModel(dungeonDef),
  };
}

function locationMessage(game: GameModel): string {

  function formatLocation(location: PlayerLocation): string {
    switch (location.type) {
      case 'surface':
        return 'Surface';
      case 'dungeon':
        return `Dungeon ${location.level}`;
      default:
        throw new Error(`Unsupported location type: ${(location as { type: string }).type}`);
    }
  }

  return [
    [
      chalk.red.dim('hp'),
      chalk.redBright(game.player.hpCurrent),
      chalk.red.dim('/'),
      chalk.red.dim(game.player.hpMax),
    ].join(' '),
    '|',
    chalk.whiteBright(formatLocation(game.location)),
  ].join(' ');
}

function monsterMessage(game: GameModel, monster: MonsterModel): string {

  return [
    [
      chalk.red.dim('hp'),
      chalk.redBright(game.player.hpCurrent),
      chalk.red.dim('/'),
      chalk.red.dim(game.player.hpMax),
    ].join(' '),
    '|',
    chalk.yellowBright(capitalizeFirst(monster.visual.nameShort)),
  ].join(' ');
}

async function processExit(game: GameModel) {
  console.log('Exiting');
  game.exit = true;
}

async function processPlayerStats(game: GameModel) {
  console.log();
  console.log('Your stats:');
  console.log(` - hp:       ${game.player.hpCurrent} / ${game.player.hpMax}`);
  console.log(` - damage:   ${game.player.damageMin} - ${game.player.damageMax}`);
  console.log(` - cooldown: ${game.player.cooldown}`);
  console.log();
}

async function processStairs(game: GameModel) {

  await ui.select(
    locationMessage(game),
    [
      {
        title: 'Surface',
        action: () => game.location = {type: 'surface'},
      },
      ...game.dungeon.levels().map(level => ({
        title: `Dungeon level ${level}`,
        action: () => game.location = {type: 'dungeon', level},
      }))
    ]
  );
}

async function processSurface(game: GameModel) {

  await ui.select(
    locationMessage(game),
    [
      {
        title: 'Stairs',
        description: 'Go to stairs',
        action: async () => await processStairs(game),
      },
      {
        title: 'Well',
        description: 'Restore hp',
        action: async () => await processWell(game),
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

async function processWell(game: GameModel) {

  game.player.hpCurrent = game.player.hpMax;

  console.log();
  console.log('You feel refreshed.');
  console.log();
}

async function processDungeon(game: GameModel) {

  if(game.location.type !== 'dungeon')
    throw new Error('Not in dungeon');

  const level = game.dungeon.level(game.location.level);

  await ui.select(
    locationMessage(game),
    [
      {
        title: 'Explore',
        description: 'Pick a fight',
        action: async () => await processExplore(game),
      },
      {
        title: 'Lair',
        description: 'Go straight to the lair',
        visible: level.didFindBoss,
        action: async () => await processMonsterEncounter(game, level.spawnBoss(), false),
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

  const level = game.dungeon.level(game.location.level);

  if(level.canFindBoss) {

    level.didFindBoss = true;

    console.log();
    console.log(chalk.whiteBright('You have found a lair!'));

    const monster = level.spawnBoss();

    await processMonsterEncounter(game, monster, false);

    return;
  }

  const monster = level.spawnMonster();

  await processMonsterEncounter(game, monster, rollSneak(monster, game.player));
}

async function processMonsterEncounter(game: GameModel, monster: MonsterModel, monsterNoticedPlayer: boolean) {

  console.log();
  console.log(`You see ${chalk.yellowBright(monster.visual.nameIndefinite)}:`);
  console.log(` - hp:       ${monster.hpCurrent} / ${monster.hpMax}`);
  console.log(` - damage:   ${monster.damageMin} - ${monster.damageMax}`);
  console.log(` - cooldown: ${monster.cooldown}`);
  console.log();

  if(monsterNoticedPlayer) {

    console.log('It has noticed you!');
    console.log();

    await ui.select(
      monsterMessage(game, monster),
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

  } else {

    console.log('It hasn\'t noticed you.');
    console.log();

    await ui.select(
      monsterMessage(game, monster),
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
}

async function processFight(game: GameModel, monster: MonsterModel, playerInitiative: boolean) {

  if(game.location.type !== 'dungeon')
    throw new Error('Not in dungeon');

  console.log();

  if(playerInitiative)
    console.log('You strike first!');
  else
    console.log(`${capitalizeFirst(monster.visual.nameDefinite)} strikes first!`);

  console.log();

  const combat = new Combat([game.player, monster], playerInitiative ? game.player : monster);

  while (combat.canContinue()) {
    combat.tick();
  }

  const log = combat.getLog();

  log.forEach(entry => console.log(formatLogEntry(game.player, monster, entry)))

  console.log();

  if(game.player.hpCurrent <= 0) {
    await processDeath(game);
    return;
  }

  console.log('You survived!');
  console.log();

  game.dungeon.level(game.location.level).nMonstersKilled++;
  // TODO drop loot, give exp, etc
}

async function processFlee(game: GameModel, monster: MonsterModel) {

  console.log();

  const combat = new Combat([game.player, monster], monster);

  combat.tick();

  const log = combat.getLog();

  log.forEach(entry => console.log(formatLogEntry(game.player, monster, entry)));

  console.log();

  if(game.player.hpCurrent <= 0) {
    await processDeath(game);
    return;
  }

  console.log('You survived!');
  console.log();
}

async function processRetreat(game: GameModel) {
  console.log();
  console.log('Retreating');
  console.log();
}

async function processDeath(game: GameModel) {
  console.log('You died and revived at the well');
  console.log();
  game.player.hpCurrent = game.player.hpMax;
  game.location = {type: 'surface'};
}

function formatLogEntry(player:PlayerModel, monster:MonsterModel, entry: CombatLogEntry): string {

  function colorizer(char: ICharacter) {
    return char === player ? chalk.red : chalk.yellow;
  }

  function name(char: ICharacter) {
    return char === player ? 'you' : monster.visual.nameDefinite;
  }

  function hitAction(char: ICharacter) {
    return char === player ? 'hit' : 'hits';
  }

  function missAction(char: ICharacter) {
    return char === player ? 'miss' : 'misses';
  }

  switch (entry.type) {
    case 'hit':
      return [
        chalk.grey(`${String(entry.at).padStart(3)}:`),
        `${colorizer(entry.source)(capitalizeFirst(name(entry.source)))}`,
        hitAction(entry.source),
        `${colorizer(entry.target)(name(entry.target))}`,
        `for`,
        `${chalk.whiteBright(entry.damage)},`,
        `hp ${colorizer(entry.target)(entry.hpBefore)} -> ${colorizer(entry.target)(entry.hpAfter)}`
      ].join(' ');
    case 'miss':
      return [
        chalk.grey(`${String(entry.at).padStart(3)}:`),
        `${colorizer(entry.source)(capitalizeFirst(name(entry.source)))}`,
        missAction(entry.source),
        `${colorizer(entry.target)(name(entry.target))}`,
      ].join(' ');
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

