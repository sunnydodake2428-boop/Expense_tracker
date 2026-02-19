import { useState } from "react";
import { auth, provider } from "./firebase";
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from "firebase/auth";

export default function AuthPage({ onAuth }) {
  const [mode, setMode]         = useState("login");
  const [form, setForm]         = useState({ name:"", email:"", password:"", otp:"", phone:"" });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const set = (k, v) => { setForm(f => ({...f,[k]:v})); setErrors(e => ({...e,[k]:""})); };

  const validate = () => {
    const e = {};
    if (mode === "signup" && !form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (form.password.length < 6) e.password = "Min 6 characters";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      if (mode === "signup") {
        const result = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(result.user, { displayName: form.name });
        onAuth({ uid: result.user.uid, name: form.name, email: form.email });
      } else {
        const result = await signInWithEmailAndPassword(auth, form.email, form.password);
        onAuth({
          uid: result.user.uid,
          name: result.user.displayName || form.email.split("@")[0],
          email: result.user.email
        });
      }
    } catch (err) {
      const msg = err.code === "auth/user-not-found" ? "No account found with this email" :
                  err.code === "auth/wrong-password" ? "Incorrect password" :
                  err.code === "auth/email-already-in-use" ? "Email already registered" :
                  err.code === "auth/invalid-credential" ? "Invalid email or password" :
                  "Something went wrong. Try again.";
      setErrors({ general: msg });
    }
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      setErrors({ email: "Enter a valid email" }); return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, form.email);
      setForgotSent(true);
    } catch {
      setErrors({ email: "Could not send reset email. Check the address." });
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      onAuth({
        uid: result.user.uid,
        name: result.user.displayName || result.user.email.split("@")[0],
        email: result.user.email,
      });
    } catch (err) {
      setErrors({ general: "Google login failed. Try again." });
    }
    setLoading(false);
  };

  return (
    <div className="auth-root">
      <style>{CSS}</style>
      <div className="auth-blob b1"/><div className="auth-blob b2"/><div className="auth-blob b3"/>

      <div className="auth-card">
        <div className="auth-logo-wrap">
          <div className="auth-logo">💸</div>
          <div className="auth-brand">Expensify</div>
          <div className="auth-tagline">Smart money. Smarter tracking.</div>
        </div>

        {/* FORGOT PASSWORD */}
        {mode === "forgot" && (
          <div className="fade-in">
            <div className="auth-title">Reset Password</div>
            <div className="auth-sub">We'll send a reset link to your email</div>
            {forgotSent ? (
              <div className="auth-success">
                <span style={{fontSize:36}}>📬</span>
                <p>Reset link sent! Check your inbox.</p>
                <button className="auth-link-btn" onClick={() => { setMode("login"); setForgotSent(false); }}>Back to Login</button>
              </div>
            ) : (
              <>
                <Field label="Email" type="email" value={form.email} error={errors.email} placeholder="you@example.com" onChange={v => set("email", v)} />
                {errors.general && <div className="auth-general-err">{errors.general}</div>}
                <AuthBtn loading={loading} onClick={handleForgot}>Send Reset Link</AuthBtn>
                <button className="auth-link-btn" style={{marginTop:14}} onClick={() => setMode("login")}>← Back to Login</button>
              </>
            )}
          </div>
        )}

        {/* LOGIN */}
        {mode === "login" && (
          <div className="fade-in">
            <div className="auth-title">Welcome back</div>
            <div className="auth-sub">Sign in to your account</div>

            <button className="google-btn" onClick={handleGoogle} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              {loading ? <Spinner/> : "Continue with Google"}
            </button>

            <div className="auth-divider"><div className="auth-divider-line"/><span className="auth-divider-text">or continue with email</span><div className="auth-divider-line"/></div>

            <Field label="Email" type="email" value={form.email} error={errors.email} placeholder="you@example.com" onChange={v => set("email", v)} />
            <Field label="Password" type={showPass?"text":"password"} value={form.password} error={errors.password}
              placeholder="••••••••" onChange={v => set("password", v)} suffix={<EyeBtn show={showPass} toggle={() => setShowPass(s=>!s)}/>} />

            <div className="auth-forgot-row">
              <button className="auth-link-btn small" onClick={() => setMode("forgot")}>Forgot password?</button>
            </div>

            {errors.general && <div className="auth-general-err">{errors.general}</div>}
            <AuthBtn loading={loading} onClick={handleSubmit}>Sign In</AuthBtn>

            <div className="auth-switch">
              Don't have an account?{" "}
              <button className="auth-link-btn inline" onClick={() => { setMode("signup"); setErrors({}); }}>Sign up free</button>
            </div>
          </div>
        )}

        {/* SIGNUP */}
        {mode === "signup" && (
          <div className="fade-in">
            <div className="auth-title">Create account</div>
            <div className="auth-sub">Start tracking your expenses today</div>

            <button className="google-btn" onClick={handleGoogle} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              {loading ? <Spinner/> : "Sign up with Google"}
            </button>

            <div className="auth-divider"><div className="auth-divider-line"/><span className="auth-divider-text">or continue with email</span><div className="auth-divider-line"/></div>

            <Field label="Full Name" type="text" value={form.name} error={errors.name} placeholder="John Doe" onChange={v => set("name", v)} />
            <Field label="Email" type="email" value={form.email} error={errors.email} placeholder="you@example.com" onChange={v => set("email", v)} />
            <Field label="Password" type={showPass?"text":"password"} value={form.password} error={errors.password}
              placeholder="Min 6 characters" onChange={v => set("password", v)} suffix={<EyeBtn show={showPass} toggle={() => setShowPass(s=>!s)}/>} />

            {errors.general && <div className="auth-general-err">{errors.general}</div>}
            <AuthBtn loading={loading} onClick={handleSubmit}>Create Account</AuthBtn>

            <div className="auth-switch">
              Already have an account?{" "}
              <button className="auth-link-btn inline" onClick={() => { setMode("login"); setErrors({}); }}>Sign in</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, type, value, placeholder, onChange, error, suffix }) {
  return (
    <div className="auth-field">
      <label className="auth-label">{label}</label>
      <div className="auth-input-wrap">
        <input className={`auth-input ${error?"auth-input-err":""}`} type={type} value={value}
          placeholder={placeholder} onChange={e => onChange(e.target.value)} />
        {suffix}
      </div>
      {error && <span className="auth-err">{error}</span>}
    </div>
  );
}

function EyeBtn({ show, toggle }) {
  return <button className="eye-btn" onClick={toggle} type="button">{show ? "🙈" : "👁️"}</button>;
}

function AuthBtn({ children, onClick, loading }) {
  return (
    <button className="auth-submit-btn" onClick={onClick} disabled={loading}>
      {loading ? <Spinner/> : children}
    </button>
  );
}

function Spinner() {
  return <span className="spinner"/>;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;}
.auth-root{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#070710;font-family:'Outfit',sans-serif;padding:20px 16px;position:relative;overflow:hidden;}
.auth-blob{position:fixed;border-radius:50%;pointer-events:none;z-index:0;}
.b1{top:-150px;right:-100px;width:400px;height:400px;background:radial-gradient(circle,rgba(167,139,250,0.18) 0%,transparent 70%);}
.b2{bottom:50px;left:-120px;width:350px;height:350px;background:radial-gradient(circle,rgba(78,201,255,0.13) 0%,transparent 70%);}
.b3{top:50%;left:50%;transform:translate(-50%,-50%);width:500px;height:500px;background:radial-gradient(circle,rgba(6,214,160,0.05) 0%,transparent 70%);}
.auth-card{width:100%;max-width:420px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:28px;padding:36px 32px 32px;position:relative;z-index:1;backdrop-filter:blur(20px);box-shadow:0 24px 80px rgba(0,0,0,0.5);}
.auth-logo-wrap{text-align:center;margin-bottom:28px;}
.auth-logo{width:60px;height:60px;border-radius:20px;font-size:28px;background:linear-gradient(135deg,rgba(167,139,250,0.3),rgba(78,201,255,0.2));border:1px solid rgba(167,139,250,0.3);display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;box-shadow:0 8px 24px rgba(167,139,250,0.2);}
.auth-brand{font-size:24px;font-weight:900;letter-spacing:-0.5px;color:#fff;}
.auth-tagline{font-size:12px;color:#444;margin-top:3px;}
.auth-title{font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;margin-bottom:4px;}
.auth-sub{font-size:13px;color:#555;margin-bottom:20px;}
.google-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:13px 16px;border-radius:13px;background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.12);color:#e0e0e0;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.2s;font-family:'Outfit',sans-serif;margin-bottom:4px;}
.google-btn:hover{background:rgba(255,255,255,0.11)!important;border-color:rgba(255,255,255,0.22)!important;transform:translateY(-1px);}
.google-btn:disabled{opacity:0.6;cursor:not-allowed;transform:none!important;}
.auth-divider{display:flex;align-items:center;gap:10px;margin:18px 0;}
.auth-divider-line{flex:1;height:1px;background:rgba(255,255,255,0.07);}
.auth-divider-text{font-size:11px;color:#444;white-space:nowrap;letter-spacing:0.5px;}
.auth-field{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;}
.auth-label{font-size:11px;font-weight:800;color:#555;letter-spacing:1.2px;text-transform:uppercase;}
.auth-input-wrap{position:relative;display:flex;align-items:center;}
.auth-input{width:100%;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.08);border-radius:13px;padding:13px 16px;color:#fff;font-size:15px;outline:none;transition:all 0.2s;font-family:'Outfit',sans-serif;}
.auth-input:focus{border-color:rgba(167,139,250,0.5)!important;background:rgba(167,139,250,0.06)!important;}
.auth-input::placeholder{color:#2e2e3e;}
.auth-input-err{border-color:rgba(255,100,100,0.45)!important;background:rgba(255,70,70,0.04)!important;}
.auth-err{font-size:11px;color:#ff6b6b;}
.auth-general-err{background:rgba(255,70,70,0.08);border:1px solid rgba(255,70,70,0.2);border-radius:10px;padding:10px 14px;font-size:12px;color:#ff8080;margin-bottom:12px;}
.eye-btn{position:absolute;right:14px;background:none;border:none;cursor:pointer;font-size:16px;padding:0;line-height:1;}
.auth-forgot-row{display:flex;justify-content:flex-end;margin:-4px 0 12px;}
.auth-submit-btn{width:100%;padding:15px;border-radius:14px;margin-top:4px;background:linear-gradient(135deg,rgba(167,139,250,0.92),rgba(78,201,255,0.82));border:none;color:#fff;font-size:15px;font-weight:900;cursor:pointer;transition:all 0.22s;font-family:'Outfit',sans-serif;box-shadow:0 4px 24px rgba(167,139,250,0.3);display:flex;align-items:center;justify-content:center;min-height:50px;}
.auth-submit-btn:hover{transform:translateY(-2px);box-shadow:0 10px 36px rgba(167,139,250,0.45)!important;}
.auth-submit-btn:disabled{opacity:0.7;cursor:not-allowed;transform:none!important;}
.auth-switch{text-align:center;margin-top:18px;font-size:13px;color:#555;}
.auth-link-btn{background:none;border:none;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;color:#A78BFA;font-weight:700;padding:0;transition:color 0.2s;display:block;margin:0 auto;}
.auth-link-btn:hover{color:#c4b5fd!important;}
.auth-link-btn.small{font-size:12px;}
.auth-link-btn.inline{display:inline;}
.auth-success{text-align:center;padding:20px 0;display:flex;flex-direction:column;align-items:center;gap:10px;color:#ccc;font-size:14px;}
.spinner{width:20px;height:20px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;display:inline-block;animation:spin 0.7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
.fade-in{animation:fadeIn 0.35s cubic-bezier(.22,1,.36,1);}
`;