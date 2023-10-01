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
  console.log('Exploring');
}

(async () => {

  const game: Game = {
    exit: false,
    location: PlayerLocation.Surface as PlayerLocation,
    player: {
      hp: 100,
      damage: {min: 10, max: 20},
      cooldown: 117,
    }
  };

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

