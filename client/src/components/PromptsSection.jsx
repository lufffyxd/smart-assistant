import React, { useState, useEffect } from 'react';
import api from '../services/api';

const PromptsSection = () => {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const res = await api.get('/prompts');
      setPrompts(res.data);
    } catch (error) {
      console.error('Error loading prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPrompt = async () => {
    const title = prompt('Enter prompt title:');
    const promptText = prompt('Enter custom prompt:');
    
    if (title && promptText) {
      try {
        const res = await api.post('/prompts', { title, prompt: promptText });
        setPrompts([res.data, ...prompts]);
      } catch (error) {
        console.error('Error creating prompt:', error);
      }
    }
  };

  const updatePrompt = async (id, title, promptText) => {
    try {
      await api.put(`/prompts/${id}`, { title, prompt: promptText });
      setPrompts(prompts.map(p => 
        p._id === id ? { ...p, title, prompt: promptText } : p
      ));
    } catch (error) {
      console.error('Error updating prompt:', error);
    }
  };

  const deletePrompt = async (id) => {
    try {
      await api.delete(`/prompts/${id}`);
      setPrompts(prompts.filter(prompt => prompt._id !== id));
    } catch (error) {
      console.error('Error deleting prompt:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading prompts...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Custom Prompts</h2>
          <button
            onClick={createPrompt}
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Prompt
          </button>
        </div>
        
        {prompts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No custom prompts</h3>
            <p className="text-gray-600">Create custom prompts to guide your AI assistant</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prompts.map(prompt => (
              <div key={prompt._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-lg text-gray-800 mb-2">{prompt.title}</h3>
                <p className="text-gray-600 mb-4">{prompt.prompt}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {new Date(prompt.createdAt).toLocaleDateString()}
                  </span>
                  <div className="space-x-2">
                    <button 
                      onClick={() => {
                        const newTitle = prompt('Edit title:', prompt.title);
                        const newPrompt = prompt('Edit prompt:', prompt.prompt);
                        if (newTitle && newPrompt) {
                          updatePrompt(prompt._id, newTitle, newPrompt);
                        }
                      }}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => deletePrompt(prompt._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptsSection;