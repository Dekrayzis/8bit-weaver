import React, { useState, useRef } from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { GridMap } from './components/Editor/GridMap';
import { Inspector } from './components/Editor/Inspector';
import { ItemEditor } from './components/Editor/ItemEditor';
import { TerminalView } from './components/Playtest/TerminalView';
import { PublishModal } from './components/Editor/PublishModal';
import { StoryLibrary } from './components/Library/StoryLibrary';
import { StoryPlayer } from './components/Library/StoryPlayer';
import type { PublishedStory } from './types';
import { Map, Package, Play, Settings, Save, Download, Upload, Trash2, BookOpen, Send, Eye, EyeOff } from 'lucide-react';

type AppMode = 'library' | 'editor' | 'playing';

const EditorLayout: React.FC<{ onGoToLibrary: () => void }> = ({ onGoToLibrary }) => {
  const { project, setProject, updateSettings } = useProject();
  const [activeTab, setActiveTab] = useState<'map' | 'items' | 'settings' | 'playtest'>('map');
  const [selectedCell, setSelectedCell] = useState({ x: Math.floor(project.settings.gridWidth / 2), y: Math.floor(project.settings.gridHeight / 2) });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${project.settings.storyTitle || 'text-adventure'}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = JSON.parse(event.target?.result as string);
        setProject(result);
      } catch (err) {
        alert("Failed to parse JSON project file.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear the entire map and all items?")) {
      setProject({
        rooms: {},
        items: {},
        hazards: {},
        settings: project.settings
      });
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>EIGHT-BIT WEAVER</h1>
        <div className="tab-menu">
          <button onClick={onGoToLibrary} title="Story Library">
            <BookOpen size={16}/> Library
          </button>
          <div className="divider" />
          <button className={activeTab === 'map' ? 'active' : ''} onClick={() => setActiveTab('map')}><Map size={16}/> Map</button>
          <button className={activeTab === 'items' ? 'active' : ''} onClick={() => setActiveTab('items')}><Package size={16}/> Items</button>
          <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}><Settings size={16}/> Global</button>
          <div className="divider" />
          <button className={activeTab === 'playtest' ? 'active play-btn' : 'play-btn'} onClick={() => setActiveTab('playtest')}><Play size={16}/> Playtest</button>
        </div>
        <div className="toolbar">
          <button title="Publish Story" className="publish-btn" onClick={() => setShowPublishModal(true)}><Send size={16} /> Publish</button>
          <div className="divider" />
          <button title="Save to Browser" onClick={() => alert("Project is auto-saved to localStorage.")}><Save size={16} /> Save</button>
          <button title="Export JSON" onClick={handleExport}><Download size={16} /> Export</button>
          <button title="Import JSON" onClick={() => fileInputRef.current?.click()}><Upload size={16} /> Import</button>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleImport} />
          <button title="Clear All" className="danger-text" onClick={handleClear}><Trash2 size={16} /> Reset</button>
        </div>
      </header>

      <main className="app-content">
        {activeTab === 'map' && (
          <div className="split-view">
            <div className="left-panel">
              <GridMap selectedCell={selectedCell} setSelectedCell={setSelectedCell} />
            </div>
            <div className="right-panel">
              <Inspector selectedCell={selectedCell} />
            </div>
          </div>
        )}
        {activeTab === 'items' && <ItemEditor />}
        {activeTab === 'settings' && (
          <div className="settings-view form-container">
            <h2>Global Settings</h2>

            <div className="settings-section">
              <h3>Story Details</h3>
              <div className="form-group">
                <label>Story Title</label>
                <input 
                  type="text" 
                  value={project.settings.storyTitle || ''} 
                  onChange={e => updateSettings({ storyTitle: e.target.value })}
                  placeholder="My Adventure"
                />
              </div>
              <div className="form-group">
                <label>Author</label>
                <input 
                  type="text" 
                  value={project.settings.storyAuthor || ''} 
                  onChange={e => updateSettings({ storyAuthor: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={project.settings.storyDescription || ''} 
                  onChange={e => updateSettings({ storyDescription: e.target.value })}
                  placeholder="A brief description of your adventure..."
                  rows={3}
                />
              </div>
            </div>

            <div className="settings-section">
              <h3>AI Image Generation</h3>
              <div className="form-group">
                <label>OpenAI API Key</label>
                <div className="api-key-input">
                  <input 
                    type={showApiKey ? 'text' : 'password'}
                    value={project.settings.openaiApiKey || ''} 
                    onChange={e => updateSettings({ openaiApiKey: e.target.value })}
                    placeholder="sk-..."
                  />
                  <button 
                    type="button" 
                    className="api-key-toggle" 
                    onClick={() => setShowApiKey(!showApiKey)}
                    title={showApiKey ? 'Hide' : 'Show'}
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="hint">Your key is stored locally in your browser only.</span>
              </div>
              <div className="form-group">
                <label>Image Model</label>
                <select 
                  value={project.settings.imageModel || 'dall-e-3'}
                  onChange={e => updateSettings({ imageModel: e.target.value as 'dall-e-3' | 'dall-e-2' })}
                >
                  <option value="dall-e-3">DALL·E 3 ($0.04/image)</option>
                  <option value="dall-e-2">DALL·E 2 ($0.02/image)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Art Style</label>
                <select 
                  value={project.settings.imageStyle || 'pixel-art'}
                  onChange={e => updateSettings({ imageStyle: e.target.value as 'pixel-art' | 'painterly' | 'cartoon' | 'realistic' })}
                >
                  <option value="pixel-art">Pixel Art (Retro 8-bit)</option>
                  <option value="painterly">Painterly (Fantasy Illustration)</option>
                  <option value="cartoon">Cartoon (Adventure Game)</option>
                  <option value="realistic">Realistic (Cinematic)</option>
                </select>
              </div>
            </div>

            <div className="settings-section">
              <h3>Gameplay</h3>
              <div className="form-group">
                <label>Fog Message Text</label>
                <input 
                  type="text" 
                  value={project.settings.fogMessage} 
                  onChange={e => updateSettings({ fogMessage: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Map Width</label>
                <input 
                  type="number" 
                  min={10} max={100}
                  value={project.settings.gridWidth} 
                  onChange={e => updateSettings({ gridWidth: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div className="form-group">
                <label>Map Height</label>
                <input 
                  type="number" 
                  min={10} max={100}
                  value={project.settings.gridHeight} 
                  onChange={e => updateSettings({ gridHeight: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div className="form-group">
                <label>Player Health (Strikes)</label>
                <input 
                  type="number" 
                  min={1} max={10}
                  value={project.settings.playerHealth} 
                  onChange={e => updateSettings({ playerHealth: parseInt(e.target.value) || 3 })}
                />
              </div>
              <div className="toggles">
                <label>
                  <input 
                    type="checkbox" 
                    checked={project.settings.dangerRespawns ?? true} 
                    onChange={e => updateSettings({ dangerRespawns: e.target.checked })}
                  /> Danger Respawns After Repelled
                </label>
              </div>
              {project.settings.dangerRespawns && (
                <div className="form-group">
                  <label>Base Respawn Turns (+ random 0–4)</label>
                  <input 
                    type="number" 
                    min={1} max={20}
                    value={project.settings.dangerRespawnTurns ?? 5} 
                    onChange={e => updateSettings({ dangerRespawnTurns: parseInt(e.target.value) || 5 })}
                  />
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'playtest' && <TerminalView />}
      </main>

      {showPublishModal && (
        <PublishModal 
          onClose={() => setShowPublishModal(false)} 
          onPublished={onGoToLibrary}
        />
      )}
    </div>
  );
};

const AppShell: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('library');
  const [playingStory, setPlayingStory] = useState<PublishedStory | null>(null);

  const handlePlayStory = (story: PublishedStory) => {
    setPlayingStory(story);
    setMode('playing');
  };

  if (mode === 'playing' && playingStory) {
    return (
      <StoryPlayer 
        project={playingStory.projectData}
        storyTitle={playingStory.title}
        onBack={() => { setMode('library'); setPlayingStory(null); }}
      />
    );
  }

  if (mode === 'library') {
    return (
      <StoryLibrary 
        onPlayStory={handlePlayStory}
        onOpenEditor={() => setMode('editor')}
      />
    );
  }

  return <EditorLayout onGoToLibrary={() => setMode('library')} />;
};

export default function App() {
  return (
    <ProjectProvider>
      <AppShell />
    </ProjectProvider>
  );
}
