import { useState, useEffect } from "react";
import { auth, provider } from "./firebase";
import { onAuthStateChanged, signOut, signInWithPopup } from "firebase/auth";
import AuthPage from "./AuthPage";
import ExpenseTracker from "./ExpenseTracker";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
          email: firebaseUser.email,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogout = () => signOut(auth);

  if (loading) return (
    <div style={{
      minHeight: "100vh", background: "#070710", display: "flex",
      alignItems: "center", justifyContent: "center", color: "#555",
      fontFamily: "'Outfit',sans-serif", fontSize: 14, flexDirection: "column", gap: 12
    }}>
      <div style={{
        width: 32, height: 32, border: "2px solid rgba(167,139,250,0.3)",
        borderTopColor: "#A78BFA", borderRadius: "50%", animation: "spin 0.7s linear infinite"
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      Loading...
    </div>
  );

  if (!user) return <AuthPage onAuth={setUser} />;
  return <ExpenseTracker user={user} onLogout={handleLogout} />;
}