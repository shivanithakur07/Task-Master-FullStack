import { useState, useEffect } from 'react';
import Login from "./components/Login";
import './index.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', status: 'todo' });
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [activeTab, setActiveTab] = useState('Tasks');

  // Fetch tasks
  useEffect(() => {
    if (token) fetchTasks(token);
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

  if (!token) {
    return <Login setToken={setToken} />;
  }

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newTask)
      });
      if (response.ok) {
        setNewTask({ title: '', description: '', priority: 'medium', status: 'todo' });
        fetchTasks();
      }
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) {
      console.error("Error updating task:", error);
      fetchTasks(); // Revert on error
    }
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('taskId'), 10);
    if (!isNaN(taskId)) {
      updateTaskStatus(taskId, status);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/tasks/${id}`, { 
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const columns = [
    { id: 'backlog', title: 'BACKLOG', colorClass: 'glow-cyan', textClass: 'text-[#00f0ff]' },
    { id: 'todo', title: 'TO DO', colorClass: 'glow-purple', textClass: 'text-[#b05bff]' },
    { id: 'in_progress', title: 'IN PROGRESS', colorClass: 'glow-yellow', textClass: 'text-[#ffde00]' },
    { id: 'done', title: 'DONE', colorClass: 'glow-green', textClass: 'text-[#00ff66]' }
  ];

  return (
    <div className="flex bg-[#0f111a] text-white min-h-screen font-sans overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-64 glass-panel border-r border-[#ffffff10] flex flex-col pt-6 rounded-none z-10 m-3 mr-0">
        <div className="px-6 pb-6 text-3xl font-bold tracking-tighter">
          Task<span className="text-[#00f0ff]">Master</span>
        </div>
        <div className="flex flex-col gap-2 px-4 mt-6">
          {['Projects', 'Tasks', 'Calendar', 'Team', 'Reports'].map(tab => {
             const icons = { 'Projects': 'folder', 'Tasks': 'check-square', 'Calendar': 'calendar', 'Team': 'users', 'Reports': 'chart-line' };
             const isActive = activeTab === tab;
             return (
               <div 
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${isActive ? 'text-[#00f0ff] bg-white/5 shadow-lg shadow-cyan-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
               >
                 <i className={`fas fa-${icons[tab]}`}></i> {tab}
               </div>
             )
          })}
        </div>
        <div className="mt-auto px-4 pb-6">
          <div className="text-gray-500 text-xs uppercase tracking-widest pl-4 mb-2">System</div>
          <div 
             onClick={() => { localStorage.removeItem("token"); setToken(""); }}
             className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer transition-all"
          >
             <i className="fas fa-sign-out-alt"></i> Logout
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'Tasks' ? (
      <>
        <div className="flex-1 flex flex-col p-8 overflow-y-auto">
          {/* Header Record */}
          <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Welcome back, Developer!</h1>
            <div className="text-sm text-gray-400">
               <span className="text-[#00f0ff] mr-4"><i className="fas fa-bolt"></i> Active sync</span>
               Total Tasks: {tasks.length} | Completed: {tasks.filter(t => t.status === 'done').length} | Pending: {tasks.filter(t => t.status !== 'done').length}
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('Projects')}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold py-2 px-6 rounded-full shadow-lg shadow-cyan-500/30 transition-all flex items-center gap-2"
          >
            <i className="fas fa-plus"></i> New Project
          </button>
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleAddTask} className="glass-panel p-4 mb-8 flex gap-4 items-center">
          <input 
            type="text" required placeholder="Quick add task..."
            className="flex-1 bg-transparent border-none text-xl focus:ring-0 shadow-none px-2"
            value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})}
          />
          <select 
            className="bg-[#1f2130] border-[#ffffff10] rounded-lg px-3 py-2 text-sm text-gray-300 h-full"
            value={newTask.status} onChange={e => setNewTask({...newTask, status: e.target.value})}
          >
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <button type="submit" className="p-3 w-12 h-12 bg-white/5 hover:bg-[#00f0ff]/20 text-[#00f0ff] rounded-full transition-all flex items-center justify-center">
             <i className="fas fa-arrow-right"></i>
          </button>
        </form>

        {/* Kanban Board */}
        <div className="grid grid-cols-4 gap-6 min-h-[60vh]">
          {columns.map(col => (
            <div 
              key={col.id} 
              className="flex flex-col bg-[#161824]/50 border border-[#ffffff05] rounded-xl p-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
               <div className="flex items-center justify-between mb-4 px-1">
                 <h3 className={`font-semibold text-sm tracking-widest uppercase ${col.textClass}`}>
                   {col.title} <span className="text-white/40 ml-2 bg-white/10 px-2 py-0.5 rounded-full text-xs">{tasks.filter(t => t.status === col.id).length}</span>
                 </h3>
                 <button className="text-gray-500 hover:text-white"><i className="fas fa-ellipsis-h"></i></button>
               </div>
               
               <div className="flex flex-col gap-4 flex-1">
                 {tasks.filter(t => t.status === col.id).map((task, i) => (
                   <div key={task.id} className={`glass-panel p-4 animate-slide-in ${col.colorClass} hover:-translate-y-1 transition-transform cursor-pointer relative group`} style={{ animationDelay: `${i * 50}ms` }}>
                      <button onClick={() => handleDelete(task.id)} className="absolute top-3 right-3 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                         <i className="fas fa-times"></i>
                      </button>
                      <h4 className="font-semibold text-gray-100 mb-2 pr-6">{task.title}</h4>
                      <p className="text-xs text-gray-400 mb-4 line-clamp-2">{task.description || "No description"}</p>
                      
                      <div className="flex justify-between items-center mt-auto">
                        <div className="flex gap-2 text-[10px] font-medium tracking-wide uppercase">
                           <span className={`px-2 py-1 rounded bg-[#1f2130] border border-[#ffffff10] ${task.priority === 'high' ? 'text-red-400' : task.priority === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                              {task.priority}
                           </span>
                        </div>
                        <div className="relative">
                          {col.id !== 'done' && (
                             <button onClick={() => updateTaskStatus(task.id, 'done')} className="w-7 h-7 bg-white/5 hover:bg-green-500/20 text-gray-400 hover:text-green-400 rounded-full flex items-center justify-center transition-all border border-transparent hover:border-green-500/50">
                                <i className="fas fa-check text-xs"></i>
                             </button>
                          )}
                          {col.id === 'done' && (
                             <div className="w-7 h-7 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center border border-green-500/50">
                                <i className="fas fa-check-double text-xs"></i>
                             </div>
                          )}
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          ))}
        </div>

        </div>

        {/* Right Sidebar Charts */}
        <div className="w-80 glass-panel border-l border-[#ffffff10] flex flex-col p-6 m-3 ml-0">
           <h2 className="text-lg font-semibold mb-6">Dashboard Stats</h2>
         
         {/* Circular Progress (CSS based) */}
         <div className="glass-panel p-5 mb-6 flex flex-col items-center border-[#ffffff05]">
           <h3 className="text-sm text-gray-400 mb-4 w-full text-left">Project Progress</h3>
           <div className="relative w-32 h-32 rounded-full bg-[#1f2130] flex items-center justify-center" 
                style={{ background: `conic-gradient(var(--neon-cyan) ${Math.round((tasks.filter(t=>t.status==='done').length / Math.max(tasks.length, 1))*100)}%, transparent 0)` }}>
              <div className="absolute inset-2 rounded-full bg-[#161824] flex items-center justify-center">
                 <span className="text-2xl font-bold text-white">{Math.round((tasks.filter(t=>t.status==='done').length / Math.max(tasks.length, 1))*100)}%</span>
              </div>
           </div>
           <div className="flex justify-between w-full mt-6 text-xs text-gray-400">
             <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00f0ff]"></span> Completed</div>
             <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#1f2130] border border-[#ffffff10]"></span> Remaining</div>
           </div>
         </div>

         {/* Bar Chart (CSS based) */}
         <div className="glass-panel p-5 mb-6 border-[#ffffff05]">
           <h3 className="text-sm text-gray-400 mb-4 h-full">Tasks by Status</h3>
           <div className="flex items-end justify-between h-24 mt-2 border-b border-[#ffffff10] pb-2 relative">
             <div className="w-full absolute inset-0 flex flex-col justify-between z-0">
               <div className="border-t border-[#ffffff05] w-full"></div>
               <div className="border-t border-[#ffffff05] w-full"></div>
               <div className="border-t border-[#ffffff05] w-full"></div>
             </div>
             
             {columns.map(col => {
               const count = tasks.filter(t => t.status === col.id).length;
               const max = Math.max(tasks.length, 1);
               const heightPct = tasks.length ? `${(count / max) * 100}%` : '5%';
               return (
                 <div key={`bar-${col.id}`} className="w-8 flex flex-col items-center justify-end h-full z-10 group">
                   <div className="w-full rounded-t-sm transition-all group-hover:opacity-80" 
                        style={{ height: heightPct, backgroundColor: col.textClass.match(/text-\[(.*?)\]/)[1] }}></div>
                 </div>
               )
             })}
           </div>
           <div className="flex justify-between text-[9px] text-gray-500 mt-2 uppercase">
              {columns.map(c => <span key={`lbl-${c.id}`}>{c.title.split(' ')[0]}</span>)}
           </div>
         </div>

         {/* Mini metrics */}
         <div className="glass-panel p-5 border-[#ffffff05] mt-auto">
           <h3 className="text-sm text-gray-400 mb-4 h-full">My Key Stats</h3>
           <div className="flex justify-between text-center pb-2">
              <div>
                 <div className="text-2xl font-bold">{tasks.filter(t=>t.status==='done').length}</div>
                 <div className="text-[10px] text-gray-500 uppercase">Completed</div>
              </div>
              <div>
                 <div className="text-2xl font-bold text-[#ff3c3c]">{tasks.filter(t=>t.priority==='high' && t.status!=='done').length}</div>
                 <div className="text-[10px] text-[#ff3c3c] uppercase">Overdue</div>
              </div>
              <div>
                 <div className="text-2xl font-bold">135h</div>
                 <div className="text-[10px] text-gray-500 uppercase">Total Hours</div>
              </div>
           </div>
        </div>
      </div>
      </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="text-[#00f0ff] text-6xl mb-6 mix-blend-screen drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">
             <i className={`fas fa-${
               activeTab === 'Projects' ? 'folder' :
               activeTab === 'Calendar' ? 'calendar-alt' :
               activeTab === 'Team' ? 'users' :
               activeTab === 'Reports' ? 'chart-line' : 'cogs'
             }`}></i>
          </div>
          <h2 className="text-4xl font-bold mb-4">{activeTab} Space</h2>
          <p className="text-gray-400 max-w-md">This module is currently offline or under development. Please return to the Tasks module to continue your workflow.</p>
          <button 
             onClick={() => setActiveTab('Tasks')}
             className="mt-8 bg-transparent hover:bg-[#00f0ff]/10 border border-[#00f0ff]/50 text-[#00f0ff] font-semibold py-3 px-8 rounded-full transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]"
          >
             Return to Tasks Space
          </button>
        </div>
      )}

    </div>
  );
}

export default App;