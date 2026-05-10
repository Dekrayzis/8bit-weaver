export type Direction = "north" | "south" | "east" | "west" | "up" | "down";

export interface Room {
  id: string;
  x: number;
  y: number;
  name: string;
  description: string;
  isStart: boolean;
  isEnd: boolean;
  dark: boolean;
  locked: boolean;
  unlockConditionFlag?: string;
  dangerous: boolean;
  disableDangerFlag?: string;
  customDeathText?: string;
  notes?: string;
  exits: Partial<Record<Direction, string>>;
  imageUrl?: string;
}

export interface Item {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  portable: boolean;
  startingRoomId?: string;
  canBeUsed: boolean;
  useText?: string;
  examineText?: string;
  consumeOnUse?: boolean;
  requiredTarget?: string; 
  effectFlag?: string;
}

export interface Hazard {
  id: string;
  name: string;
  description: string;
  startingRoomId?: string;
  movementPattern: 'stationary' | 'random' | 'patrol' | 'chase';
  killOnContact: boolean;
  warningText: string;
  encounterText: string;
  activationConditionFlag?: string;
}

export interface ProjectSettings {
  fogMessage: string;
  gridWidth: number;
  gridHeight: number;
  playerHealth: number;
  dangerRespawns: boolean;
  dangerRespawnTurns: number;
  storyTitle?: string;
  storyAuthor?: string;
  storyDescription?: string;
  openaiApiKey?: string;
  enableRoomImages?: boolean;
  imageModel?: 'dall-e-3' | 'dall-e-2';
  imageStyle?: 'pixel-art' | 'painterly' | 'cartoon' | 'realistic';
}

export interface ProjectState {
  rooms: Record<string, Room>;
  items: Record<string, Item>;
  hazards: Record<string, Hazard>;
  settings: ProjectSettings;
}

export interface PublishedStory {
  id: string;
  title: string;
  author: string;
  description: string;
  roomCount: number;
  itemCount: number;
  publishedAt: number;
  updatedAt: number;
  thumbnailUrl?: string;
  projectData: ProjectState;
}

export interface GameState {
  currentRoomId: string | null;
  inventory: string[];
  visitedRooms: string[];
  flags: string[];
  turnCount: number;
  score: number;
  health: number;
  activeDanger: {
    disableFlag: string;
    attackText: string;
    roomId: string;
  } | null;
  respawnCountdown: number | null;
  respawnFlag: string | null;
  isGameOver: boolean;
  outputLog: { type: 'system' | 'user' | 'location' | 'error' | 'inventory' | 'danger' | 'items' | 'exits' | 'use', text: string }[];
}
