import React, { useState, useEffect, useRef } from 'react';
import type { ProjectState, GameState } from '../../types';
import { parseCommand, describeRoom } from '../Playtest/Engine';
import { ArrowLeft } from 'lucide-react';

interface StoryPlayerProps {
  project: ProjectState;
  storyTitle: string;
  onBack: () => void;
}

export const StoryPlayer: React.FC<StoryPlayerProps> = ({ project, storyTitle, onBack }) => {
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
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Update room image
  useEffect(() => {
    if (gameState.currentRoomId) {
      const room = project.rooms[gameState.currentRoomId];
      const newImage = room?.imageUrl || null;
      if (newImage !== currentImage) {
        setImageLoaded(false);
        setCurrentImage(newImage);
      }
    }
  }, [gameState.currentRoomId, project.rooms, currentImage]);

  // Hazard Timer
  useEffect(() => {
    if (gameState.activeDanger && !gameState.isGameOver) {
      const timer = setTimeout(() => {
        setGameState(prev => {
          if (!prev.activeDanger || prev.isGameOver) return prev;
          return parseCommand('__HAZARD_ATTACK', prev, project);
        });
      }, 4000);
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

  // Typewriter
  useEffect(() => {
    if (activeCharIndex < totalChars) {
      const timer = setTimeout(() => setCharIndex(c => c + 1), 25);
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

  // Typewriter rendering
  let remainingChars = activeCharIndex;
  const renderedLogs = gameState.outputLog.map((log, index) => {
    if (remainingChars <= 0) return null;
    const charsToShow = Math.min(remainingChars, log.text.length);
    remainingChars -= charsToShow;
    const textToShow = log.text.slice(0, charsToShow);
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
    <div className="story-player">
      <div className="story-player-header">
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={18} /> Library
        </button>
        <h2 className="story-player-title">{storyTitle}</h2>
        <div style={{ width: 100 }} />
      </div>

      <div className="story-player-body">
        {currentImage && (
          <div className={`room-image-panel ${imageLoaded ? 'loaded' : ''}`}>
            <div className="room-image-frame">
              <img 
                src={currentImage} 
                alt="Room scene" 
                onLoad={() => setImageLoaded(true)}
              />
              <div className="room-image-scanlines" />
            </div>
          </div>
        )}

        <div className="terminal-view" onClick={() => { if (activeCharIndex < totalChars) setCharIndex(totalChars); }}>
          <div className="terminal-output">
            <div className="system-msg">=== {storyTitle.toUpperCase()} ===</div>
            {renderedLogs}
            <div ref={bottomRef} />
          </div>

          {gameState.isGameOver ? (
            <div className="terminal-input-row">
              <button onClick={handleRestart} className="btn">RESTART GAME</button>
              <button onClick={onBack} className="btn" style={{ marginLeft: 10 }}>BACK TO LIBRARY</button>
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
      </div>
    </div>
  );
};
