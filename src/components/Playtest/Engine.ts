import type { GameState, ProjectState, Room, Direction, Item } from '../../types';

export const EXITS: Direction[] = ['north', 'south', 'east', 'west', 'up', 'down'];
const DIR_ALIASES: Record<string, Direction> = {
  n: 'north', s: 'south', e: 'east', w: 'west', u: 'up', d: 'down',
  north: 'north', south: 'south', east: 'east', west: 'west', up: 'up', down: 'down'
};

const OFFSETS: Record<string, { dx: number, dy: number }> = {
  north: { dx: 0, dy: -1 },
  south: { dx: 0, dy: 1 },
  east: { dx: 1, dy: 0 },
  west: { dx: -1, dy: 0 }
};

const getRoomItems = (state: GameState, project: ProjectState, roomId: string) => {
  return Object.values(project.items).filter(item => {
    // If it's explicitly in this room
    if (item.startingRoomId === roomId && !state.inventory.includes(item.id)) {
      return true;
    }
    return false;
  });
};

const resolveItem = (itemName: string, availableItems: Item[]) => {
  return availableItems.find(item => 
    item.name.toLowerCase() === itemName.toLowerCase() || 
    item.aliases.some(a => a.toLowerCase() === itemName.toLowerCase())
  );
};

export const parseCommand = (
  input: string,
  state: GameState,
  project: ProjectState
): GameState => {
  const cleanInput = input.trim().toLowerCase();
  const args = cleanInput.split(' ').filter(Boolean);
  if (args.length === 0) return state;

  const command = args[0];
  const target = args.slice(1).join(' ');

  const isInternal = command.startsWith('__');

  let newState = { ...state, outputLog: [...state.outputLog] };
  if (!isInternal) {
    newState.turnCount = state.turnCount + 1;
    newState.outputLog.push({ type: 'user' as const, text: `> ${input}` });

    // Tick respawn countdown
    if (newState.respawnCountdown !== null && newState.respawnFlag) {
      newState.respawnCountdown -= 1;
      if (newState.respawnCountdown <= 0) {
        // Remove the neutralization flag so the danger can trigger again
        newState.flags = newState.flags.filter(f => f !== newState.respawnFlag);
        newState.respawnCountdown = null;
        newState.respawnFlag = null;
      }
    }
  }
  
  if (newState.isGameOver && !isInternal) {
    newState.outputLog.push({ type: 'system', text: "The game is over. Please restart." });
    return newState;
  }

  const currentRoom = project.rooms[newState.currentRoomId || ''];
  if (!currentRoom) {
    newState.outputLog.push({ type: 'system', text: "Error: Current room does not exist in project." });
    return newState;
  }

  // Handle HAZARD_ATTACK (from timer)
  if (command === '__hazard_attack') {
    if (newState.activeDanger) {
      newState.health -= 1;
      if (newState.health <= 0) {
        newState.outputLog.push({ type: 'danger', text: newState.activeDanger.attackText });
        newState.outputLog.push({ type: 'system', text: "=== YOU HAVE DIED ===" });
        newState.isGameOver = true;
      } else {
        newState.outputLog.push({ type: 'danger', text: "The hazard violently strikes you!" });
        newState.outputLog.push({ type: 'danger', text: `Health remaining: ${newState.health}` });
      }
    }
    return newState;
  }

  // Handle Movement
  if (DIR_ALIASES[command] && !target) {
    const dir = DIR_ALIASES[command];
    return attemptMove(dir, newState, project, currentRoom);
  } else if (command === 'go' && target && DIR_ALIASES[target]) {
    return attemptMove(DIR_ALIASES[target], newState, project, currentRoom);
  }

  // Handle LOOK
  if (command === 'look' || command === 'l') {
    return describeRoom(newState, project, currentRoom, false);
  }

  // Handle INVENTORY
  if (command === 'inventory' || command === 'i' || command === 'inv') {
    if (newState.inventory.length === 0) {
      newState.outputLog.push({ type: 'inventory', text: "You are not carrying anything." });
    } else {
      const invNames = newState.inventory.map(id => project.items[id]?.name).filter(Boolean);
      newState.outputLog.push({ type: 'inventory', text: `You are carrying:\n- ${invNames.join('\n- ')}` });
    }
    return newState;
  }

  const roomItems = getRoomItems(newState, project, currentRoom.id);
  const invItems = newState.inventory.map(id => project.items[id]).filter(Boolean);
  const allAccessibleItems = [...roomItems, ...invItems];

  // Handle TAKE
  if (command === 'take' || command === 'get') {
    if (!target) {
      newState.outputLog.push({ type: 'system', text: "Take what?" });
      return newState;
    }
    const item = resolveItem(target, roomItems);
    if (!item) {
      newState.outputLog.push({ type: 'system', text: "You don't see that here." });
      return newState;
    }
    if (!item.portable) {
      newState.outputLog.push({ type: 'system', text: `You can't take the ${item.name}.` });
      return newState;
    }
    
    newState.inventory = [...newState.inventory, item.id];
    newState.outputLog.push({ type: 'system', text: `Taken.` });
    return newState;
  }

  // Handle DROP
  if (command === 'drop') {
    if (!target) {
      newState.outputLog.push({ type: 'system', text: "Drop what?" });
      return newState;
    }
    const item = resolveItem(target, invItems);
    if (!item) {
      newState.outputLog.push({ type: 'system', text: "You don't have that." });
      return newState;
    }
    
    newState.inventory = newState.inventory.filter(id => id !== item.id);
    newState.outputLog.push({ type: 'system', text: `You dropped the ${item.name}. (Note: MVP does not persist dropped items in room yet!)` });
    return newState;
  }

  // Handle EXAMINE
  if (command === 'examine' || command === 'x') {
    if (!target) {
      newState.outputLog.push({ type: 'system', text: "Examine what?" });
      return newState;
    }
    const item = resolveItem(target, allAccessibleItems);
    if (!item) {
      newState.outputLog.push({ type: 'system', text: "You don't see that here." });
      return newState;
    }
    newState.outputLog.push({ type: 'system', text: item.examineText || `It's just a ${item.name}.` });
    return newState;
  }

  // Handle USE
  if (command === 'use') {
    if (!target) {
      newState.outputLog.push({ type: 'system', text: "Use what?" });
      return newState;
    }
    const item = resolveItem(target, invItems);
    if (!item) {
      newState.outputLog.push({ type: 'system', text: "You don't have that." });
      return newState;
    }
    if (!item.canBeUsed) {
      newState.outputLog.push({ type: 'system', text: `You can't use the ${item.name}.` });
      return newState;
    }
    newState.outputLog.push({ type: 'use', text: item.useText || `You used the ${item.name}.` });
    
    if (item.effectFlag && !newState.flags.includes(item.effectFlag)) {
      newState.flags = [...newState.flags, item.effectFlag];
      
      // Check if this use neutralizes the active danger
      if (newState.activeDanger && newState.activeDanger.disableFlag === item.effectFlag) {
        newState.activeDanger = null;
        newState.outputLog.push({ type: 'use', text: "You successfully repelled the danger!" });

        // Start respawn countdown if enabled
        if (project.settings.dangerRespawns) {
          const baseTurns = project.settings.dangerRespawnTurns || 5;
          // Add some randomness: between baseTurns and baseTurns + 4
          const jitter = Math.floor(Math.random() * 5);
          newState.respawnCountdown = baseTurns + jitter;
          newState.respawnFlag = item.effectFlag;
          newState.outputLog.push({ type: 'system', text: "The danger retreats... but for how long?" });
        }
      }
    }

    if (item.consumeOnUse) {
      newState.inventory = newState.inventory.filter(id => id !== item.id);
    }
    return newState;
  }

  newState.outputLog.push({ type: 'system', text: "I don't understand that command." });
  return newState;
};

const attemptMove = (
  dir: Direction,
  state: GameState,
  project: ProjectState,
  currentRoom: Room
): GameState => {
  let nextRoomId: string | undefined;

  // N/S/E/W always derived from grid adjacency
  if (OFFSETS[dir]) {
    const { dx, dy } = OFFSETS[dir];
    const adjacentId = `room_${currentRoom.x + dx}_${currentRoom.y + dy}`;
    if (project.rooms[adjacentId]) {
      nextRoomId = adjacentId;
    }
  } else {
    // Up/Down use stored exits
    nextRoomId = currentRoom.exits[dir];
  }

  if (nextRoomId && project.rooms[nextRoomId]) {
    const nextRoom = project.rooms[nextRoomId];

    if (nextRoom.locked) {
      if (!nextRoom.unlockConditionFlag || !state.flags.includes(nextRoom.unlockConditionFlag)) {
        state.outputLog.push({ type: 'system', text: "The way is locked." });
        return state;
      }
    }

    state.currentRoomId = nextRoomId;
    state.outputLog = [];
    return describeRoom(state, project, project.rooms[nextRoomId], true);
  } else {
    // Fog behavior (fatal)
    state.outputLog.push({ type: 'location', text: project.settings.fogMessage });
    state.outputLog.push({ type: 'system', text: "You wander around for days, and die of despair." });
    state.outputLog.push({ type: 'system', text: "=== YOU HAVE DIED ===" });
    state.isGameOver = true;
    return state;
  }
};

export const describeRoom = (state: GameState, project: ProjectState, room: Room, isEntering: boolean): GameState => {
  
  if (room.isEnd) {
    state.outputLog.push({ type: 'location', text: room.name });
    state.outputLog.push({ type: 'system', text: room.description });
    state.outputLog.push({ type: 'system', text: "=== CONGRATULATIONS! YOU WIN! ===" });
    state.isGameOver = true;
    return state;
  }

  // Add room description
  state.outputLog.push({ type: 'location', text: room.name });
  state.outputLog.push({ type: 'system', text: room.description });
  
  // Show items
  const items = getRoomItems(state, project, room.id);
  if (items.length > 0) {
    state.outputLog.push({ type: 'items', text: `You see here: ${items.map(i => i.name).join(', ')}.` });
  }

  // Derive exits to show
  const availableExits: Direction[] = [];
  EXITS.forEach(dir => {
    let has = false;
    if (OFFSETS[dir]) {
      // N/S/E/W: always from grid adjacency
      const { dx, dy } = OFFSETS[dir];
      has = !!project.rooms[`room_${room.x + dx}_${room.y + dy}`];
    } else {
      // Up/Down: from stored exits
      has = !!room.exits[dir];
    }
    if (has) availableExits.push(dir);
  });

  if (availableExits.length > 0) {
    state.outputLog.push({ type: 'exits', text: `Exits: ${availableExits.join(', ')}` });
  }

  if (!state.visitedRooms.includes(room.id)) {
    state.visitedRooms.push(room.id);
  }

  // DANGER LOGIC
  if (isEntering) {
    // If room is dangerous and we haven't neutralized it globally
    const isDangerNeutralized = room.disableDangerFlag && state.flags.includes(room.disableDangerFlag);
    
    if (room.dangerous && !isDangerNeutralized && !state.activeDanger) {
      state.activeDanger = {
        disableFlag: room.disableDangerFlag || '',
        attackText: room.customDeathText || "The hazard attacks you!",
        roomId: room.id
      };
    }

    if (state.activeDanger) {
      if (state.activeDanger.roomId !== room.id) {
        state.outputLog.push({ type: 'danger', text: "The danger followed you here!" });
      }

      // Always give the player a grace period to react — the timer handles the attack
      state.outputLog.push({ type: 'danger', text: "The danger approaches... quick, use something!" });
    }
  }

  return state;
};
