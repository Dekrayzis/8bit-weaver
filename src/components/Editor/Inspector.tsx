import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { TextInput, Checkbox, TextArea } from './Shared';
import type { Direction } from '../../types';

interface InspectorProps {
  selectedCell: { x: number; y: number };
}

export const Inspector: React.FC<InspectorProps> = ({ selectedCell }) => {
  const { project, updateRoom, toggleRoom } = useProject();
  const roomId = `room_${selectedCell.x}_${selectedCell.y}`;
  const room = project.rooms[roomId];

  if (!room) {
    return (
      <div className="inspector empty-inspector">
        <h2>{selectedCell.x}, {selectedCell.y}</h2>
        <p className="fog-text">This area is lost in the swirling fog.</p>
        <button onClick={() => toggleRoom(selectedCell.x, selectedCell.y)}>
          Create Room Here
        </button>
      </div>
    );
  }

  const handleExitChange = (dir: Direction, destId: string) => {
    updateRoom(roomId, {
      exits: {
        ...room.exits,
        [dir]: destId || undefined
      }
    });
  };

  return (
    <div className="inspector">
      <h2>Edit Room ({selectedCell.x}, {selectedCell.y})</h2>
      
      <TextInput label="Room ID (Auto)" value={room.id} readOnly />
      <TextInput label="Room Title" value={room.name} onChange={v => updateRoom(roomId, { name: v })} />

      <TextArea 
        label="Description" 
        rows={5}
        value={room.description} 
        onChange={v => updateRoom(roomId, { description: v })} 
      />

      <div className="toggles">
        <Checkbox label="Starting Room" checked={room.isStart} onChange={v => updateRoom(roomId, { isStart: v })} />
        <Checkbox label="End/Win Room" checked={room.isEnd} onChange={v => updateRoom(roomId, { isEnd: v })} />
        <Checkbox label="Dark (Needs Light)" checked={room.dark} onChange={v => updateRoom(roomId, { dark: v })} />
        <Checkbox label="Locked" checked={room.locked} onChange={v => updateRoom(roomId, { locked: v })} />
        {room.locked && (
          <div style={{ marginLeft: 20, marginTop: 10, marginBottom: 10 }}>
            <TextInput label="Unlock Flag Requirement" placeholder="e.g. door_opened" value={room.unlockConditionFlag || ''} onChange={v => updateRoom(roomId, { unlockConditionFlag: v || undefined })} />
          </div>
        )}
        <Checkbox label="Lurking Threat" checked={room.dangerous} onChange={v => updateRoom(roomId, { dangerous: v })} />
      </div>

      {room.dangerous && (
        <div style={{ marginLeft: 20, marginBottom: 10 }}>
          <TextInput label="Repel Flag (item flag that wards it off)" placeholder="e.g. monster_repelled" value={room.disableDangerFlag || ''} onChange={v => updateRoom(roomId, { disableDangerFlag: v || undefined })} />
          <TextInput label="Encounter Text (shown on fatal strike)" placeholder="The creature lunges and drags you into shadow..." value={room.customDeathText || ''} onChange={v => updateRoom(roomId, { customDeathText: v })} />
        </div>
      )}

      <h3>Exits</h3>
      <p className="hint">N/S/E/W are auto-detected from adjacent rooms on the grid.</p>
      <div className="exits-grid">
        {(['north', 'south', 'east', 'west'] as Direction[]).map(dir => {
          const offsets: Record<string, { dx: number; dy: number }> = {
            north: { dx: 0, dy: -1 },
            south: { dx: 0, dy: 1 },
            east:  { dx: 1, dy: 0 },
            west:  { dx: -1, dy: 0 }
          };
          const { dx, dy } = offsets[dir];
          const adjId = `room_${selectedCell.x + dx}_${selectedCell.y + dy}`;
          const hasAdj = !!project.rooms[adjId];
          return (
            <div key={dir} className="exit-input">
              <label>{dir.charAt(0).toUpperCase() + dir.slice(1)}</label>
              <input 
                type="text" 
                readOnly
                value={hasAdj ? adjId : '—'}
                className={hasAdj ? 'auto-exit' : 'auto-exit empty'}
              />
            </div>
          );
        })}
        {(['up', 'down'] as Direction[]).map(dir => (
          <div key={dir} className="exit-input">
            <label>{dir.charAt(0).toUpperCase() + dir.slice(1)}</label>
            <input 
              type="text" 
              placeholder="room_id"
              value={room.exits[dir] || ''} 
              onChange={e => handleExitChange(dir, e.target.value)} 
            />
          </div>
        ))}
      </div>

      <TextArea 
        label="Notes" 
        className="mt-auto"
        rows={2}
        value={room.notes || ''} 
        onChange={v => updateRoom(roomId, { notes: v || undefined })} 
      />

      <button className="danger-btn" onClick={() => toggleRoom(selectedCell.x, selectedCell.y)}>
        Delete Room
      </button>
    </div>
  );
};
