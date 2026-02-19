import { useState, useEffect } from "react";
import AuthPage from "./AuthPage";
import ExpenseTracker from "./ExpenseTracker";

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("xp_user")) || null; }
    catch { return null; }
  });

  const handleAuth = (userData) => {
    localStorage.setItem("xp_user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("xp_user");
    setUser(null);
  };

  if (!user) return <AuthPage onAuth={handleAuth} />;
  return <ExpenseTracker user={user} onLogout={handleLogout} />;
}