// client/src/components/NotesSection.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const NotesSection = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState({ title: '', content: '' });

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const res = await api.get('/notes');
      setNotes(res.data);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;
    
    try {
      const res = await api.post('/notes', newNote);
      setNotes([res.data, ...notes]);
      setNewNote({ title: '', content: '' });
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const updateNote = async (id, updatedData) => {
    try {
      const res = await api.put(`/notes/${id}`, updatedData);
      setNotes(notes.map(note => note._id === id ? res.data : note));
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const deleteNote = async (id) => {
    try {
      await api.delete(`/notes/${id}`);
      setNotes(notes.filter(note => note._id !== id));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-bg-primary">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 bg-bg-primary overflow-hidden">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Block Notes</h2>
        <div className="bg-bg-secondary rounded-lg p-4 border border-border shadow-sm">
          <input
            type="text"
            placeholder="Note title"
            className="w-full p-2 mb-2 rounded border border-border bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={newNote.title}
            onChange={(e) => setNewNote({...newNote, title: e.target.value})}
          />
          <textarea
            placeholder="Note content"
            className="w-full p-2 mb-2 rounded border border-border bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            rows="3"
            value={newNote.content}
            onChange={(e) => setNewNote({...newNote, content: e.target.value})}
          />
          <button
            onClick={createNote}
            className="bg-accent text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-accent-hover transition"
          >
            Create Note
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {notes.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-text-secondary">No notes yet. Create your first note above.</p>
          </div>
        ) : (
          notes.map(note => (
            <NoteItem 
              key={note._id} 
              note={note} 
              onUpdate={updateNote} 
              onDelete={deleteNote} 
            />
          ))
        )}
      </div>
    </div>
  );
};

const NoteItem = ({ note, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(note.title);
  const [editedContent, setEditedContent] = useState(note.content);

  const handleSave = () => {
    onUpdate(note._id, { title: editedTitle, content: editedContent });
    setIsEditing(false);
  };

  return (
    <div className="bg-bg-secondary rounded-lg p-4 border border-border shadow-sm">
      {isEditing ? (
        <>
          <input
            type="text"
            className="w-full p-2 mb-2 rounded border border-border bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
          />
          <textarea
            className="w-full p-2 mb-2 rounded border border-border bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            rows="4"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="bg-bg-primary border border-border text-text-primary py-1 px-3 rounded-lg text-sm font-medium hover:bg-bg-secondary transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-accent text-white py-1 px-3 rounded-lg text-sm font-medium hover:bg-accent-hover transition"
            >
              Save
            </button>
          </div>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-text-primary mb-2">{note.title}</h3>
          <p className="text-text-secondary whitespace-pre-wrap mb-4">{note.content}</p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => onDelete(note._id)}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Delete
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="text-accent hover:text-accent-hover text-sm font-medium"
            >
              Edit
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default NotesSection;