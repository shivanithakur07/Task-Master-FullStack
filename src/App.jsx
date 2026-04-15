import { useState, useEffect } from 'react';
import Login from "./components/Login";
import './index.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', status: 'todo' });
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [activeTab, setActiveTab] = useState('Tasks');

  // Fetch data
  useEffect(() => {
    if (token) {
      fetchTasks(token);
      fetchProjects(token);
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
      } else if (response.status === 400 || response.status === 401) {
        localStorage.removeItem('token');
        setToken('');
        alert("Session expired or invalid token. Please log in again.");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchProjects = async (authToken = token) => {
    try {
      const response = await fetch(`${API_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  if (!token) {
    return <Login setToken={setToken} />;
  }

  const handleAddTask = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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
      } else {
        const err = await response.json();
        alert("Failed to add task: " + (err.message || 'Unknown server error'));
      }
    } catch (error) {
      alert("Error adding task: " + error.message);
    }
  };

  const handleAddProject = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newProject.title.trim()) return;
    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newProject)
      });
      if (response.ok) {
        setNewProject({ title: '', description: '' });
        fetchProjects();
      } else {
        const err = await response.json();
        alert("Failed to create project: " + (err.message || 'Unknown server error'));
      }
    } catch (error) {
      alert("Error adding project: " + error.message);
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      await fetch(`${API_URL}/projects/${id}`, { 
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
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

  const renderCalendarDays = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding
    for (let i = 0; i < firstDay; i++) {
       days.push(<div key={`pad-${i}`} className="bg-[#1f2130]/30 rounded-lg border border-[#ffffff05]"></div>);
    }
    
    // Month days
    for (let i = 1; i <= daysInMonth; i++) {
       const dateStr = new Date(year, month, i).toDateString();
       const dayTasks = tasks.filter(t => new Date(t.createdAt).toDateString() === dateStr);
       const isToday = today.getDate() === i;
       
       days.push(
         <div key={`day-${i}`} className={`p-2 rounded-lg border ${isToday ? 'border-[#00f0ff]/50 bg-[#00f0ff]/10' : 'border-[#ffffff05] bg-[#161824]/50'} relative flex flex-col min-h-[100px]`}>
            <span className={`text-sm font-semibold mb-2 ${isToday ? 'text-[#00f0ff]' : 'text-gray-400'}`}>{i}</span>
            <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] custom-scrollbar">
               {dayTasks.map(t => (
                  <div key={t.id} className="text-[10px] bg-[#1f2130] text-gray-300 truncate px-1 py-0.5 rounded border border-[#ffffff10] border-l-2"
                       style={{ borderLeftColor: t.priority === 'high' ? '#ef4444' : t.priority === 'medium' ? '#eab308' : '#22c55e' }}>
                     {t.title}
                  </div>
               ))}
            </div>
         </div>
       );
    }
    return days;
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
          {['Projects', 'Tasks', 'Calendar', 'Reports'].map(tab => {
             const icons = { 'Projects': 'folder', 'Tasks': 'check-square', 'Calendar': 'calendar', 'Reports': 'chart-line' };
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

      {/* Main Content Area - Tasks */}
      {activeTab === 'Tasks' && (
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
        <div className="glass-panel p-4 mb-8 flex gap-4 items-center">
          <input 
            type="text" required placeholder="Quick add task..."
            className="flex-1 bg-transparent border-none text-xl focus:ring-0 shadow-none px-2"
            value={newTask.title} 
            onChange={e => setNewTask({...newTask, title: e.target.value})}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTask(e);
            }}
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
          <button type="button" onClick={handleAddTask} className="p-3 w-12 h-12 bg-white/5 hover:bg-[#00f0ff]/20 text-[#00f0ff] hover:scale-110 rounded-full transition-all flex items-center justify-center cursor-pointer">
             <i className="fas fa-arrow-right"></i>
          </button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-4 gap-6 min-h-[60vh]">
          {columns.map(col => (
            <div 
              key={col.id} 
              className="flex flex-col bg-[#161824]/50 border border-[#ffffff05] rounded-xl p-4 min-h-[200px]"
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
                   <div 
                     key={task.id} 
                     draggable 
                     onDragStart={(e) => handleDragStart(e, task.id)}
                     className={`glass-panel p-4 animate-slide-in ${col.colorClass} hover:-translate-y-1 transition-transform cursor-grab active:cursor-grabbing relative group`} 
                     style={{ animationDelay: `${(i % 5) * 50}ms` }}
                   >
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
                 <div className="text-2xl font-bold">{projects.length}</div>
                 <div className="text-[10px] text-gray-500 uppercase">Projects</div>
              </div>
           </div>
        </div>
      </div>
      </>
      )}

      {/* Main Content Area - Projects */}
      {activeTab === 'Projects' && (
        <div className="flex-1 flex flex-col p-8 overflow-y-auto w-full">
           <h1 className="text-4xl font-bold mb-8">Projects <span className="text-[#00f0ff]">Space</span></h1>
           
           <div className="glass-panel p-4 mb-8 flex gap-4 items-center">
             <input type="text" placeholder="New Project Title..." value={newProject.title} onChange={e=>setNewProject({...newProject, title: e.target.value})} className="flex-1 bg-transparent border-none text-xl focus:ring-0 px-2"/>
             <input type="text" placeholder="Description (optional)" value={newProject.description} onChange={e=>setNewProject({...newProject, description: e.target.value})} className="flex-1 bg-transparent border-none text-[1rem] focus:ring-0 px-2 text-gray-400"/>
             <button onClick={handleAddProject} className="bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] font-semibold py-2 px-6 rounded-lg transition-all rounded-full flex items-center justify-center">
                <i className="fas fa-plus mr-2"></i> Create
             </button>
           </div>
           
           <div className="grid grid-cols-3 gap-6">
             {projects.map(p => (
                <div key={p.id} className="glass-panel p-6 relative group hover:-translate-y-1 transition-all border-[#ffffff05]">
                   <button onClick={() => handleDeleteProject(p.id)} className="absolute top-4 right-4 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><i className="fas fa-trash"></i></button>
                   <h3 className="text-xl font-bold text-white mb-2">{p.title}</h3>
                   <p className="text-sm text-gray-400 mb-6">{p.description || "No description provided."}</p>
                   <div className="flex justify-between items-center mt-auto border-t border-[#ffffff10] pt-4">
                     <span className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</span>
                     <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">Active</span>
                   </div>
                </div>
             ))}
             {projects.length === 0 && (
                <div className="col-span-3 text-center py-12 text-gray-500 italic">No projects found. Create one above!</div>
             )}
           </div>
        </div>
      )}

      {/* Main Content Area - Calendar */}
      {activeTab === 'Calendar' && (
        <div className="flex-1 flex flex-col p-8 overflow-y-auto">
          <h1 className="text-4xl font-bold mb-8">Calendar <span className="text-[#00f0ff]">Space</span></h1>
          <div className="glass-panel p-6 flex-1 flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
             </div>
             <div className="grid grid-cols-7 gap-2 mb-4 text-center text-[#00f0ff] font-semibold tracking-widest text-sm uppercase">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
             </div>
             <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-[minmax(100px,1fr)]">
                {renderCalendarDays()}
             </div>
          </div>
        </div>
      )}

      {/* Main Content Area - Reports */}
      {activeTab === 'Reports' && (
        <div className="flex-1 flex flex-col p-8 overflow-y-auto">
           <h1 className="text-4xl font-bold mb-8">Reports <span className="text-[#00f0ff]">Space</span></h1>
           <div className="grid grid-cols-2 gap-8">
              <div className="glass-panel p-6 border-[#ffffff05]">
                 <h2 className="text-lg font-bold mb-4 border-b border-[#ffffff10] pb-4"><i className="fas fa-chart-pie text-[#00f0ff] mr-2"></i> Task Completion Rate</h2>
                 <div className="flex items-center justify-center p-8 h-64">
                     <div className="relative w-48 h-48 rounded-full bg-[#1f2130] flex items-center justify-center transition-all shadow-[0_0_30px_rgba(0,240,255,0.1)]" 
                          style={{ background: `conic-gradient(var(--neon-green) ${Math.round((tasks.filter(t=>t.status==='done').length / Math.max(tasks.length, 1))*100)}%, transparent 0)` }}>
                        <div className="absolute inset-4 rounded-full bg-[#161824] flex items-center justify-center flex-col shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                           <span className="text-4xl font-bold text-white">{Math.round((tasks.filter(t=>t.status==='done').length / Math.max(tasks.length, 1))*100)}%</span>
                           <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Completed</span>
                        </div>
                     </div>
                 </div>
              </div>
              
              <div className="glass-panel p-6 border-[#ffffff05]">
                 <h2 className="text-lg font-bold mb-4 border-b border-[#ffffff10] pb-4"><i className="fas fa-layer-group text-[#b05bff] mr-2"></i> Tasks By Priority</h2>
                 <div className="flex flex-col justify-center h-64 gap-6 px-4">
                    {[
                      { id: 'high', label: 'High Risk', color: 'bg-red-500', neon: 'var(--neon-red)' },
                      { id: 'medium', label: 'Medium Risk', color: 'bg-yellow-500', neon: 'var(--neon-yellow)' },
                      { id: 'low', label: 'Low Risk', color: 'bg-green-500', neon: 'var(--neon-green)' }
                    ].map(pri => {
                       const count = tasks.filter(t => t.priority === pri.id).length;
                       const pct = Math.round((count / Math.max(tasks.length, 1)) * 100);
                       return (
                         <div key={pri.id} className="flex flex-col group">
                            <div className="flex justify-between text-sm mb-2 uppercase tracking-wide text-gray-300">
                               <span className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${pri.color}`}></span>{pri.label}</span>
                               <span className="font-mono text-white/50">{count} ({pct}%)</span>
                            </div>
                            <div className="w-full h-3 bg-[#1f2130] rounded-full overflow-hidden border border-[#ffffff05]">
                               <div className={`h-full ${pri.color} transition-all duration-1000 group-hover:brightness-125`} style={{ width: `${pct}%`, boxShadow: `0 0 10px ${pri.neon}` }}></div>
                            </div>
                         </div>
                       )
                    })}
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}

export default App;