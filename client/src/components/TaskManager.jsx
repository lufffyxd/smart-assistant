// client/src/components/TaskManager.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '' });
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'completed'

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!newTask.title.trim()) return;
    
    try {
      const res = await api.post('/tasks', newTask);
      setTasks([res.data, ...tasks]);
      setNewTask({ title: '', description: '', dueDate: '' });
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTask = async (id, updatedData) => {
    try {
      const res = await api.put(`/tasks/${id}`, updatedData);
      setTasks(tasks.map(task => task._id === id ? res.data : task));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(tasks.filter(task => task._id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.completed;
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return task.dueDate === today;
    }
    return true; // 'all'
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-bg-primary">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 bg-bg-primary overflow-hidden">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Task Manager</h2>
        <div className="bg-bg-secondary rounded-lg p-4 border border-border shadow-sm mb-4">
          <input
            type="text"
            placeholder="Task title"
            className="w-full p-2 mb-2 rounded border border-border bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={newTask.title}
            onChange={(e) => setNewTask({...newTask, title: e.target.value})}
          />
          <textarea
            placeholder="Task description"
            className="w-full p-2 mb-2 rounded border border-border bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            rows="2"
            value={newTask.description}
            onChange={(e) => setNewTask({...newTask, description: e.target.value})}
          />
          <input
            type="date"
            className="w-full p-2 mb-2 rounded border border-border bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={newTask.dueDate}
            onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
          />
          <button
            onClick={createTask}
            className="bg-accent text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-accent-hover transition"
          >
            Create Task
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              filter === 'all' 
                ? 'bg-accent text-white' 
                : 'bg-bg-secondary border border-border text-text-primary hover:bg-bg-primary'
            }`}
          >
            All Tasks
          </button>
          <button
            onClick={() => setFilter('today')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              filter === 'today' 
                ? 'bg-accent text-white' 
                : 'bg-bg-secondary border border-border text-text-primary hover:bg-bg-primary'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              filter === 'completed' 
                ? 'bg-accent text-white' 
                : 'bg-bg-secondary border border-border text-text-primary hover:bg-bg-primary'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-text-secondary">
              {filter === 'today' 
                ? 'No tasks for today.' 
                : filter === 'completed' 
                  ? 'No completed tasks.' 
                  : 'No tasks yet. Create your first task above.'}
            </p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <TaskItem 
              key={task._id} 
              task={task} 
              onUpdate={updateTask} 
              onDelete={deleteTask} 
            />
          ))
        )}
      </div>
    </div>
  );
};

const TaskItem = ({ task, onUpdate, onDelete }) => {
  return (
    <div className={`bg-bg-secondary rounded-lg p-4 border border-border shadow-sm ${
      task.completed ? 'opacity-75' : ''
    }`}>
      <div className="flex items-start">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={(e) => onUpdate(task._id, { completed: e.target.checked })}
          className="mt-1 mr-3 h-5 w-5 text-accent border-border rounded focus:ring-accent"
        />
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-semibold ${
            task.completed ? 'line-through text-text-secondary' : 'text-text-primary'
          }`}>
            {task.title}
          </h3>
          {task.description && (
            <p className={`text-text-secondary whitespace-pre-wrap mt-1 ${
              task.completed ? 'line-through' : ''
            }`}>
              {task.description}
            </p>
          )}
          {task.dueDate && (
            <p className="text-sm text-text-secondary mt-2">
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <button
          onClick={() => onDelete(task._id)}
          className="text-red-500 hover:text-red-700 ml-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TaskManager;