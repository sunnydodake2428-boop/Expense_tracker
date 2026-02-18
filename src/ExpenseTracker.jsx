import { useState, useEffect, useRef } from "react";

/* ─────────────────── constants ─────────────────── */
const CATEGORIES = [
  { name: "Food & Dining",     icon: "🍜", color: "#FF6B6B", bg: "rgba(255,107,107,0.12)" },
  { name: "Transport",         icon: "🚖", color: "#4EC9FF", bg: "rgba(78,201,255,0.12)"  },
  { name: "Shopping",          icon: "🛍️", color: "#FFD166", bg: "rgba(255,209,102,0.12)" },
  { name: "Entertainment",     icon: "🎮", color: "#A78BFA", bg: "rgba(167,139,250,0.12)" },
  { name: "Health",            icon: "💊", color: "#06D6A0", bg: "rgba(6,214,160,0.12)"   },
  { name: "Bills & Utilities", icon: "⚡", color: "#F4A261", bg: "rgba(244,162,97,0.12)"  },
  { name: "Education",         icon: "📚", color: "#48CAE4", bg: "rgba(72,202,228,0.12)"  },
  { name: "Other",             icon: "📦", color: "#C9C9C9", bg: "rgba(201,201,201,0.12)" },
];

const getCat = (name) => CATEGORIES.find((c) => c.name === name) || CATEGORIES[7];
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
const todayStr = () => new Date().toISOString().split("T")[0];

/* ─────────────────── AnimatedNumber ─────────────────── */
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const start = prev.current;
    const diff = value - start;
    if (diff === 0) return;
    const duration = 600;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setDisplay(start + diff * ease);
      if (p < 1) requestAnimationFrame(tick);
      else prev.current = value;
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{fmt(display)}</>;
}

/* ─────────────────── MiniBar ─────────────────── */
function MiniBar({ percent, color }) {
  return (
    <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginTop: 7 }}>
      <div style={{ height: "100%", width: `${Math.min(percent,100)}%`, background: color, borderRadius: 99,
        transition: "width 0.9s cubic-bezier(.22,1,.36,1)", boxShadow: `0 0 8px ${color}77` }} />
    </div>
  );
}

/* ─────────────────── DonutChart ─────────────────── */
function DonutChart({ expenses }) {
  const size = 170, sw = 22, r = (size - sw) / 2, circ = 2 * Math.PI * r;
  const totals = {};
  CATEGORIES.forEach((c) => { totals[c.name] = expenses.filter((e) => e.category === c.name).reduce((s, e) => s + e.amount, 0); });
  const total = Object.values(totals).reduce((a, b) => a + b, 0);
  if (!total) return (
    <div style={{ height: 170, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#3a3a3a", gap: 8 }}>
      <span style={{ fontSize: 36 }}>◎</span><span style={{ fontSize: 12 }}>No data yet</span>
    </div>
  );
  let offset = 0;
  const slices = CATEGORIES.map((cat) => {
    const val = totals[cat.name], pct = val / total;
    const dash = pct * circ, slice = { cat, dash, gap: circ - dash, offset };
    offset += dash; return slice;
  }).filter((s) => s.dash > 2);

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {slices.map(({ cat, dash, gap, offset: off }) => (
          <circle key={cat.name} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={cat.color} strokeWidth={sw}
            strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-off} strokeLinecap="butt"
            style={{ filter:`drop-shadow(0 0 5px ${cat.color}55)`, transition:"all 0.7s ease" }} />
        ))}
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontSize:10, color:"#555", letterSpacing:1.5, textTransform:"uppercase" }}>Spent</span>
        <span style={{ fontSize:16, fontWeight:900, color:"#fff", letterSpacing:"-0.5px", marginTop:3 }}>{fmt(total)}</span>
      </div>
    </div>
  );
}

/* ─────────────────── ExpenseRow ─────────────────── */
function ExpenseRow({ exp, isNew, isDeleting, onDelete }) {
  const cat = getCat(exp.category);
  return (
    <div className={`row ${isNew?"row-new":""} ${isDeleting?"row-out":""}`}>
      <div className="row-icon" style={{ background: cat.bg, border: `1px solid ${cat.color}30` }}>
        <span style={{ fontSize: 20 }}>{cat.icon}</span>
      </div>
      <div className="row-meta">
        <span className="row-title">{exp.title}</span>
        <div className="row-sub">
          <span className="row-cat" style={{ color: cat.color, background: cat.bg }}>{exp.category}</span>
          {exp.date && (
            <span className="row-date">
              {new Date(exp.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
        {exp.note && <span className="row-note">{exp.note}</span>}
      </div>
      <div className="row-right">
        <span className="row-amount" style={{ color: cat.color }}>{fmt(exp.amount)}</span>
        <button className="row-del" onClick={() => onDelete(exp.id)} aria-label="Delete">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M1 1L10 10M10 1L1 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─────────────────── EmptyState ─────────────────── */
function EmptyState() {
  return (
    <div style={{ textAlign:"center", padding:"40px 0", color:"#444" }}>
      <div style={{ fontSize:48, marginBottom:10 }}>🧾</div>
      <p style={{ margin:0, fontSize:14, color:"#555" }}>No expenses here</p>
      <p style={{ margin:"4px 0 0", fontSize:12, color:"#333" }}>Start tracking your spending</p>
    </div>
  );
}

/* ─────────────────── MAIN ─────────────────── */
export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState(() => {
    try { return JSON.parse(localStorage.getItem("xp_v2")) || []; } catch { return []; }
  });
  const [form, setForm] = useState({ title:"", amount:"", category: CATEGORIES[0].name, date: todayStr(), note:"" });
  const [errors, setErrors] = useState({});
  const [tab, setTab] = useState("dashboard");
  const [filterCat, setFilterCat] = useState("All");
  const [newId, setNewId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { localStorage.setItem("xp_v2", JSON.stringify(expenses)); }, [expenses]);

  const total      = expenses.reduce((s,e) => s+e.amount, 0);
  const thisMonth  = expenses.filter(e => e.date?.slice(0,7) === todayStr().slice(0,7)).reduce((s,e) => s+e.amount,0);
  const avgPerTxn  = expenses.length ? total / expenses.length : 0;

  const validate = () => {
    const e = {};
    if (!form.title.trim())                        e.title  = "Title is required";
    if (!form.amount || +form.amount <= 0)         e.amount = "Enter a valid amount";
    return e;
  };

  const handleAdd = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const entry = { id: Date.now(), ...form, amount: Math.round(parseFloat(form.amount) * 100) / 100 };
    setExpenses(prev => [entry, ...prev]);
    setNewId(entry.id);
    setTimeout(() => setNewId(null), 1600);
    setForm({ title:"", amount:"", category: CATEGORIES[0].name, date: todayStr(), note:"" });
    setErrors({});
    setTab("dashboard");
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setTimeout(() => { setExpenses(prev => prev.filter(e => e.id !== id)); setDeleteId(null); }, 380);
  };

  const filtered = filterCat === "All" ? expenses : expenses.filter(e => e.category === filterCat);

  const catTotals = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.name).reduce((s,e) => s+e.amount, 0)
  })).filter(c => c.total > 0).sort((a,b) => b.total - a.total);

  const TABS = [
    { id:"dashboard", label:"Overview", icon:"⬡" },
    { id:"add",       label:"Add New",  icon:"+" },
    { id:"history",   label:"History",  icon:"≡" },
  ];

  return (
    <div className="root">
      <style>{CSS}</style>

      {/* ambient blobs */}
      <div className="blob blob-1"/>
      <div className="blob blob-2"/>
      <div className="blob blob-3"/>

      {/* ── header ── */}
      <header className="header">
        <div className="brand">
          <div className="brand-mark">💸</div>
          <div>
            <div className="brand-name">Expensify</div>
            <div className="brand-sub">Smart Tracker</div>
          </div>
        </div>
        <div className="header-date">
          {new Date().toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}
        </div>
      </header>

      {/* ── hero ── */}
      <div className="hero-card">
        <div className="hero-glow"/>
        <div className="hero-label">Total Expenses</div>
        <div className="hero-amount"><AnimatedNumber value={total}/></div>
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hstat-label">This Month</span>
            <span className="hstat-val">{fmt(thisMonth)}</span>
          </div>
          <div className="hero-divider"/>
          <div className="hero-stat">
            <span className="hstat-label">Transactions</span>
            <span className="hstat-val">{expenses.length}</span>
          </div>
          <div className="hero-divider"/>
          <div className="hero-stat">
            <span className="hstat-label">Avg / txn</span>
            <span className="hstat-val">{fmt(avgPerTxn)}</span>
          </div>
        </div>
      </div>

      {/* ── tabs ── */}
      <div className="tabbar">
        {TABS.map(t => (
          <button key={t.id} className={`tab ${tab===t.id?"tab-active":""}`} onClick={() => setTab(t.id)}>
            <span className="tab-icon">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ══════ DASHBOARD ══════ */}
      {tab === "dashboard" && (
        <div className="fade-in">
          <div className="glass-card">
            <div className="card-title">Spending Breakdown</div>
            <DonutChart expenses={expenses}/>
            {catTotals.length > 0 && (
              <div style={{ marginTop:24, display:"flex", flexDirection:"column", gap:12 }}>
                {catTotals.slice(0,6).map(cat => (
                  <div key={cat.name}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:13, color:"#bbb" }}>{cat.icon} {cat.name}</span>
                      <span style={{ fontSize:13, fontWeight:800, color:cat.color }}>{fmt(cat.total)}</span>
                    </div>
                    <MiniBar percent={(cat.total/total)*100} color={cat.color}/>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card">
            <div className="card-title">Recent Transactions</div>
            {expenses.length === 0 ? <EmptyState/> : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {expenses.slice(0,5).map(exp => (
                  <ExpenseRow key={exp.id} exp={exp} isNew={exp.id===newId} isDeleting={exp.id===deleteId} onDelete={handleDelete}/>
                ))}
                {expenses.length > 5 && (
                  <button className="view-all-btn" onClick={() => setTab("history")}>
                    View all {expenses.length} transactions →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════ ADD ══════ */}
      {tab === "add" && (
        <div className="fade-in glass-card">
          <div className="card-title">New Expense</div>

          <div className="form-group">
            <label className="form-label">Title</label>
            <input className={`xp-input ${errors.title?"xp-input-err":""}`}
              placeholder="e.g. Dinner with friends"
              value={form.title}
              onChange={e => { setForm({...form,title:e.target.value}); setErrors({...errors,title:""}); }}/>
            {errors.title && <span className="err-msg">{errors.title}</span>}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input className={`xp-input ${errors.amount?"xp-input-err":""}`}
                placeholder="0.00" type="number" min="0"
                value={form.amount}
                onChange={e => { setForm({...form,amount:e.target.value}); setErrors({...errors,amount:""}); }}/>
              {errors.amount && <span className="err-msg">{errors.amount}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="xp-input" type="date" value={form.date}
                onChange={e => setForm({...form,date:e.target.value})}/>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <div className="cat-grid">
              {CATEGORIES.map(cat => (
                <button key={cat.name} className="cat-chip"
                  style={form.category===cat.name ? {background:cat.bg, border:`1.5px solid ${cat.color}`, color:cat.color} : {}}
                  onClick={() => setForm({...form,category:cat.name})}>
                  <span style={{ fontSize:22 }}>{cat.icon}</span>
                  <span style={{ fontSize:10, marginTop:2 }}>{cat.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Note <span style={{color:"#444",fontWeight:400}}>(optional)</span></label>
            <textarea className="xp-input" style={{ height:76, resize:"none", paddingTop:13 }}
              placeholder="Any details..."
              value={form.note}
              onChange={e => setForm({...form,note:e.target.value})}/>
          </div>

          <button className="submit-btn" onClick={handleAdd}>
            <span>Add Expense</span><span className="submit-arr">→</span>
          </button>
        </div>
      )}

      {/* ══════ HISTORY ══════ */}
      {tab === "history" && (
        <div className="fade-in">
          <div className="filter-scroll">
            {["All",...CATEGORIES.map(c=>c.name)].map(cat => {
              const co = cat!=="All" ? getCat(cat) : null;
              return (
                <button key={cat} className="fchip"
                  style={filterCat===cat ? { background:co?co.bg:"rgba(255,255,255,0.12)", border:`1.5px solid ${co?co.color:"#fff"}`, color:co?co.color:"#fff" } : {}}
                  onClick={() => setFilterCat(cat)}>
                  {co ? co.icon+" " : ""}{cat==="All"?"All":cat.split(" ")[0]}
                </button>
              );
            })}
          </div>
          <div className="glass-card">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div className="card-title" style={{ margin:0 }}>{filterCat==="All"?"All Transactions":filterCat}</div>
              <span style={{ fontSize:12, color:"#555" }}>{filtered.length} items · {fmt(filtered.reduce((s,e)=>s+e.amount,0))}</span>
            </div>
            {filtered.length===0 ? <EmptyState/> : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {filtered.map(exp => (
                  <ExpenseRow key={exp.id} exp={exp} isNew={exp.id===newId} isDeleting={exp.id===deleteId} onDelete={handleDelete}/>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ height:40 }}/>
    </div>
  );
}

/* ─────────────────── CSS ─────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;}
body{margin:0;background:#070710;}
::-webkit-scrollbar{display:none;}

.root{
  min-height:100vh;
  background:#070710;
  font-family:'Outfit','Segoe UI',sans-serif;
  color:#f0f0f0;
  padding:0 16px 20px;
  position:relative;
  overflow-x:hidden;
}

/* blobs */
.blob{position:fixed;border-radius:50%;pointer-events:none;z-index:0;}
.blob-1{top:-130px;right:-90px;width:340px;height:340px;
  background:radial-gradient(circle,rgba(167,139,250,0.17) 0%,transparent 70%);}
.blob-2{bottom:80px;left:-110px;width:300px;height:300px;
  background:radial-gradient(circle,rgba(78,201,255,0.12) 0%,transparent 70%);}
.blob-3{top:45%;left:50%;transform:translate(-50%,-50%);width:420px;height:420px;
  background:radial-gradient(circle,rgba(6,214,160,0.06) 0%,transparent 70%);}

/* header */
.header{display:flex;align-items:center;justify-content:space-between;padding:22px 0 18px;position:relative;z-index:1;}
.brand{display:flex;align-items:center;gap:12px;}
.brand-mark{
  width:46px;height:46px;border-radius:15px;font-size:22px;
  background:linear-gradient(135deg,rgba(167,139,250,0.28),rgba(78,201,255,0.18));
  border:1px solid rgba(167,139,250,0.28);
  display:flex;align-items:center;justify-content:center;
  backdrop-filter:blur(10px);
}
.brand-name{font-size:19px;font-weight:900;letter-spacing:-0.5px;color:#fff;}
.brand-sub{font-size:10px;color:#444;letter-spacing:1.5px;text-transform:uppercase;margin-top:1px;}
.header-date{font-size:12px;color:#444;font-weight:500;}

/* hero */
.hero-card{
  position:relative;
  background:linear-gradient(145deg,rgba(167,139,250,0.14) 0%,rgba(78,201,255,0.09) 50%,rgba(6,214,160,0.07) 100%);
  border:1px solid rgba(167,139,250,0.18);
  border-radius:28px;padding:34px 28px 28px;margin-bottom:20px;
  z-index:1;overflow:hidden;backdrop-filter:blur(20px);
}
.hero-glow{
  position:absolute;top:-70px;right:-70px;width:220px;height:220px;
  background:radial-gradient(circle,rgba(167,139,250,0.22) 0%,transparent 70%);
  border-radius:50%;pointer-events:none;
}
.hero-label{font-size:11px;color:#666;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;}
.hero-amount{
  font-size:44px;font-weight:900;letter-spacing:-2px;margin-bottom:26px;
  background:linear-gradient(135deg,#fff 0%,rgba(255,255,255,0.65) 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
}
.hero-stats{display:flex;align-items:center;}
.hero-stat{flex:1;display:flex;flex-direction:column;gap:4px;}
.hstat-label{font-size:10px;color:#4a4a5a;letter-spacing:0.5px;}
.hstat-val{font-size:14px;font-weight:800;color:#ccc;}
.hero-divider{width:1px;height:32px;background:rgba(255,255,255,0.07);margin:0 16px;}

/* tabs */
.tabbar{
  display:flex;gap:6px;margin-bottom:20px;z-index:1;position:relative;
  background:rgba(255,255,255,0.025);
  border:1px solid rgba(255,255,255,0.055);
  border-radius:18px;padding:5px;
}
.tab{
  flex:1;display:flex;align-items:center;justify-content:center;gap:6px;
  padding:11px 0;border:none;border-radius:13px;background:transparent;
  color:#484860;font-size:13px;font-weight:700;cursor:pointer;
  transition:all 0.25s cubic-bezier(.22,1,.36,1);font-family:'Outfit',sans-serif;
}
.tab:hover{color:#888;}
.tab-active{background:rgba(255,255,255,0.09);color:#e0e0e0;box-shadow:0 2px 14px rgba(0,0,0,0.35);}
.tab-icon{font-size:15px;}

/* glass card */
.glass-card{
  background:rgba(255,255,255,0.025);
  border:1px solid rgba(255,255,255,0.065);
  border-radius:24px;padding:22px 18px;margin-bottom:14px;
  position:relative;z-index:1;backdrop-filter:blur(12px);
}
.card-title{margin:0 0 18px;font-size:11px;font-weight:800;color:#555;letter-spacing:1.5px;text-transform:uppercase;}

/* rows */
.row{
  display:flex;align-items:flex-start;gap:13px;
  padding:13px 11px;border-radius:16px;
  background:rgba(255,255,255,0.02);
  border:1px solid rgba(255,255,255,0.04);
  transition:all 0.36s cubic-bezier(.22,1,.36,1);
}
.row:hover{background:rgba(255,255,255,0.05)!important;border-color:rgba(255,255,255,0.09)!important;}
.row-new{animation:slideIn 0.55s cubic-bezier(.22,1,.36,1);}
.row-out{opacity:0!important;transform:translateX(22px) scale(0.95)!important;}

.row-icon{width:44px;height:44px;border-radius:14px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.row-meta{flex:1;display:flex;flex-direction:column;gap:4px;min-width:0;}
.row-title{font-size:14px;font-weight:700;color:#ddd;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.row-sub{display:flex;align-items:center;gap:7px;}
.row-cat{font-size:10px;font-weight:800;padding:2px 8px;border-radius:99px;letter-spacing:0.2px;}
.row-date{font-size:11px;color:#3a3a4a;}
.row-note{font-size:11px;color:#44445a;font-style:italic;}
.row-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0;}
.row-amount{font-size:15px;font-weight:900;letter-spacing:-0.5px;}
.row-del{
  background:rgba(255,60,60,0.07);border:1px solid rgba(255,60,60,0.14);
  border-radius:8px;color:#ff4444;width:27px;height:27px;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all 0.2s;flex-shrink:0;
}
.row-del:hover{background:rgba(255,60,60,0.2)!important;border-color:rgba(255,60,60,0.42)!important;transform:scale(1.12);}

/* form */
.form-group{display:flex;flex-direction:column;gap:7px;margin-bottom:16px;}
.form-label{font-size:11px;font-weight:800;color:#555;letter-spacing:1.2px;text-transform:uppercase;}
.xp-input{
  background:rgba(255,255,255,0.04);
  border:1.5px solid rgba(255,255,255,0.08);
  border-radius:14px;padding:13px 16px;
  color:#fff;font-size:15px;outline:none;
  transition:border-color 0.2s,background 0.2s;
  font-family:'Outfit',sans-serif;
  width:100%;
}
.xp-input:focus{border-color:rgba(167,139,250,0.5)!important;background:rgba(167,139,250,0.06)!important;}
.xp-input::placeholder{color:#2e2e3e;}
.xp-input-err{border-color:rgba(255,100,100,0.45)!important;background:rgba(255,70,70,0.04)!important;}
.err-msg{font-size:11px;color:#ff6b6b;}

input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.35);cursor:pointer;}
input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
textarea.xp-input{height:76px;resize:none;padding-top:13px;}

.cat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
.cat-chip{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:4px;padding:12px 6px;border-radius:14px;
  background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.07);
  color:#666;cursor:pointer;transition:all 0.2s;font-family:'Outfit',sans-serif;
}
.cat-chip:hover{transform:scale(1.06);border-color:rgba(255,255,255,0.14)!important;color:#bbb!important;}

.submit-btn{
  width:100%;padding:16px 24px;border-radius:16px;
  background:linear-gradient(135deg,rgba(167,139,250,0.9),rgba(78,201,255,0.8));
  border:none;color:#fff;font-size:16px;font-weight:900;cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:10px;
  font-family:'Outfit',sans-serif;margin-top:4px;letter-spacing:-0.3px;
  transition:all 0.22s;box-shadow:0 4px 28px rgba(167,139,250,0.28);
}
.submit-btn:hover{transform:translateY(-2px);box-shadow:0 10px 36px rgba(167,139,250,0.45)!important;}
.submit-btn:hover .submit-arr{transform:translateX(5px);}
.submit-btn:active{transform:translateY(0);}
.submit-arr{font-size:20px;transition:transform 0.2s;}

.filter-scroll{display:flex;gap:8px;overflow-x:auto;padding-bottom:12px;margin-bottom:4px;scrollbar-width:none;z-index:1;position:relative;}
.fchip{
  flex-shrink:0;padding:7px 14px;border-radius:99px;font-size:12px;font-weight:700;
  background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.07);
  color:#555;cursor:pointer;transition:all 0.2s;font-family:'Outfit',sans-serif;white-space:nowrap;
}
.fchip:hover{color:#999!important;border-color:rgba(255,255,255,0.14)!important;}

.view-all-btn{
  background:transparent;border:1px solid rgba(255,255,255,0.09);
  border-radius:12px;color:#555;font-size:13px;font-weight:700;
  padding:10px 16px;cursor:pointer;font-family:'Outfit',sans-serif;transition:all 0.2s;margin-top:4px;
  width:100%;
}
.view-all-btn:hover{color:#999!important;border-color:rgba(255,255,255,0.18)!important;}

/* animations */
@keyframes slideIn{
  from{opacity:0;transform:translateY(-14px) scale(0.97);}
  to{opacity:1;transform:translateY(0) scale(1);}
}
@keyframes fadeIn{
  from{opacity:0;transform:translateY(12px);}
  to{opacity:1;transform:translateY(0);}
}
.fade-in{animation:fadeIn 0.4s cubic-bezier(.22,1,.36,1);}
`;