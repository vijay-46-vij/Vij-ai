import { useState, useRef, useEffect } from "react";

const DB = {
  users: {
    "vijay@vijAI.com": { name: "Vijay", password: "vijay123", role: "admin", credits: 999, isPro: true, joined: "2026-01-01", totalUsage: 0 },
    "demo@vijAI.com":  { name: "Demo User", password: "demo123", role: "user", credits: 10, isPro: false, joined: "2026-05-30", totalUsage: 3 },
    "ravi@vijAI.com":  { name: "Ravi Kumar", password: "ravi123", role: "user", credits: 0, isPro: false, joined: "2026-05-28", totalUsage: 10 },
  },
};

function getUser(email) { return DB.users[email] ? { ...DB.users[email], email } : null; }
function saveUser(email, data) { DB.users[email] = { ...DB.users[email], ...data }; }
function getAllUsers() { return Object.entries(DB.users).map(([email, u]) => ({ ...u, email })); }

function resetDailyIfNeeded(email) {
  const u = DB.users[email];
  const today = new Date().toDateString();
  if (!u.isPro && u.lastReset !== today) {
    DB.users[email].credits = 10;
    DB.users[email].lastReset = today;
  }
}

async function askClaude(messages, system = "") {
  const body = { model: "claude-sonnet-4-20250514", max_tokens: 1000, messages };
  if (system) body.system = system;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.content?.map(c => c.text || "").join("") || "No response.";
}

function getImageUrl(prompt) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=${Date.now()}`;
}

async function generateVideoScript(prompt) {
  const res = await askClaude(
    [{ role: "user", content: `Create a detailed video script for: "${prompt}". Return ONLY JSON: {"title":"...","duration":"15-30s","style":"...","scenes":[{"id":1,"timeStamp":"0s","visual":"...","action":"..."},{"id":2,"timeStamp":"5s","visual":"...","action":"..."},{"id":3,"timeStamp":"10s","visual":"...","action":"..."}],"voiceover":"...","music":"..."}` }]
  );
  try { return JSON.parse(res.replace(/```json|```/g, "").trim()); }
  catch { return { title: prompt, duration: "15s", style: "Cinematic", scenes: [{ id: 1, timeStamp: "0s", visual: prompt, action: "Camera pans slowly" }], voiceover: "An AI-generated story unfolds...", music: "Ambient" }; }
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#f7f6f2;--surface:#ffffff;--surface2:#f0efe9;--border:#e4e3db;--text:#111110;--text2:#7a7970;--accent:#111110;--accent2:#2d6a4f;--pro:#c9973a;--danger:#c0392b;--radius:18px;}
body{background:var(--bg);font-family:'Sora',sans-serif;color:var(--text);-webkit-font-smoothing:antialiased}
.app{min-height:100vh;max-width:480px;margin:0 auto;background:var(--bg);display:flex;flex-direction:column}
.auth-wrap{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:32px 24px;gap:24px}
.auth-logo{font-family:'Playfair Display',serif;font-size:42px;font-weight:700;letter-spacing:-1px}
.auth-logo span{font-style:italic;color:var(--text2)}
.auth-tagline{font-size:13px;color:var(--text2);text-align:center;line-height:1.6;max-width:260px}
.auth-card{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px;display:flex;flex-direction:column;gap:14px}
.auth-card h3{font-size:16px;font-weight:600}
.field{display:flex;flex-direction:column;gap:5px}
.field label{font-size:11px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:var(--text2)}
.field input{padding:11px 14px;border:1px solid var(--border);border-radius:10px;font-family:'Sora',sans-serif;font-size:14px;background:var(--bg);color:var(--text);outline:none}
.field input:focus{border-color:var(--accent)}
.auth-btn{padding:13px;background:var(--accent);color:white;border:none;border-radius:12px;font-family:'Sora',sans-serif;font-size:14px;font-weight:600;cursor:pointer}
.auth-err{font-size:12px;color:var(--danger);background:#fdf0ef;border:1px solid #f5c6c3;border-radius:8px;padding:8px 12px}
.auth-switch{font-size:13px;color:var(--text2);text-align:center;cursor:pointer}
.auth-switch b{color:var(--text)}
.header{padding:16px 18px 0;display:flex;align-items:center;justify-content:space-between}
.h-logo{font-family:'Playfair Display',serif;font-size:20px;font-weight:700}
.h-logo span{font-style:italic;color:var(--text2);font-size:16px}
.h-right{display:flex;align-items:center;gap:8px}
.credits-pill{display:flex;align-items:center;gap:5px;background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:5px 10px;font-size:12px;font-weight:600}
.credits-pill.low{background:#fff4e5;border-color:#ffd080;color:#8a5500}
.credits-pill.pro{background:#fffbf0;border-color:var(--pro);color:var(--pro)}
.avatar-btn{width:32px;height:32px;border-radius:50%;background:var(--accent);color:white;border:none;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center}
.tabs{display:flex;gap:5px;padding:14px 18px;overflow-x:auto;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{flex-shrink:0;padding:9px 14px;border:none;background:var(--surface2);border-radius:12px;font-family:'Sora',sans-serif;font-size:12px;font-weight:500;color:var(--text2);cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:5px;white-space:nowrap}
.tab.active{background:var(--accent);color:white}
.panel{flex:1;padding:0 18px 24px;display:flex;flex-direction:column;gap:12px;animation:fadeUp .25s ease}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.chat-box{flex:1;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px;overflow-y:auto;min-height:360px;max-height:360px;display:flex;flex-direction:column;gap:10px}
.chat-empty{margin:auto;text-align:center;color:var(--text2)}
.chat-empty .big{font-family:'Playfair Display',serif;font-size:28px;font-style:italic;margin-bottom:8px}
.chat-empty p{font-size:13px;line-height:1.7}
.msg{display:flex;flex-direction:column;gap:3px;max-width:90%}
.msg.user{align-self:flex-end;align-items:flex-end}
.msg.ai{align-self:flex-start;align-items:flex-start}
.msg-who{font-size:10px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:var(--text2)}
.bubble{padding:10px 14px;border-radius:14px;font-size:13.5px;line-height:1.6}
.msg.user .bubble{background:var(--accent);color:white;border-bottom-right-radius:4px}
.msg.ai .bubble{background:var(--surface2);border-bottom-left-radius:4px}
.typing{display:flex;gap:4px;padding:12px 14px;background:var(--surface2);border-radius:14px;width:fit-content}
.typing span{width:6px;height:6px;background:var(--text2);border-radius:50%;animation:dot 1.2s infinite}
.typing span:nth-child(2){animation-delay:.2s}.typing span:nth-child(3){animation-delay:.4s}
@keyframes dot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
.input-row{display:flex;gap:8px;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:8px 8px 8px 14px;align-items:flex-end}
.input-row textarea{flex:1;border:none;outline:none;resize:none;font-family:'Sora',sans-serif;font-size:13.5px;background:transparent;color:var(--text);line-height:1.5;max-height:100px;min-height:22px}
.input-row textarea::placeholder{color:var(--text2)}
.send-btn{width:36px;height:36px;background:var(--accent);color:white;border:none;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.send-btn:disabled{opacity:.4;cursor:not-allowed}
.prompt-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px;display:flex;flex-direction:column;gap:10px}
.prompt-card textarea{border:none;outline:none;resize:none;font-family:'Sora',sans-serif;font-size:13.5px;background:transparent;color:var(--text);line-height:1.5;min-height:72px}
.prompt-card textarea::placeholder{color:var(--text2)}
.divider{height:1px;background:var(--border)}
.slabel{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text2)}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{padding:5px 12px;border-radius:20px;border:1px solid var(--border);background:transparent;font-family:'Sora',sans-serif;font-size:11.5px;color:var(--text2);cursor:pointer}
.chip.on{background:var(--accent);color:white;border-color:var(--accent)}
.gen-btn{width:100%;padding:14px;background:var(--accent);color:white;border:none;border-radius:12px;font-family:'Sora',sans-serif;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}
.gen-btn:disabled{opacity:.45;cursor:not-allowed}
.pro-btn{width:100%;padding:13px;background:linear-gradient(135deg,#c9973a,#e8b84b);color:white;border:none;border-radius:12px;font-family:'Sora',sans-serif;font-size:13.5px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}
.result-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden}
.result-img{width:100%;aspect-ratio:1;object-fit:cover;display:block}
.placeholder{aspect-ratio:1;display:flex;align-items:center;justify-content:center;background:var(--surface2);flex-direction:column;gap:8px;color:var(--text2);font-size:13px}
.placeholder .emo{font-size:36px}
.result-meta{padding:12px 14px;display:flex;align-items:center;justify-content:space-between}
.result-meta span{font-size:11.5px;color:var(--text2)}
.mini-btn{padding:6px 12px;border:1px solid var(--border);border-radius:8px;background:transparent;font-family:'Sora',sans-serif;font-size:11.5px;font-weight:500;cursor:pointer;color:var(--text)}
.video-frame{aspect-ratio:16/9;background:var(--surface2);border-radius:var(--radius);border:1px solid var(--border);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--text2);font-size:13px;text-align:center;padding:20px}
.video-frame .emo{font-size:40px}
.scene-cards{display:flex;flex-direction:column;gap:8px}
.scene-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 14px}
.scene-card .ts{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--pro);margin-bottom:4px}
.scene-card .visual{font-size:13px;font-weight:500;margin-bottom:2px}
.scene-card .action{font-size:12px;color:var(--text2)}
.vo-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 14px}
.vo-card .label{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text2);margin-bottom:6px}
.vo-card p{font-size:13px;line-height:1.65;color:var(--text);font-style:italic}
.info-bar{background:#eef7f3;border:1px solid #b7deca;border-radius:10px;padding:10px 14px;font-size:12px;color:#1a5c3a;line-height:1.6}
.warn-bar{background:#fff8ed;border:1px solid #ffd080;border-radius:10px;padding:10px 14px;font-size:12px;color:#7a5c00;line-height:1.5}
.no-credits{background:#fdf0ef;border:1px solid #f5c6c3;border-radius:12px;padding:20px;text-align:center;display:flex;flex-direction:column;gap:12px;align-items:center}
.no-credits .emo{font-size:32px}
.no-credits p{font-size:13px;color:var(--text2);line-height:1.6}
.spin{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:s .7s linear infinite;display:inline-block}
@keyframes s{to{transform:rotate(360deg)}}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100;display:flex;align-items:flex-end;justify-content:center}
.modal{width:100%;max-width:480px;background:var(--surface);border-radius:24px 24px 0 0;padding:28px 24px 36px;display:flex;flex-direction:column;gap:16px}
.modal h2{font-family:'Playfair Display',serif;font-size:24px;font-weight:700}
.modal h2 span{font-style:italic;color:var(--pro)}
.price-tag{background:linear-gradient(135deg,#fffbf0,#fff4d0);border:1.5px solid var(--pro);border-radius:14px;padding:20px;text-align:center}
.price-tag .amount{font-size:40px;font-weight:700;color:var(--pro);font-family:'Playfair Display',serif}
.price-tag .desc{font-size:13px;color:var(--text2);margin-top:4px}
.perks{display:flex;flex-direction:column;gap:8px}
.perk{display:flex;align-items:center;gap:10px;font-size:13px}
.perk .dot{width:20px;height:20px;background:var(--accent2);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;flex-shrink:0}
.pay-btn{padding:15px;background:linear-gradient(135deg,#c9973a,#e8b84b);color:white;border:none;border-radius:14px;font-family:'Sora',sans-serif;font-size:15px;font-weight:700;cursor:pointer}
.close-btn{padding:12px;background:transparent;border:1px solid var(--border);border-radius:12px;font-family:'Sora',sans-serif;font-size:13px;cursor:pointer;color:var(--text2)}
.profile-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;display:flex;flex-direction:column;gap:16px}
.avatar-lg{width:64px;height:64px;border-radius:50%;background:var(--accent);color:white;font-size:24px;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif}
.profile-name{font-size:20px;font-weight:700;font-family:'Playfair Display',serif}
.profile-email{font-size:13px;color:var(--text2)}
.stat-row{display:flex;gap:10px}
.stat{flex:1;background:var(--surface2);border-radius:12px;padding:12px;text-align:center}
.stat .num{font-size:22px;font-weight:700;font-family:'Playfair Display',serif}
.stat .lbl{font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:.8px;margin-top:2px}
.logout-btn{padding:12px;background:transparent;border:1px solid var(--border);border-radius:12px;font-family:'Sora',sans-serif;font-size:13px;cursor:pointer;color:var(--danger);font-weight:600}
.admin-header{display:flex;align-items:center;gap:10px;margin-bottom:4px}
.admin-badge{background:var(--danger);color:white;font-size:10px;font-weight:700;letter-spacing:1px;padding:3px 8px;border-radius:6px;text-transform:uppercase}
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.admin-stat{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:14px}
.admin-stat .n{font-size:28px;font-weight:700;font-family:'Playfair Display',serif}
.admin-stat .l{font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:.8px;margin-top:2px}
.user-list{display:flex;flex-direction:column;gap:8px}
.user-row{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:14px;display:flex;align-items:center;gap:12px}
.u-avatar{width:38px;height:38px;border-radius:50%;background:var(--accent);color:white;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.u-info{flex:1;min-width:0}
.u-name{font-size:14px;font-weight:600}
.u-email{font-size:11px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.u-meta{display:flex;gap:6px;margin-top:4px;flex-wrap:wrap}
.tag{font-size:10px;font-weight:600;letter-spacing:.5px;padding:2px 8px;border-radius:6px;text-transform:uppercase}
.tag.pro{background:#fffbf0;color:var(--pro);border:1px solid var(--pro)}
.tag.free{background:var(--surface2);color:var(--text2);border:1px solid var(--border)}
.tag.admin{background:#fdf0ef;color:var(--danger);border:1px solid #f5c6c3}
.u-credits{font-size:13px;font-weight:600;flex-shrink:0}
.action-row{display:flex;gap:6px;margin-top:8px}
.a-btn{flex:1;padding:7px;border-radius:8px;border:1px solid var(--border);background:transparent;font-family:'Sora',sans-serif;font-size:11px;font-weight:600;cursor:pointer}
.a-btn.give{background:var(--accent);color:white;border-color:var(--accent)}
.a-btn.pro{background:#fffbf0;color:var(--pro);border-color:var(--pro)}
.a-btn.ban{color:var(--danger);border-color:#f5c6c3}
`;

function CreditGuard({ user, onUpgrade, children }) {
  if (user.isPro || user.credits > 0) return children;
  return (
    <div className="no-credits">
      <div className="emo">⚡</div>
      <strong>Daily credits used up!</strong>
      <p>You've used all 10 free credits for today.<br />Upgrade to Pro for unlimited access.</p>
      <button className="pro-btn" onClick={onUpgrade}>✦ Upgrade to Pro — ₹100 only</button>
    </div>
  );
}

function ChatTab({ user, setUser, onUpgrade }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const taRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);
  const send = async () => {
    if (!input.trim() || loading) return;
    if (!user.isPro && user.credits <= 0) return;
    const userMsg = { role: "user", content: input.trim() };
    const hist = [...msgs, userMsg];
    setMsgs(hist); setInput("");
    taRef.current && (taRef.current.style.height = "22px");
    setLoading(true);
    if (!user.isPro) { const c = user.credits - 1; saveUser(user.email, { credits: c }); setUser(u => ({ ...u, credits: c })); }
    try {
      const reply = await askClaude(hist.map(m => ({ role: m.role, content: m.content })), "You are VijAI, a friendly helpful AI assistant. Be concise and clear.");
      setMsgs([...hist, { role: "assistant", content: reply }]);
    } catch { setMsgs([...hist, { role: "assistant", content: "Sorry, something went wrong. Try again." }]); }
    setLoading(false);
  };
  return (
    <div className="panel">
      <div className="chat-box">
        {msgs.length === 0 ? (
          <div className="chat-empty">
            <div className="big">Hello, {user.name.split(" ")[0]}.</div>
            <p>Ask me anything — writing, ideas,<br />code, advice, and much more.</p>
          </div>
        ) : msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role === "user" ? "user" : "ai"}`}>
            <div className="msg-who">{m.role === "user" ? "You" : "VijAI"}</div>
            <div className="bubble">{m.content}</div>
          </div>
        ))}
        {loading && <div className="msg ai"><div className="msg-who">VijAI</div><div className="typing"><span/><span/><span/></div></div>}
        <div ref={endRef} />
      </div>
      <CreditGuard user={user} onUpgrade={onUpgrade}>
        <div className="input-row">
          <textarea ref={taRef} rows={1} placeholder="Ask anything…" value={input}
            onChange={e => { setInput(e.target.value); e.target.style.height = "22px"; e.target.style.height = e.target.scrollHeight + "px"; }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            style={{ height: "22px" }} />
          <button className="send-btn" onClick={send} disabled={loading || !input.trim()}>
            {loading ? <span className="spin" /> : "↑"}
          </button>
        </div>
      </CreditGuard>
    </div>
  );
}

const IMG_STYLES = ["Realistic", "Anime", "Oil Painting", "Sketch", "Watercolor", "3D Render", "Pixel Art"];

function ImageTab({ user, setUser, onUpgrade }) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Realistic");
  const [loading, setLoading] = useState(false);
  const [imgUrl, setImgUrl] = useState(null);
  const [enhanced, setEnhanced] = useState("");
  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true); setImgUrl(null);
    if (!user.isPro) { const c = user.credits - 1; saveUser(user.email, { credits: c }); setUser(u => ({ ...u, credits: c })); }
    try {
      const ep = await askClaude([{ role: "user", content: `Rewrite for AI image gen, ${style} style: "${prompt}". ONLY the enhanced prompt.` }]);
      setEnhanced(ep.trim());
      setImgUrl(getImageUrl(`${ep.trim()} ${style} style, high quality`));
    } catch { setImgUrl(getImageUrl(prompt)); }
    setLoading(false);
  };
  return (
    <div className="panel">
      <div className="info-bar">🎨 Real AI images via Pollinations AI — free, no watermark.</div>
      <div className="prompt-card">
        <textarea placeholder="Describe the image you want…" value={prompt} onChange={e => setPrompt(e.target.value)} />
        <div className="divider" />
        <div className="slabel">Style</div>
        <div className="chips">{IMG_STYLES.map(s => <button key={s} className={`chip ${style === s ? "on" : ""}`} onClick={() => setStyle(s)}>{s}</button>)}</div>
      </div>
      <CreditGuard user={user} onUpgrade={onUpgrade}>
        <button className="gen-btn" onClick={generate} disabled={loading || !prompt.trim()}>
          {loading ? <><span className="spin" /> Generating…</> : "✦ Generate Image"}
        </button>
      </CreditGuard>
      {(loading || imgUrl) && (
        <div className="result-card">
          {loading ? <div className="placeholder"><div className="emo">🎨</div><span>Creating your image…</span></div>
            : <><img src={imgUrl} alt="Generated" className="result-img" /><div className="result-meta"><span>{style} · {enhanced.slice(0,30)}…</span><button className="mini-btn" onClick={() => window.open(imgUrl,"_blank")}>Open ↗</button></div></>}
        </div>
      )}
    </div>
  );
}

const VID_STYLES = ["Cinematic", "Documentary", "Animation", "Short Reel", "Ad / Promo", "Tutorial"];

function VideoTab({ user, setUser, onUpgrade }) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Cinematic");
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState(null);
  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true); setScript(null);
    if (!user.isPro) { const c = user.credits - 2; saveUser(user.email, { credits: c }); setUser(u => ({ ...u, credits: c })); }
    const s = await generateVideoScript(`${style} style: ${prompt}`);
    setScript(s); setLoading(false);
  };
  return (
    <div className="panel">
      <div className="info-bar">🎬 AI generates storyboard + voiceover script. Costs 2 credits.</div>
      <div className="prompt-card">
        <textarea placeholder="Describe your video concept…" value={prompt} onChange={e => setPrompt(e.target.value)} />
        <div className="divider" />
        <div className="slabel">Style</div>
        <div className="chips">{VID_STYLES.map(s => <button key={s} className={`chip ${style === s ? "on" : ""}`} onClick={() => setStyle(s)}>{s}</button>)}</div>
      </div>
      <CreditGuard user={user} onUpgrade={onUpgrade}>
        <button className="gen-btn" onClick={generate} disabled={loading || !prompt.trim()}>
          {loading ? <><span className="spin" /> Writing Script…</> : "▶ Generate Video Script"}
        </button>
      </CreditGuard>
      {!script && !loading && <div className="video-frame"><div className="emo">🎬</div><span>Enter a description above</span></div>}
      {loading && <div className="video-frame"><div className="emo">🎬</div><span>Writing your script…</span></div>}
      {script && (
        <>
          <div className="warn-bar">🎥 <strong>{script.title}</strong> · {script.duration} · 🎵 {script.music || "Ambient"}</div>
          <div className="slabel" style={{paddingLeft:2}}>Storyboard</div>
          <div className="scene-cards">
            {script.scenes?.map(sc => (
              <div key={sc.id} className="scene-card">
                <div className="ts">⏱ {sc.timeStamp}</div>
                <div className="visual">{sc.visual}</div>
                <div className="action">🎥 {sc.action}</div>
              </div>
            ))}
          </div>
          <div className="vo-card"><div className="label">🎙 Voiceover</div><p>{script.voiceover}</p></div>
        </>
      )}
    </div>
  );
}

function ProfileTab({ user, onUpgrade, onLogout }) {
  return (
    <div className="panel">
      <div className="profile-card">
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div className="avatar-lg">{user.name[0]}</div>
          <div>
            <div className="profile-name">{user.name}</div>
            <div className="profile-email">{user.email}</div>
            <div style={{marginTop:4}}>
              {user.role === "admin" && <span className="tag admin">Admin</span>}
              {user.isPro ? <span className="tag pro" style={{marginLeft:4}}>⭐ Pro</span> : <span className="tag free">Free</span>}
            </div>
          </div>
        </div>
        <div className="stat-row">
          <div className="stat"><div className="num">{user.isPro ? "∞" : user.credits}</div><div className="lbl">Credits</div></div>
          <div className="stat"><div className="num">10</div><div className="lbl">Daily Free</div></div>
          <div className="stat"><div className="num">{user.totalUsage||0}</div><div className="lbl">Total Uses</div></div>
        </div>
      </div>
      {!user.isPro && (
        <div className="no-credits" style={{background:"var(--surface)",border:"1.5px solid var(--pro)"}}>
          <div className="emo">⭐</div>
          <strong style={{fontSize:16}}>Upgrade to Pro</strong>
          <p>Unlimited Chat, Image & Video. One-time ₹100, forever.</p>
          <button className="pro-btn" onClick={onUpgrade}>✦ Upgrade Now — ₹100 only</button>
        </div>
      )}
      {user.isPro && <div className="info-bar">✅ You are a <strong>Pro member</strong> — unlimited access.</div>}
      <button className="logout-btn" onClick={onLogout}>Sign Out</button>
    </div>
  );
}

function AdminTab({ currentUser }) {
  const [users, setUsers] = useState(getAllUsers());
  const [msg, setMsg] = useState("");
  const giveCredits = (email) => { saveUser(email, { credits: (DB.users[email].credits||0)+10 }); setUsers(getAllUsers()); setMsg(`+10 credits → ${email}`); setTimeout(()=>setMsg(""),2500); };
  const togglePro = (email) => { const cur = DB.users[email].isPro; saveUser(email, { isPro: !cur, credits: !cur?999:10 }); setUsers(getAllUsers()); setMsg(`${email} → ${!cur?"Pro ✓":"Free"}`); setTimeout(()=>setMsg(""),2500); };
  const banUser = (email) => { if(email===currentUser.email) return setMsg("Cannot ban yourself!"); saveUser(email,{banned:!DB.users[email].banned}); setUsers(getAllUsers()); setMsg(`${DB.users[email].banned?"Unbanned":"Banned"}: ${email}`); setTimeout(()=>setMsg(""),2500); };
  const proUsers = users.filter(u=>u.isPro).length;
  return (
    <div className="panel">
      <div className="admin-header"><span style={{fontSize:16,fontWeight:700}}>Admin Panel</span><span className="admin-badge">Admin</span></div>
      {msg && <div className="info-bar">✅ {msg}</div>}
      <div className="stat-grid">
        <div className="admin-stat"><div className="n">{users.length}</div><div className="l">Total Users</div></div>
        <div className="admin-stat"><div className="n" style={{color:"var(--pro)"}}>{proUsers}</div><div className="l">Pro Users</div></div>
        <div className="admin-stat"><div className="n">₹{proUsers*100}</div><div className="l">Revenue</div></div>
        <div className="admin-stat"><div className="n">{users.reduce((a,u)=>a+(u.credits||0),0)}</div><div className="l">Credits Pool</div></div>
      </div>
      <div className="slabel" style={{paddingLeft:2}}>All Users</div>
      <div className="user-list">
        {users.map(u => (
          <div key={u.email} className="user-row">
            <div className="u-avatar">{u.name[0]}</div>
            <div className="u-info">
              <div className="u-name">{u.name}</div>
              <div className="u-email">{u.email}</div>
              <div className="u-meta">
                {u.role==="admin"&&<span className="tag admin">Admin</span>}
                {u.isPro?<span className="tag pro">Pro</span>:<span className="tag free">Free</span>}
                {u.banned&&<span className="tag" style={{background:"#fdf0ef",color:"var(--danger)",border:"1px solid #f5c6c3"}}>Banned</span>}
              </div>
              <div className="action-row">
                <button className="a-btn give" onClick={()=>giveCredits(u.email)}>+10 Credits</button>
                <button className="a-btn pro" onClick={()=>togglePro(u.email)}>{u.isPro?"Revoke Pro":"Make Pro"}</button>
                <button className="a-btn ban" onClick={()=>banUser(u.email)}>{u.banned?"Unban":"Ban"}</button>
              </div>
            </div>
            <div className="u-credits">{u.isPro?"∞":u.credits||0}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PayModal({ onClose, onPay }) {
  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <h2>Upgrade to <span>Pro</span></h2>
        <div className="price-tag"><div className="amount">₹100</div><div className="desc">One-time · Unlimited forever</div></div>
        <div className="perks">
          {["Unlimited AI Chat","Unlimited Image Generation","Unlimited Video Scripts","Priority responses","Early access to features"].map((p,i)=>(
            <div key={i} className="perk"><div className="dot">✓</div>{p}</div>
          ))}
        </div>
        <button className="pay-btn" onClick={onPay}>Pay ₹100 via UPI / Card →</button>
        <button className="close-btn" onClick={onClose}>Maybe later</button>
      </div>
    </div>
  );
}

function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const submit = () => {
    setErr("");
    if (!email||!pass) return setErr("Please fill all fields.");
    if (mode==="login") {
      const u = getUser(email);
      if (!u||u.password!==pass) return setErr("Invalid email or password.");
      if (u.banned) return setErr("Your account has been suspended.");
      resetDailyIfNeeded(email);
      onLogin(getUser(email));
    } else {
      if (!name) return setErr("Please enter your name.");
      if (DB.users[email]) return setErr("Email already registered.");
      DB.users[email]={name,password:pass,role:"user",credits:10,isPro:false,joined:new Date().toISOString().split("T")[0],totalUsage:0};
      onLogin(getUser(email));
    }
  };
  return (
    <div className="auth-wrap">
      <div className="auth-logo">Vij<span>AI</span></div>
      <div className="auth-tagline">Your personal AI — chat, create images & videos.</div>
      <div className="auth-card">
        <h3>{mode==="login"?"Sign in to VijAI":"Create your account"}</h3>
        {mode==="register"&&<div className="field"><label>Name</label><input placeholder="Your full name" value={name} onChange={e=>setName(e.target.value)}/></div>}
        <div className="field"><label>Email</label><input placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)}/></div>
        <div className="field"><label>Password</label><input type="password" placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
        {err&&<div className="auth-err">⚠️ {err}</div>}
        <button className="auth-btn" onClick={submit}>{mode==="login"?"Sign In →":"Create Account →"}</button>
        <div className="auth-switch" onClick={()=>{setMode(mode==="login"?"register":"login");setErr("");}}>
          {mode==="login"?<>New to VijAI? <b>Create account</b></>:<>Already have an account? <b>Sign in</b></>}
        </div>
      </div>
      <div style={{fontSize:12,color:"var(--text2)",textAlign:"center"}}>Demo: vijay@vijAI.com / vijay123</div>
    </div>
  );
}

export default function VijAI() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("chat");
  const [showPay, setShowPay] = useState(false);
  const handlePay = () => { saveUser(user.email,{isPro:true,credits:999}); setUser(u=>({...u,isPro:true,credits:999})); setShowPay(false); alert("🎉 Welcome to Pro!"); };
  const handleLogout = () => { setUser(null); setTab("chat"); };
  if (!user) return (<><style>{css}</style><Auth onLogin={setUser}/></>);
  return (
    <>
      <style>{css}</style>
      {showPay&&<PayModal onClose={()=>setShowPay(false)} onPay={handlePay}/>}
      <div className="app">
        <div className="header">
          <div className="h-logo">Vij<span>AI</span></div>
          <div className="h-right">
            <div className={`credits-pill ${user.isPro?"pro":user.credits<=3?"low":""}`}>{user.isPro?"⭐ Pro":`⚡ ${user.credits} left`}</div>
            <button className="avatar-btn" onClick={()=>setTab("profile")}>{user.name[0]}</button>
          </div>
        </div>
        <div className="tabs">
          {[["chat","💬","Chat"],["image","🎨","Image"],["video","🎬","Video"],["profile","👤","Profile"],
            ...(user.role==="admin"?[["admin","🛡️","Admin"]]:[])
          ].map(([id,icon,label])=>(
            <button key={id} className={`tab ${tab===id?"active":""}`} onClick={()=>setTab(id)}>{icon} {label}</button>
          ))}
        </div>
        {tab==="chat"&&<ChatTab user={user} setUser={setUser} onUpgrade={()=>setShowPay(true)}/>}
        {tab==="image"&&<ImageTab user={user} setUser={setUser} onUpgrade={()=>setShowPay(true)}/>}
        {tab==="video"&&<VideoTab user={user} setUser={setUser} onUpgrade={()=>setShowPay(true)}/>}
        {tab==="profile"&&<ProfileTab user={user} onUpgrade={()=>setShowPay(true)} onLogout={handleLogout}/>}
        {tab==="admin"&&user.role==="admin"&&<AdminTab currentUser={user}/>}
      </div>
    </>
  );
}
