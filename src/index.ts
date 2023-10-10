#!/usr/bin/env node

import {CombatLogEntry, Fighter, FighterModel, simulateCombat, simulateFlee} from './combat';
import {rollPerception} from './mechanics';
import {
  ICharacter,
  DungeonModel,
  GameModel,
  PlayerLocation,
  PlayerModel,
  MonsterModel,
  MonsterVisualModel,
} from './models';
import * as ui from './ui';
import {capitalizeFirst} from './utils';

import playerDef from './defs/player';
import dungeonDef from './defs/dungeon';

function makeFighterModel(character: ICharacter): FighterModel {
  return {
    def: {
      damage: {
        min: character.damageMin,
        max: character.damageMax,
      },
      cooldown: character.cooldown,
    },
    state: {
      hp: character.hpCurrent,
    }
  }
}

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

  return `${formatLocation(game.location)} | hp: ${game.player.hpCurrent} / ${game.player.hpMax}`;
}

function monsterMessage(game: GameModel, monster: MonsterModel): string {
  return `${capitalizeFirst(monster.visual.nameShort)} | hp: ${game.player.hpCurrent} / ${game.player.hpMax}`;
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
    console.log('You have found a lair!');

    await processMonsterEncounter(game, level.spawnBoss(), false);

    return;
  }

  await processMonsterEncounter(game, level.spawnMonster(), rollPerception());
}

async function processMonsterEncounter(game: GameModel, monster: MonsterModel, monsterNoticedPlayer: boolean) {

  console.log();
  console.log(`You see ${monster.visual.nameIndefinite}:`);
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

  const playerFighter = makeFighterModel(game.player);
  const monsterFighter = makeFighterModel(monster);

  const log = simulateCombat(playerFighter, monsterFighter, playerInitiative ? Fighter.Player : Fighter.Monster);

  console.log();

  if(playerInitiative)
    console.log('You strike first!');
  else
    console.log(`${capitalizeFirst(monster.visual.nameDefinite)} strikes first!`);

  console.log();

  log.forEach(entry => console.log(formatLogEntry(entry, monster.visual)))

  console.log();

  if(playerFighter.state.hp <= 0) {
    await processDeath(game);
    return;
  }

  game.player.hpCurrent = playerFighter.state.hp;

  console.log('You survived!');
  console.log();

  game.dungeon.level(game.location.level).nMonstersKilled++;
  // TODO drop loot, give exp, etc
}

async function processFlee(game: GameModel, monster: MonsterModel) {

  const playerFighter = makeFighterModel(game.player);
  const monsterFighter = makeFighterModel(monster);

  const log = simulateFlee(playerFighter, monsterFighter);

  console.log();
  log.forEach(entry => console.log(formatLogEntry(entry, monster.visual)));
  console.log();

  if(playerFighter.state.hp <= 0) {
    await processDeath(game);
    return;
  }

  game.player.hpCurrent = playerFighter.state.hp;

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

function formatLogEntry(entry: CombatLogEntry, mv: MonsterVisualModel): string {
  switch (entry.type) {
    case 'hit':
      if(entry.source === Fighter.Player && entry.target === Fighter.Monster)
        return `${String(entry.at).padStart(3)}: You hit ${mv.nameDefinite} for ${entry.damage}, hp ${entry.hpBefore} -> ${entry.hpAfter}`;
      if(entry.source === Fighter.Monster && entry.target === Fighter.Player)
        return `${String(entry.at).padStart(3)}: ${capitalizeFirst(mv.nameDefinite)} hits you for ${entry.damage}, hp ${entry.hpBefore} -> ${entry.hpAfter}`;
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

