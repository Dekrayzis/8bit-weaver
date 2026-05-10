import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { generateAllRoomImages, type ImageGenerationProgress } from '../../services/imageService';
import { saveStory } from '../../services/storyLibrary';
import { X, Sparkles, BookOpen, AlertTriangle, Check, Loader } from 'lucide-react';

interface PublishModalProps {
  onClose: () => void;
  onPublished: () => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({ onClose, onPublished }) => {
  const { project, updateSettings, updateRoom } = useProject();
  const [step, setStep] = useState<'metadata' | 'options' | 'generating' | 'done' | 'error'>('metadata');
  const [generateImages, setGenerateImages] = useState(true);
  const [skipExisting, setSkipExisting] = useState(true);
  const [progress, setProgress] = useState<ImageGenerationProgress | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [title, setTitle] = useState(project.settings.storyTitle || '');
  const [author, setAuthor] = useState(project.settings.storyAuthor || '');
  const [description, setDescription] = useState(project.settings.storyDescription || '');

  const roomCount = Object.keys(project.rooms).length;
  const roomsWithImages = Object.values(project.rooms).filter(r => r.imageUrl).length;
  const roomsNeedingImages = skipExisting ? roomCount - roomsWithImages : roomCount;
  
  const estimatedCost = roomsNeedingImages * 0.04;

  const hasApiKey = !!project.settings.openaiApiKey;

  const handleMetadataNext = () => {
    updateSettings({ storyTitle: title, storyAuthor: author, storyDescription: description });
    setStep('options');
  };

  const handlePublish = async () => {
    updateSettings({ storyTitle: title, storyAuthor: author, storyDescription: description });

    if (generateImages && hasApiKey) {
      setStep('generating');
      
      try {
        const results = await generateAllRoomImages(
          project.rooms,
          project.settings.openaiApiKey!,
          project.settings.imageStyle || 'pixel-art',
          project.settings.imageModel || 'dall-e-3',
          setProgress,
          skipExisting
        );

        // Save generated images back to project
        for (const [roomId, imageUrl] of Object.entries(results)) {
          updateRoom(roomId, { imageUrl });
        }

        // Small delay to let state propagate
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Image generation failed');
        setStep('error');
        return;
      }
    }

    // Save to library
    try {
      await saveStory({
        ...project,
        settings: { ...project.settings, storyTitle: title, storyAuthor: author, storyDescription: description }
      });
      setStep('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save story');
      setStep('error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content publish-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        
        {step === 'metadata' && (
          <>
            <div className="modal-header">
              <BookOpen size={24} />
              <h2>Publish Your Story</h2>
            </div>
            <p className="modal-subtitle">Fill in your story details before publishing to the library.</p>
            
            <div className="form-group">
              <label>Story Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                placeholder="The Enchanted Dungeon"
              />
            </div>
            <div className="form-group">
              <label>Author</label>
              <input 
                type="text" 
                value={author} 
                onChange={e => setAuthor(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                placeholder="A brief description of your adventure..."
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
              <button 
                className="btn-primary" 
                onClick={handleMetadataNext}
                disabled={!title.trim()}
              >
                Next
              </button>
            </div>
          </>
        )}

        {step === 'options' && (
          <>
            <div className="modal-header">
              <Sparkles size={24} />
              <h2>Image Generation</h2>
            </div>
            
            <div className="publish-stats">
              <div className="stat"><span className="stat-value">{roomCount}</span><span className="stat-label">Rooms</span></div>
              <div className="stat"><span className="stat-value">{Object.keys(project.items).length}</span><span className="stat-label">Items</span></div>
              <div className="stat"><span className="stat-value">{roomsWithImages}</span><span className="stat-label">Have Images</span></div>
            </div>

            {!hasApiKey && (
              <div className="publish-warning">
                <AlertTriangle size={16} />
                <span>No OpenAI API key set. Add one in Global Settings to enable AI image generation.</span>
              </div>
            )}

            <div className="toggles" style={{ marginTop: 16 }}>
              <label>
                <input 
                  type="checkbox" 
                  checked={generateImages && hasApiKey}
                  disabled={!hasApiKey}
                  onChange={e => setGenerateImages(e.target.checked)}
                />
                Generate AI room images
              </label>
              {generateImages && hasApiKey && (
                <label style={{ marginLeft: 24 }}>
                  <input 
                    type="checkbox" 
                    checked={skipExisting}
                    onChange={e => setSkipExisting(e.target.checked)}
                  />
                  Skip rooms that already have images
                </label>
              )}
            </div>

            {generateImages && hasApiKey && roomsNeedingImages > 0 && (
              <div className="cost-estimate">
                <span>Estimated cost: </span>
                <strong>${estimatedCost.toFixed(2)}</strong>
                <span className="cost-detail"> ({roomsNeedingImages} images × $0.04)</span>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setStep('metadata')}>Back</button>
              <button className="btn-primary" onClick={handlePublish}>
                <BookOpen size={16} />
                {generateImages && hasApiKey && roomsNeedingImages > 0 ? 'Generate & Publish' : 'Publish'}
              </button>
            </div>
          </>
        )}

        {step === 'generating' && progress && (
          <>
            <div className="modal-header">
              <Loader size={24} className="spin" />
              <h2>Generating Images...</h2>
            </div>
            <p className="modal-subtitle">Creating artwork for: <strong>{progress.currentRoomName}</strong></p>
            
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <p className="progress-text">{progress.current} of {progress.total}</p>
            <p className="hint" style={{ textAlign: 'center' }}>This may take a moment. Please don't close this window.</p>
          </>
        )}

        {step === 'done' && (
          <>
            <div className="modal-header success">
              <Check size={24} />
              <h2>Published!</h2>
            </div>
            <p className="modal-subtitle">"{title}" is now available in the Story Library.</p>
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => { onPublished(); onClose(); }}>
                View Library
              </button>
            </div>
          </>
        )}

        {step === 'error' && (
          <>
            <div className="modal-header error">
              <AlertTriangle size={24} />
              <h2>Error</h2>
            </div>
            <p className="modal-subtitle error-text">{errorMsg}</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setStep('options')}>Back</button>
              <button className="btn-primary" onClick={handlePublish}>Retry</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
