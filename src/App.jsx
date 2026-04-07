import { useState, useEffect } from 'react';
import Login from "./components/Login";

const API_URL = 'http://localhost:5000/api';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' });
  const [isHovering, setIsHovering] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  // ✅ Fetch tasks after login
  useEffect(() => {
    if (token) {
      fetchTasks(token);
    }
  }, [token]);

  const fetchTasks = async (authToken = token) => {
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // ✅ Show login page
  if (!token) {
    return <Login setToken={setToken} />;
  }

  // ✅ Add Task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(newTask)
      });
      if (response.ok) {
        setNewTask({ title: '', description: '', priority: 'medium' });
        fetchTasks();
      }
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  // ✅ Delete Task
  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/tasks/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // ✅ Toggle Complete
  const toggleComplete = async (task) => {
    try {
      await fetch(`${API_URL}/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed: !task.completed })
      });
      fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#242424] text-[#rgba(255,255,255,0.87)] font-sans py-12 px-4 selection:bg-purple-500/30">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        
        {/* Header */}
        <div 
          className="mb-10 text-center flex flex-col items-center"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className={`text-6xl text-purple-500 transition-all duration-500 transform ${isHovering ? 'scale-110 drop-shadow-[0_0_2em_#646cffaa]' : ''}`}>
            <i className="fas fa-layer-group"></i>
          </div>

          <h1 className="text-5xl font-bold mt-6 tracking-tight text-white">
            Task Master
          </h1>

          {/* ✅ Logout (small, clean, does not disturb UI) */}
          <div className="mt-3">
            <button
              onClick={() => {
                localStorage.removeItem("token");
                setToken("");
              }}
              className="text-red-400 border border-red-400 px-3 py-1 rounded hover:bg-red-500 hover:text-white transition text-sm"
            >
              Logout
            </button>
          </div>

          <p className="mt-4 text-gray-400 font-medium">
            Manage your workload 
            <span className="text-purple-400 bg-[#1a1a1a] px-2 py-1 rounded text-sm ml-1 border border-gray-700">
              efficiently
            </span>
          </p>
        </div>

        <div className="w-full flex flex-col md:flex-row gap-6">
          
          {/* Add Task Form */}
          <div className="w-full md:w-1/3 bg-[#1a1a1a] border border-[#333] rounded-xl p-6 shadow-2xl transition-all hover:border-[#646cff] duration-300 group h-fit">
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2 text-white">
              <i className="fas fa-plus-circle text-purple-500"></i> New Task
            </h2>
            
            <form onSubmit={handleAddTask} className="flex flex-col gap-4">
              <input 
                type="text" 
                placeholder="What needs to be done?"
                required 
                className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-4 py-3 text-white"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              />

              <textarea 
                placeholder="Description (optional)"
                rows="2"
                className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-4 py-3 text-white"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              ></textarea>

              <select 
                className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-4 py-2 text-gray-300"
                value={newTask.priority}
                onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>

              <button 
                type="submit" 
                className="mt-2 w-full bg-[#1a1a1a] text-gray-200 border border-transparent hover:border-[#646cff] hover:text-[#646cff] py-3 rounded-lg flex justify-center items-center gap-2"
              >
                <i className="fas fa-bolt"></i> Add to System
              </button>
            </form>
          </div>

          {/* Task List */}
          <div className="w-full md:w-2/3 flex flex-col gap-4">
            {tasks.length === 0 ? (
              <div className="h-full bg-[#1a1a1a] border border-[#333] rounded-xl flex flex-col items-center justify-center p-10 text-gray-500">
                <i className="fas fa-clipboard-list text-4xl mb-3 opacity-50"></i>
                <p>No tasks found. System is clear.</p>
              </div>
            ) : (
              tasks.map(task => (
                <div 
                  key={task._id} 
                  className={`bg-[#1a1a1a] border rounded-xl p-5 flex items-start justify-between ${
                    task.priority === 'high' ? 'border-red-900/50' : 'border-[#333]'
                  }`}
                >
                  <div className="flex gap-4 items-start">
                    <button 
                      onClick={() => toggleComplete(task)}
                      className="w-6 h-6 rounded-full border flex items-center justify-center"
                    >
                      {task.completed && <i className="fas fa-check text-xs"></i>}
                    </button>

                    <div>
                      <h3 className="text-white">{task.title}</h3>
                      {task.description && <p className="text-gray-400">{task.description}</p>}
                      <span className="text-sm text-yellow-400">{task.priority}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDelete(task._id)} 
                    className="text-gray-500 hover:text-red-500"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;