import type { ProjectState, PublishedStory } from '../types';

const DB_NAME = 'eight-bit-weaver';
const DB_VERSION = 1;
const STORE_NAME = 'stories';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('publishedAt', 'publishedAt', { unique: false });
        store.createIndex('title', 'title', { unique: false });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveStory(project: ProjectState): Promise<string> {
  const db = await openDB();
  
  const startRoom = Object.values(project.rooms).find(r => r.isStart);
  const thumbnailUrl = startRoom?.imageUrl || undefined;
  
  // Check if story with same title exists to update it
  const existingStories = await getStories();
  const existing = existingStories.find(s => s.title === (project.settings.storyTitle || 'Untitled'));
  
  const story: PublishedStory = {
    id: existing?.id || `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: project.settings.storyTitle || 'Untitled',
    author: project.settings.storyAuthor || 'Anonymous',
    description: project.settings.storyDescription || 'A text adventure.',
    roomCount: Object.keys(project.rooms).length,
    itemCount: Object.keys(project.items).length,
    publishedAt: existing?.publishedAt || Date.now(),
    updatedAt: Date.now(),
    thumbnailUrl,
    projectData: project
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(story);
    request.onsuccess = () => resolve(story.id);
    request.onerror = () => reject(request.error);
  });
}

export async function getStories(): Promise<PublishedStory[]> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const stories = request.result as PublishedStory[];
      stories.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(stories);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function loadStory(id: string): Promise<PublishedStory | null> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteStory(id: string): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
