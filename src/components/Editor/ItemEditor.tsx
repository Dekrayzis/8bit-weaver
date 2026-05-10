import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { TextInput, Checkbox, TextArea } from './Shared';

export const ItemEditor: React.FC = () => {
  const { project, addItem, updateItem, deleteItem } = useProject();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const itemsList = Object.values(project.items);
  const selectedItem = selectedId ? project.items[selectedId] : null;

  const handleCreate = () => {
    const id = `item_${Date.now()}`;
    addItem({
      id,
      name: 'New Item',
      aliases: [],
      description: 'A new item.',
      portable: true,
      canBeUsed: false
    });
    setSelectedId(id);
  };

  return (
    <div className="item-editor">
      <div className="sidebar">
        <h3>Items</h3>
        <ul>
          {itemsList.map(item => (
            <li 
              key={item.id} 
              className={selectedId === item.id ? 'active' : ''}
              onClick={() => setSelectedId(item.id)}
            >
              {item.name}
            </li>
          ))}
        </ul>
        <button onClick={handleCreate}>+ Add Item</button>
      </div>
      
      <div className="editor-content">
        {selectedItem ? (
          <div className="form-container">
            <h2>Edit Item</h2>
            <TextInput label="ID" value={selectedItem.id} readOnly />
            <TextInput label="Name" value={selectedItem.name} onChange={v => updateItem(selectedItem.id, { name: v })} />
            <TextInput 
              label="Aliases (comma separated)" 
              value={selectedItem.aliases.join(', ')} 
              onChange={v => updateItem(selectedItem.id, { aliases: v.split(',').map(s => s.trim()).filter(Boolean) })} 
            />
            
            <TextArea 
              label="Description" 
              value={selectedItem.description} 
              onChange={v => updateItem(selectedItem.id, { description: v })} 
            />
            
            <TextInput 
              label="Starting Room ID" 
              value={selectedItem.startingRoomId || ''} 
              placeholder="Leave blank for player inventory"
              onChange={v => updateItem(selectedItem.id, { startingRoomId: v || undefined })} 
            />
            
            <div className="toggles">
              <Checkbox label="Portable" checked={selectedItem.portable} onChange={v => updateItem(selectedItem.id, { portable: v })} />
              <Checkbox label="Can Be Used" checked={selectedItem.canBeUsed} onChange={v => updateItem(selectedItem.id, { canBeUsed: v })} />
              {selectedItem.canBeUsed && (
                <Checkbox label="Consume On Use" checked={selectedItem.consumeOnUse || false} onChange={v => updateItem(selectedItem.id, { consumeOnUse: v })} />
              )}
            </div>

            {selectedItem.canBeUsed && (
              <>
                <TextInput label="Use Text" value={selectedItem.useText || ''} onChange={v => updateItem(selectedItem.id, { useText: v })} />
                <TextInput label="Sets Flag on Use" value={selectedItem.effectFlag || ''} placeholder="e.g. door_unlocked" onChange={v => updateItem(selectedItem.id, { effectFlag: v })} />
              </>
            )}

            <button className="danger-btn mt-6" onClick={() => {
              deleteItem(selectedItem.id);
              setSelectedId(null);
            }}>
              Delete Item
            </button>
          </div>
        ) : (
          <div className="empty-state">Select an item to edit</div>
        )}
      </div>
    </div>
  );
};
