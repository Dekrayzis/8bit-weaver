import React, { useEffect, useState } from 'react';
import type { PublishedStory } from '../../types';
import { getStories, deleteStory } from '../../services/storyLibrary';
import { BookOpen, Trash2, Play, User, MapPin, Package, Clock, Wand2 } from 'lucide-react';

interface StoryLibraryProps {
  onPlayStory: (story: PublishedStory) => void;
  onOpenEditor: () => void;
}

export const StoryLibrary: React.FC<StoryLibraryProps> = ({ onPlayStory, onOpenEditor }) => {
  const [stories, setStories] = useState<PublishedStory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStories = async () => {
    setLoading(true);
    try {
      const result = await getStories();
      setStories(result);
    } catch (err) {
      console.error('Failed to load stories:', err);
    }
    setLoading(false);
  };

  useEffect(() => { loadStories(); }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this published story? This cannot be undone.')) {
      await deleteStory(id);
      await loadStories();
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-GB', { 
      day: 'numeric', month: 'short', year: 'numeric' 
    });
  };

  return (
    <div className="library-view">
      <div className="library-hero">
        <div className="library-hero-content">
          <h1 className="library-title">
            <span className="title-icon">📖</span>
            Story Library
          </h1>
          <p className="library-subtitle">Choose an adventure to play, or create your own.</p>
          <button className="btn-primary btn-glow" onClick={onOpenEditor}>
            <Wand2 size={18} />
            Open Story Editor
          </button>
        </div>
      </div>

      <div className="library-content">
        {loading ? (
          <div className="library-loading">
            <div className="loading-spinner" />
            <p>Loading stories...</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="library-empty">
            <BookOpen size={64} strokeWidth={1} />
            <h2>No stories published yet</h2>
            <p>Create your first text adventure in the editor and publish it to see it here.</p>
            <button className="btn-primary" onClick={onOpenEditor}>
              <Wand2 size={16} /> Create a Story
            </button>
          </div>
        ) : (
          <>
            <h2 className="section-title">Published Adventures</h2>
            <div className="story-grid">
              {stories.map(story => (
                <div 
                  key={story.id} 
                  className="story-card"
                  onClick={() => onPlayStory(story)}
                >
                  <div className="story-card-image">
                    {story.thumbnailUrl ? (
                      <img src={story.thumbnailUrl} alt={story.title} />
                    ) : (
                      <div className="story-card-placeholder">
                        <BookOpen size={40} strokeWidth={1} />
                      </div>
                    )}
                    <div className="story-card-play-overlay">
                      <Play size={40} fill="white" />
                    </div>
                  </div>
                  <div className="story-card-body">
                    <h3 className="story-card-title">{story.title}</h3>
                    <p className="story-card-description">{story.description}</p>
                    <div className="story-card-meta">
                      <span><User size={12} /> {story.author}</span>
                      <span><MapPin size={12} /> {story.roomCount} rooms</span>
                      <span><Package size={12} /> {story.itemCount} items</span>
                    </div>
                    <div className="story-card-footer">
                      <span className="story-card-date">
                        <Clock size={12} /> {formatDate(story.updatedAt)}
                      </span>
                      <button 
                        className="story-card-delete" 
                        onClick={(e) => handleDelete(e, story.id)}
                        title="Delete story"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
