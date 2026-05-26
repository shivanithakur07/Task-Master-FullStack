import { useState } from "react";

const API_URL = "http://localhost:5000/api";

function Login({ setToken }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: "", password: "" });
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const url = isLogin ? "/login" : "/register";

    try {
      const res = await fetch(`${API_URL}${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        if (isLogin) {
          localStorage.setItem("token", data.token);
          setToken(data.token);
        } else {
          alert("Registration successful! Initiating system login access.");
          setIsLogin(true);
        }
      } else {
        setErrorMsg(data.message || "Authentication Error");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error. Could not connect to system.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f111a] text-white relative overflow-hidden font-sans">
      
      {/* Decorative background neons */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#00f0ff]/20 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#b05bff]/20 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="glass-panel p-10 rounded-2xl flex flex-col gap-6 w-[400px] border border-[#ffffff10] shadow-2xl relative z-10">
        <div className="text-center mb-4">
           <div className="text-5xl mb-4 text-[#00f0ff] mix-blend-screen drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]">
             <i className="fas fa-fingerprint"></i>
           </div>
           <h2 className="text-3xl font-bold tracking-tighter">
             Task<span className="text-[#00f0ff]">Master</span>
           </h2>
           <p className="text-gray-400 text-sm mt-2 uppercase tracking-widest">{isLogin ? "System Authorization" : "New Operator Registration"}</p>
        </div>

        {errorMsg && (
           <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center">
              <i className="fas fa-exclamation-triangle mr-2"></i>{errorMsg}
           </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="relative">
             <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
             <input
               type="text"
               required
               placeholder="Operator ID"
               className="w-full bg-[#161824]/50 border border-[#ffffff10] rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#00f0ff] transition-all shadow-none"
               value={form.username}
               onChange={(e) => setForm({ ...form, username: e.target.value })}
             />
          </div>

          <div className="relative">
             <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
             <input
               type="password"
               required
               placeholder="Passcode"
               className="w-full bg-[#161824]/50 border border-[#ffffff10] rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#00f0ff] transition-all shadow-none"
               value={form.password}
               onChange={(e) => setForm({ ...form, password: e.target.value })}
             />
          </div>

          <button className="mt-2 w-full btn-neon font-bold text-white py-3 rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.2)] tracking-wide uppercase text-sm flex justify-center items-center gap-2">
            {isLogin ? <><i className="fas fa-sign-in-alt"></i> Initialize</> : <><i className="fas fa-user-plus"></i> Register</>}
          </button>
        </form>

        <div className="mt-2 border-t border-[#ffffff10] pt-6 text-center">
           <p className="text-sm text-gray-400">
             {isLogin ? "Unassigned operator?" : "Already verified?"}
             <span 
                className="ml-2 text-[#00f0ff] cursor-pointer hover:underline hover:text-white transition-colors"
                onClick={() => {
                   setIsLogin(!isLogin);
                   setErrorMsg("");
                }}
             >
                {isLogin ? "Request Access" : "Authenticate Here"}
             </span>
           </p>
        </div>
      </div>
    </div>
  );
}

export default Login;