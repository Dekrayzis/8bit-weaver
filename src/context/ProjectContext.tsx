import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ProjectState, Room, Item, Hazard } from '../types';

const defaultState: ProjectState = {
  rooms: {},
  items: {},
  hazards: {},
  settings: {
    fogMessage: "You are lost in the swirling fog.",
    gridWidth: 30,
    gridHeight: 30,
    playerHealth: 3,
    dangerRespawns: true,
    dangerRespawnTurns: 5
  }
};

interface ProjectContextType {
  project: ProjectState;
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>;
  toggleRoom: (x: number, y: number) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  updateSettings: (updates: Partial<ProjectState['settings']>) => void;
  addItem: (item: Item) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  addHazard: (hazard: Hazard) => void;
  updateHazard: (id: string, updates: Partial<Hazard>) => void;
  deleteHazard: (id: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProject must be used within ProjectProvider");
  return context;
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [project, setProject] = useState<ProjectState>(() => {
    const saved = localStorage.getItem('text-adventure-project');
    return saved ? JSON.parse(saved) : defaultState;
  });

  useEffect(() => {
    localStorage.setItem('text-adventure-project', JSON.stringify(project));
  }, [project]);

  const toggleRoom = (x: number, y: number) => {
    setProject(prev => {
      const id = `room_${x}_${y}`;
      const newRooms = { ...prev.rooms };
      if (newRooms[id]) {
        delete newRooms[id];
      } else {
        newRooms[id] = {
          id, x, y,
          name: `Room ${x},${y}`,
          description: "You see a nondescript room.",
          isStart: Object.keys(newRooms).length === 0, // make first room start automatically
          isEnd: false,
          dark: false,
          locked: false,
          dangerous: false,
          exits: {}
        };
      }
      return { ...prev, rooms: newRooms };
    });
  };

  const updateRoom = (id: string, updates: Partial<Room>) => {
    setProject(prev => ({
      ...prev,
      rooms: {
        ...prev.rooms,
        [id]: { ...prev.rooms[id], ...updates }
      }
    }));
  };

  const updateSettings = (updates: Partial<ProjectState['settings']>) => {
    setProject(prev => ({ ...prev, settings: { ...prev.settings, ...updates } }));
  };

  const addItem = (item: Item) => {
    setProject(prev => ({ ...prev, items: { ...prev.items, [item.id]: item } }));
  };

  const updateItem = (id: string, updates: Partial<Item>) => {
    setProject(prev => ({
      ...prev,
      items: { ...prev.items, [id]: { ...prev.items[id], ...updates } }
    }));
  };

  const deleteItem = (id: string) => {
    setProject(prev => {
      const newItems = { ...prev.items };
      delete newItems[id];
      return { ...prev, items: newItems };
    });
  };

  const addHazard = (hazard: Hazard) => {
    setProject(prev => ({ ...prev, hazards: { ...prev.hazards, [hazard.id]: hazard } }));
  };

  const updateHazard = (id: string, updates: Partial<Hazard>) => {
    setProject(prev => ({
      ...prev,
      hazards: { ...prev.hazards, [id]: { ...prev.hazards[id], ...updates } }
    }));
  };

  const deleteHazard = (id: string) => {
    setProject(prev => {
      const newHazards = { ...prev.hazards };
      delete newHazards[id];
      return { ...prev, hazards: newHazards };
    });
  };

  return (
    <ProjectContext.Provider value={{
      project, setProject, toggleRoom, updateRoom, updateSettings,
      addItem, updateItem, deleteItem,
      addHazard, updateHazard, deleteHazard
    }}>
      {children}
    </ProjectContext.Provider>
  );
};
