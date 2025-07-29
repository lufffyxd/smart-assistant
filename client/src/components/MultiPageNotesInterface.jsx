// client/src/components/MultiPageNotesInterface.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Make sure this points to your api.js

const MultiPageNotesInterface = ({ windowId, windowTitle, onBackToDashboard }) => {
  const [notes, setNotes] = useState(null); // State for the entire note object
  const [currentPageIndex, setCurrentPageIndex] = useState(0); // Index of the currently selected page
  const [isEditingTitle, setIsEditingTitle] = useState(false); // For inline page title editing
  const [newPageTitle, setNewPageTitle] = useState(''); // For creating new page title
  const [showNewPageInput, setShowNewPageInput] = useState(false); // Toggle for new page input
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Load notes data on component mount
  useEffect(() => {
    const loadNotes = async () => {
      setIsLoading(true);
      setError('');
      try {
        // 1. Try to fetch existing notes for this windowId
        const res = await api.get(`/notes/window/${windowId}`);
        console.log("Notes loaded:", res.data);
        setNotes(res.data);
        // Set the first page as active if pages exist
        if (res.data.pages && res.data.pages.length > 0) {
            setCurrentPageIndex(0);
        } else {
            // If no pages, maybe create a default one? Or handle empty state in UI.
            setCurrentPageIndex(-1); // Indicate no pages
        }
      } catch (err) {
        // 2. If not found, create a new note entity for this window
        if (err.response && err.response.status === 404) {
            console.log("Notes not found for window, creating new...");
            try {
                const createRes = await api.post('/notes', {
                    windowId: windowId,
                    // Initial page can be created on the backend or here
                    // Let's assume backend creates a default page
                });
                console.log("New notes created:", createRes.data);
                setNotes(createRes.data);
                setCurrentPageIndex(-1); // Or 0 if backend created a page
            } catch (createErr) {
                console.error("Error creating new notes:", createErr);
                setError('Failed to initialize notes.');
            }
        } else {
            console.error("Error loading notes:", err);
            setError('Failed to load notes.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, [windowId]);

  // Handler for content changes in the editor
  const handleContentChange = async (newContent) => {
    if (!notes || currentPageIndex < 0 || currentPageIndex >= notes.pages.length) return;

    const pageId = notes.pages[currentPageIndex]._id;
    const currentContent = notes.pages[currentPageIndex].content;

    // Only update if content has actually changed
    if (newContent !== currentContent) {
      try {
        // Update content on the backend
        await api.put(`/notes/${notes._id}/pages/${pageId}`, {
          content: newContent
        });
        // Optimistically update local state
        const updatedPages = [...notes.pages];
        updatedPages[currentPageIndex] = {
          ...updatedPages[currentPageIndex],
          content: newContent,
          updatedAt: new Date() // Update timestamp locally
        };
        setNotes({ ...notes, pages: updatedPages });
      } catch (err) {
        console.error("Error updating page content:", err);
        setError('Failed to save content.');
        // Optionally, revert the local state change if the backend update failed
      }
    }
  };

  // Handler for adding a new page
  const handleAddPage = async () => {
    if (!newPageTitle.trim() || !notes) return;

    try {
      const res = await api.post(`/notes/${notes._id}/pages`, {
        title: newPageTitle
      });
      // Update local state with the new page
      const updatedNotes = {
        ...notes,
        pages: [...notes.pages, res.data.page] // Assuming backend returns { page: ... }
      };
      setNotes(updatedNotes);
      setCurrentPageIndex(updatedNotes.pages.length - 1); // Switch to the new page
      setNewPageTitle(''); // Clear input
      setShowNewPageInput(false); // Hide input
    } catch (err) {
      console.error("Error adding new page:", err);
      setError('Failed to add new page.');
    }
  };

  // Handler for deleting a page
  const handleDeletePage = async (pageIndex) => {
    if (!notes || notes.pages.length <= 1) {
        alert("You must have at least one page.");
        return;
    }

    const pageId = notes.pages[pageIndex]._id;
    const pageTitle = notes.pages[pageIndex].title;

    if (!window.confirm(`Are you sure you want to delete the page "${pageTitle}"?`)) {
        return;
    }

    try {
      await api.delete(`/notes/${notes._id}/pages/${pageId}`);
      // Update local state
      const updatedPages = notes.pages.filter((_, i) => i !== pageIndex);
      setNotes({ ...notes, pages: updatedPages });
      
      // Adjust current page index if necessary
      if (pageIndex === currentPageIndex) {
        // If we deleted the current page, switch to the previous one or the first one
        setCurrentPageIndex(updatedPages.length > 0 ? Math.max(0, pageIndex - 1) : -1);
      } else if (pageIndex < currentPageIndex) {
        // If we deleted a page before the current one, adjust the index
        setCurrentPageIndex(currentPageIndex - 1);
      }
      // If we deleted a page after the current one, current index is still valid
    } catch (err) {
      console.error("Error deleting page:", err);
      setError('Failed to delete page.');
    }
  };

  // Handler for switching pages
  const handleSwitchPage = (pageIndex) => {
    setCurrentPageIndex(pageIndex);
  };

  // Handler for renaming a page (inline edit)
  const handleRenamePage = async (pageIndex, newTitle) => {
    if (!notes || !newTitle.trim()) return;

    const pageId = notes.pages[pageIndex]._id;
    const oldTitle = notes.pages[pageIndex].title;

    if (newTitle === oldTitle) {
        setIsEditingTitle(false);
        return; // No change
    }

    try {
      await api.put(`/notes/${notes._id}/pages/${pageId}`, {
        title: newTitle
      });
      // Update local state
      const updatedPages = [...notes.pages];
      updatedPages[pageIndex] = {
        ...updatedPages[pageIndex],
        title: newTitle
      };
      setNotes({ ...notes, pages: updatedPages });
    } catch (err) {
      console.error("Error renaming page:", err);
      setError('Failed to rename page.');
      // Optionally, revert the local title change
    } finally {
      setIsEditingTitle(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-bg-primary">
        <div className="bg-bg-secondary border-b border-border p-4 flex items-center">
          <button
            onClick={onBackToDashboard}
            className="mr-4 p-2 rounded-md hover:bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            ← Dashboard
          </button>
          <h2 className="text-xl font-bold text-text-primary">{windowTitle}</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading notes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col bg-bg-primary">
        <div className="bg-bg-secondary border-b border-border p-4 flex items-center">
          <button
            onClick={onBackToDashboard}
            className="mr-4 p-2 rounded-md hover:bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            ← Dashboard
          </button>
          <h2 className="text-xl font-bold text-text-primary">{windowTitle}</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error! </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  // Determine current page content
  const currentPage = notes && notes.pages && notes.pages[currentPageIndex];
  const currentPageContent = currentPage ? currentPage.content : '';

  return (
    <div className="flex-1 flex flex-col bg-bg-primary h-full">
      {/* Header */}
      <div className="bg-bg-secondary border-b border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center">
          <button
            onClick={onBackToDashboard}
            className="mr-4 p-2 rounded-md hover:bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent text-sm"
          >
            ← Dashboard
          </button>
          <h2 className="text-xl font-bold text-text-primary truncate">{windowTitle}</h2>
        </div>
        <div className="flex items-center space-x-2">
          {/* Add Page Button */}
          {showNewPageInput ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                placeholder="Page title"
                className="p-1 rounded border border-border bg-bg-primary text-text-primary text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddPage();
                  } else if (e.key === 'Escape') {
                    setShowNewPageInput(false);
                    setNewPageTitle('');
                  }
                }}
              />
              <button
                onClick={handleAddPage}
                className="bg-accent text-white p-1 rounded text-xs"
                disabled={!newPageTitle.trim()}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowNewPageInput(false);
                  setNewPageTitle('');
                }}
                className="bg-bg-primary border border-border text-text-secondary p-1 rounded text-xs"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewPageInput(true)}
              className="bg-accent text-white py-1 px-3 rounded-lg text-sm font-medium hover:bg-accent-hover transition flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Page
            </button>
          )}
        </div>
      </div>

      {/* Pages List / Tabs */}
      {notes && notes.pages && notes.pages.length > 0 && (
        <div className="bg-bg-secondary border-b border-border p-2 flex overflow-x-auto">
          {notes.pages.map((page, index) => (
            <div
              key={page._id}
              className={`flex items-center py-2 px-3 mr-1 rounded-t-lg cursor-pointer text-sm ${
                index === currentPageIndex
                  ? 'bg-bg-primary border-t border-l border-r border-border text-text-primary font-medium'
                  : 'bg-bg-secondary hover:bg-bg-primary text-text-secondary'
              }`}
            >
              {isEditingTitle && index === currentPageIndex ? (
                <input
                  type="text"
                  value={page.title}
                  onChange={(e) => {
                    const updatedPages = [...notes.pages];
                    updatedPages[index] = { ...updatedPages[index], title: e.target.value };
                    setNotes({ ...notes, pages: updatedPages });
                  }}
                  onBlur={() => handleRenamePage(index, page.title)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRenamePage(index, page.title);
                    } else if (e.key === 'Escape') {
                      // Revert to original title
                      const updatedPages = [...notes.pages];
                      updatedPages[index] = { ...updatedPages[index], title: notes.pages[index].title };
                      setNotes({ ...notes, pages: updatedPages });
                      setIsEditingTitle(false);
                    }
                  }}
                  className="bg-transparent border-b border-accent focus:outline-none"
                  autoFocus
                />
              ) : (
                <span
                  onClick={() => handleSwitchPage(index)}
                  onDoubleClick={() => {
                    if (index === currentPageIndex) setIsEditingTitle(true);
                  }}
                  className="truncate max-w-xs"
                >
                  {page.title}
                </span>
              )}
              {index === currentPageIndex && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent switching page when clicking delete
                    handleDeletePage(index);
                  }}
                  className="ml-2 text-text-secondary hover:text-red-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {notes && notes.pages && notes.pages.length > 0 ? (
          <>
            {/* Page Title Bar */}
            <div className="bg-bg-secondary border-b border-border p-2 px-4 flex items-center">
              <span className="text-text-secondary text-sm">
                {currentPage ? `Editing: ${currentPage.title}` : 'No page selected'}
              </span>
            </div>
            {/* Editor */}
            <div className="flex-1 overflow-hidden">
              {/* Using a simple textarea for now. Replace with Quill/Rich Text Editor if needed */}
              <textarea
                value={currentPageContent}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Start typing your note here..."
                className="w-full h-full p-4 bg-bg-primary text-text-primary border-none focus:outline-none resize-none"
              />
            </div>
          </>
        ) : (
          // Empty State
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <svg className="w-16 h-16 text-text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-text-primary mb-2">No Pages Yet</h3>
            <p className="text-text-secondary mb-4">Create your first page to start taking notes.</p>
            {!showNewPageInput && (
              <button
                onClick={() => setShowNewPageInput(true)}
                className="bg-accent text-white py-2 px-4 rounded-lg font-medium hover:bg-accent-hover transition"
              >
                Create First Page
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiPageNotesInterface;
