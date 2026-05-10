import React, { useEffect, useRef } from 'react';
import { useProject } from '../../context/ProjectContext';

interface GridMapProps {
  selectedCell: { x: number; y: number };
  setSelectedCell: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
}

export const GridMap: React.FC<GridMapProps> = ({ selectedCell, setSelectedCell }) => {
  const { project, toggleRoom } = useProject();
  const { gridWidth, gridHeight } = project.settings;
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      type KeyAction = { dx: number; dy: number } | { toggle: true };
      const keyActions: Record<string, KeyAction> = {
        ArrowUp: { dx: 0, dy: -1 }, w: { dx: 0, dy: -1 }, W: { dx: 0, dy: -1 },
        ArrowDown: { dx: 0, dy: 1 }, s: { dx: 0, dy: 1 }, S: { dx: 0, dy: 1 },
        ArrowLeft: { dx: -1, dy: 0 }, a: { dx: -1, dy: 0 }, A: { dx: -1, dy: 0 },
        ArrowRight: { dx: 1, dy: 0 }, d: { dx: 1, dy: 0 }, D: { dx: 1, dy: 0 },
        ' ': { toggle: true }, Enter: { toggle: true }
      };

      const action = keyActions[e.key];
      if (!action) return;

      if ('toggle' in action) {
        e.preventDefault();
        toggleRoom(selectedCell.x, selectedCell.y);
      } else {
        const newX = Math.max(0, Math.min(gridWidth - 1, selectedCell.x + action.dx));
        const newY = Math.max(0, Math.min(gridHeight - 1, selectedCell.y + action.dy));
        if (newX !== selectedCell.x || newY !== selectedCell.y) {
          e.preventDefault();
          setSelectedCell({ x: newX, y: newY });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, gridWidth, gridHeight, setSelectedCell, toggleRoom]);

  const cells = [];
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const isSelected = selectedCell.x === x && selectedCell.y === y;
      const roomId = `room_${x}_${y}`;
      const hasRoom = !!project.rooms[roomId];
      const room = project.rooms[roomId];

      cells.push(
        <div
          key={`${x},${y}`}
          onClick={() => setSelectedCell({ x, y })}
          className={`grid-cell ${isSelected ? 'selected' : ''} ${hasRoom ? 'room' : 'fog'} ${room?.isStart ? 'start' : ''}`}
          style={{ gridColumn: x + 1, gridRow: y + 1 }}
        >
          {hasRoom && (
             <div className="room-inner">
               {/* Auto exits visuals N/S/E/W */}
               {!!project.rooms[`room_${x}_${y-1}`] && <div className="exit n" />}
               {!!project.rooms[`room_${x}_${y+1}`] && <div className="exit s" />}
               {!!project.rooms[`room_${x+1}_${y}`] && <div className="exit e" />}
               {!!project.rooms[`room_${x-1}_${y}`] && <div className="exit w" />}
             </div>
          )}
        </div>
      );
    }
  }

  return (
    <div className="grid-container" ref={gridRef}>
      <div 
        className="grid-map"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${gridWidth}, 40px)`, 
          gridTemplateRows: `repeat(${gridHeight}, 40px)` 
        }}
      >
        {cells}
      </div>
    </div>
  );
};
