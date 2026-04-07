import { useState } from "react";

const API_URL = "http://localhost:5000/api";

function Login({ setToken }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = isLogin ? "/login" : "/register";

    try {
      const res = await fetch(`${API_URL}${url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        if (isLogin) {
          localStorage.setItem("token", data.token);
          setToken(data.token);
        } else {
          alert("Signup successful! Now login.");
          setIsLogin(true);
        }
      } else {
        alert(data.message || "Error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#242424] text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-[#1a1a1a] p-8 rounded-xl flex flex-col gap-4 w-80"
      >
        <h2 className="text-xl font-bold">
          {isLogin ? "Login" : "Sign Up"}
        </h2>

        <input
          type="text"
          placeholder="Username"
          className="p-2 bg-[#2a2a2a] rounded"
          value={form.username}
          onChange={(e) =>
            setForm({ ...form, username: e.target.value })
          }
        />

        <input
          type="password"
          placeholder="Password"
          className="p-2 bg-[#2a2a2a] rounded"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

        <button className="bg-purple-500 py-2 rounded">
          {isLogin ? "Login" : "Sign Up"}
        </button>

        <p
          className="text-sm text-gray-400 cursor-pointer"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin
            ? "Don't have an account? Sign Up"
            : "Already have an account? Login"}
        </p>
      </form>
    </div>
  );
}

export default Login;