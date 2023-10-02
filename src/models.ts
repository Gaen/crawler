export type GameModel = {
  exit: boolean,
  location: PlayerLocation,
  player: CharacterModel,
}

// region character

export type CharacterModel = {
  hp: number,
  maxHp: number,
  damage: {min: number, max: number},
  cooldown: number,
};

// endregion

// region location

export type PlayerLocation = SurfaceLocation | DungeonLocation;

export type SurfaceLocation = {
  type: 'surface',
}

export type DungeonLocation = {
  type: 'dungeon',
  level: number,
}

// endregion