import React, { useState, useEffect, useRef } from 'react';
import { useProject } from '../../context/ProjectContext';
import type { GameState } from '../../types';
import { parseCommand, describeRoom } from './Engine';

export const TerminalView: React.FC = () => {
  const { project } = useProject();
  const [input, setInput] = useState('');
  
  const getInitialGameState = (): GameState => {
    const startRoom = Object.values(project.rooms).find(r => r.isStart) || Object.values(project.rooms)[0];
    return {
      currentRoomId: startRoom ? startRoom.id : null,
      inventory: [],
      visitedRooms: [],
      flags: [],
      turnCount: 0,
      score: 0,
      health: project.settings.playerHealth || 3,
      activeDanger: null,
      respawnCountdown: null,
      respawnFlag: null,
      isGameOver: false,
      outputLog: []
    };
  };

  const [gameState, setGameState] = useState<GameState>(getInitialGameState);

  const bottomRef = useRef<HTMLDivElement>(null);
  const [charIndex, setCharIndex] = useState(0);
  const prevFirstLogRef = useRef(gameState.outputLog[0]);

  // Hazard Timer
  useEffect(() => {
    if (gameState.activeDanger && !gameState.isGameOver) {
      const timer = setTimeout(() => {
        setGameState(prev => {
          if (!prev.activeDanger || prev.isGameOver) return prev;
          return parseCommand('__HAZARD_ATTACK', prev, project);
        });
      }, 4000); // 4 seconds grace period
      return () => clearTimeout(timer);
    }
  }, [gameState.activeDanger, gameState.isGameOver, project, gameState.turnCount]);

  // Handle detecting clear screen to reset typewriter
  let activeCharIndex = charIndex;
  if (gameState.outputLog[0] !== prevFirstLogRef.current) {
    activeCharIndex = 0;
    prevFirstLogRef.current = gameState.outputLog[0];
    setCharIndex(0);
  }

  const totalChars = gameState.outputLog.reduce((acc, log) => acc + log.text.length, 0);

  // Initial description
  useEffect(() => {
    if (gameState.outputLog.length === 0 && gameState.currentRoomId && project.rooms[gameState.currentRoomId]) {
      setGameState(prev => describeRoom({ ...prev, outputLog: [] }, project, project.rooms[gameState.currentRoomId!], true));
    }
  }, [gameState.outputLog.length, gameState.currentRoomId, project]);

  // Typewriter ticker
  useEffect(() => {
    if (activeCharIndex < totalChars) {
      const timer = setTimeout(() => {
        setCharIndex(c => c + 1);
      }, 25);
      return () => clearTimeout(timer);
    }
  }, [activeCharIndex, totalChars]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [activeCharIndex]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // If typewriter is still going, pressing enter skips it
    if (activeCharIndex < totalChars) {
      setCharIndex(totalChars);
      return;
    }

    setGameState(prev => parseCommand(input, prev, project));
    setInput('');
  };

  const handleRestart = () => {
    setGameState(getInitialGameState());
    setCharIndex(0);
  };

  if (Object.keys(project.rooms).length === 0) {
    return (
      <div className="terminal-view empty">
        <p>No map constructed yet. Draw some rooms to playtest.</p>
      </div>
    );
  }

  // Typewriter rendering logic
  let remainingChars = activeCharIndex;
  const renderedLogs = gameState.outputLog.map((log, index) => {
    if (remainingChars <= 0) return null;
    const charsToShow = Math.min(remainingChars, log.text.length);
    remainingChars -= charsToShow;
    const textToShow = log.text.slice(0, charsToShow);

    // If it's fully typed, show normally. If partially, we can add a cursor `_`
    const isTyping = charsToShow < log.text.length;

    return (
      <div key={index} className={`log-line type-${log.type}`}>
        {textToShow.split('\n').map((line, i, arr) => (
          <div key={i}>
            {line}
            {isTyping && i === arr.length - 1 ? <span className="cursor">_</span> : null}
          </div>
        ))}
      </div>
    );
  }).filter(Boolean);

  return (
    <div className="terminal-view" onClick={() => { if (activeCharIndex < totalChars) setCharIndex(totalChars); }}>
      <div className="terminal-output">
        <div className="system-msg">=== EIGHT-BIT WEAVER TERMINAL ===</div>
        {renderedLogs}
        <div ref={bottomRef} />
      </div>

      {gameState.isGameOver ? (
        <div className="terminal-input-row">
          <button onClick={handleRestart} className="btn">RESTART GAME</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="terminal-input-row">
          <span className="prompt">&gt;</span>
          <input 
            type="text" 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            autoFocus 
            autoComplete="off"
            spellCheck="false"
          />
        </form>
      )}
    </div>
  );
};
