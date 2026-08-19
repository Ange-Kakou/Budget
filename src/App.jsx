import React, { useState, useEffect, useMemo, useContext, createContext, useRef } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, LineChart, Line, CartesianGrid,
} from "recharts";
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank, Plus, LayoutDashboard,
  ListPlus, Table2, Trash2, ChevronDown, ChevronUp, LogOut, User,
  Settings, Sun, Moon, Camera, X, Scale, Minus,
  CheckCircle2, AlertTriangle, ChevronRight, ChevronLeft, PlayCircle,
} from "lucide-react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";

const GROUPS = ["Revenus", "Dépenses", "Factures", "Crédits", "Épargne", "Objectifs"];
const TX_GROUPS = GROUPS.filter((g) => g !== "Objectifs");
const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const MONTHS_FULL = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const RATTRAPER = [
  { title: "🔄 À rattraper", message: (x) => `Il manque ${fmt(x)} pour atteindre ton objectif. Courage ! 💪` },
  { title: "⏳ Pas encore là", message: (x) => `Encore ${fmt(x)} à économiser pour être dans les clous. Tu peux le faire ! 🙌` },
  { title: "📈 Petit effort à faire", message: (x) => `Il te reste ${fmt(x)} à mettre de côté pour tenir ton objectif. On y croit ! 🔥` },
  { title: "🚧 En cours de route", message: (x) => `${fmt(x)} séparent encore ton épargne de ton objectif. Chaque geste compte ! 🌱` },
  { title: "🧭 Objectif en vue", message: (x) => `Plus que ${fmt(x)} à économiser pour l'atteindre. Reste concentré(e) ! 🎯` },
];
const RESPECTE = [
  { title: "🎯 Objectif respecté", message: () => "Bravo ! Tu es dans les temps. Continue comme ça ! 👏" },
  { title: "✅ Objectif atteint", message: () => "Parfait équilibre ! Tu as économisé exactement ce qu'il fallait. 🙂" },
  { title: "🏅 Dans les clous", message: () => "Bien joué, ton épargne colle parfaitement à ton objectif. Continue ainsi ! 💫" },
  { title: "📌 Cap maintenu", message: () => "Tu tiens ton objectif à la perfection. Garde ce rythme ! 🚀" },
  { title: "🌟 Mission accomplie", message: () => "Ton objectif du mois est atteint pile-poil. Impressionnant ! 👌" },
];
const DEPASSE = [
  { title: "🥇 Performance exceptionnelle !", message: (x) => `Excellent ! Tu dépasses ton objectif de ${fmt(x)}. Félicitations ! 🎉` },
  { title: "🚀 Tu assures grave !", message: (x) => `Incroyable, ${fmt(x)} de plus que prévu économisés. Continue sur cette lancée ! 🔥` },
  { title: "💎 Épargnant(e) hors pair", message: (x) => `Tu as dépassé ton objectif de ${fmt(x)}. Quelle rigueur ! 👏` },
  { title: "🏆 Au-dessus des attentes", message: (x) => `${fmt(x)} de mieux que ton objectif. Tu gères parfaitement ton budget ! 💪` },
  { title: "✨ Objectif pulvérisé", message: (x) => `Tu as économisé ${fmt(x)} de plus que prévu. Bravo pour cette discipline ! 🎊` },
];

const COLORS_DARK = {
  ink: "#0E211D", surface: "#15332C", surface2: "#1C4038", surface3: "#234A41",
  gold: "#C99A44", goldSoft: "#E4C98A", mint: "#6FCF97", coral: "#E2725B",
  text: "#EFEAE0", textDim: "#9DB3AC", line: "#2A5148",
};
const COLORS_LIGHT = {
  ink: "#F7F4EE", surface: "#FFFFFF", surface2: "#F0ECE2", surface3: "#E4DDCB",
  gold: "#B9853A", goldSoft: "#E4C98A", mint: "#2F9E62", coral: "#C24F3A",
  text: "#1C2B27", textDim: "#6B7A75", line: "#E2DCCE",
};

const PIE_COLORS = ["#C99A44", "#6FCF97", "#5FA8D3", "#E2725B", "#8B6FCF", "#D3935F"];

const ThemeContext = createContext({ colors: COLORS_DARK, theme: "dark", setTheme: () => {} });

const defaultData = () => ({
  Revenus: [
    { name: "Salaire net", values: Array(12).fill(0) },
    { name: "Extras", values: Array(12).fill(0) },
    { name: "Revenus lucratifs", values: Array(12).fill(0) },
  ],
  Dépenses: [
    { name: "Loyer", values: Array(12).fill(0) },
    { name: "Courses", values: Array(12).fill(0) },
    { name: "Enfant", values: Array(12).fill(0) },
    { name: "Carburant", values: Array(12).fill(0) },
    { name: "Shopping", values: Array(12).fill(0) },
    { name: "Restaurant", values: Array(12).fill(0) },
    { name: "Imprévus", values: Array(12).fill(0) },
  ],
  Factures: [
    { name: "Électricité (CIE)", values: Array(12).fill(0) },
    { name: "Eau (SODECI)", values: Array(12).fill(0) },
    { name: "Wifi", values: Array(12).fill(0) },
    { name: "Netflix", values: Array(12).fill(0) },
  ],
  Crédits: [
    { name: "Prêt au travail", values: Array(12).fill(0) },
    { name: "Voiture", values: Array(12).fill(0) },
  ],
  Épargne: [
    { name: "Voyages", values: Array(12).fill(0) },
    { name: "Projets", values: Array(12).fill(0) },
    { name: "Urgence", values: Array(12).fill(0) },
  ],
  Objectifs: [
    { name: "Épargne mensuelle", values: Array(12).fill(0) },
  ],
});

function valAt(rows, monthIdx) { return monthIdx === -1 ? sumGroupTotal(rows) : sumGroupMonth(rows, monthIdx); }

const fmt = (n) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n || 0) + " F";

function sumRow(row) { return row.values.reduce((a, b) => a + (Number(b) || 0), 0); }
function sumGroupMonth(group, mIdx) { return group.reduce((a, r) => a + (Number(r.values[mIdx]) || 0), 0); }
function sumGroupTotal(group) { return group.reduce((a, r) => a + sumRow(r), 0); }

function resizeImageToBase64(file, maxSize = 128) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > height) { if (width > maxSize) { height *= maxSize / width; width = maxSize; } }
        else { if (height > maxSize) { width *= maxSize / height; height = maxSize; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function BudgetApp() {
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [data, setData] = useState(defaultData());
  const [transactions, setTransactions] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [monthIdx, setMonthIdx] = useState(new Date().getMonth());
  const [loaded, setLoaded] = useState(false);
  const [txForm, setTxForm] = useState({ date: "", type: "Dépenses", category: "", amount: "", comment: "" });
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("budget-theme") || "dark"; } catch (e) { return "dark"; }
  });
  const [onboardingSeen, setOnboardingSeen] = useState(() => {
    try { return localStorage.getItem("budget-onboarding-seen") === "1"; } catch (e) { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem("budget-theme", theme); } catch (e) {}
  }, [theme]);

  const colors = theme === "light" ? COLORS_LIGHT : COLORS_DARK;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) { setLoaded(false); setData(defaultData()); setTransactions([]); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data: rows, error: e1 } = await supabase.from("budget_items").select("*").order("position", { ascending: true });
      const { data: txRows, error: e2 } = await supabase.from("transactions").select("*").order("date", { ascending: false });

      if (!e1 && rows && rows.length > 0) {
        const rebuilt = {};
        GROUPS.forEach((g) => (rebuilt[g] = []));
        rows.forEach((r) => {
          if (!rebuilt[r.group_name]) rebuilt[r.group_name] = [];
          rebuilt[r.group_name].push({ name: r.item_name, values: r.values_by_month });
        });
        setData(rebuilt);
      } else if (!e1) {
        const initial = defaultData();
        setData(initial);
        const toInsert = [];
        GROUPS.forEach((g) => initial[g].forEach((row, idx) => {
          toInsert.push({ user_id: session.user.id, group_name: g, item_name: row.name, values_by_month: row.values, position: idx });
        }));
        await supabase.from("budget_items").insert(toInsert);
      }

      if (!e2 && txRows) {
        setTransactions(txRows.map((t) => ({
          id: t.id, date: t.date, type: t.type, category: t.category, amount: t.amount, comment: t.comment,
        })));
      }
      setLoaded(true);
    })();
  }, [session]);

  useEffect(() => {
    if (!loaded || !session) return;
    const timeout = setTimeout(async () => {
      await supabase.from("budget_items").delete().eq("user_id", session.user.id);
      const toInsert = [];
      GROUPS.forEach((g) => (data[g] || []).forEach((row, idx) => {
        toInsert.push({ user_id: session.user.id, group_name: g, item_name: row.name, values_by_month: row.values, position: idx });
      }));
      if (toInsert.length > 0) await supabase.from("budget_items").insert(toInsert);
    }, 800);
    return () => clearTimeout(timeout);
  }, [data, loaded, session]);

  const totals = useMemo(() => {
    const revenus = valAt(data.Revenus, monthIdx);
    const depenses = valAt(data.Dépenses, monthIdx) + valAt(data.Factures, monthIdx) + valAt(data.Crédits, monthIdx);
    const epargne = valAt(data.Épargne, monthIdx);
    return { revenus, depenses, epargne, solde: revenus - depenses - epargne };
  }, [data, monthIdx]);

  const pieData = useMemo(() => {
    const rows = [...data.Dépenses, ...data.Factures, ...data.Crédits];
    return rows
      .map((r) => ({ name: r.name, value: monthIdx === -1 ? sumRow(r) : (r.values[monthIdx] || 0) }))
      .filter((d) => d.value > 0);
  }, [data, monthIdx]);

  const barData = useMemo(() => MONTHS.map((m, i) => ({
    mois: m,
    Revenus: sumGroupMonth(data.Revenus, i),
    Dépenses: sumGroupMonth(data.Dépenses, i) + sumGroupMonth(data.Factures, i) + sumGroupMonth(data.Crédits, i),
  })), [data]);

  const lineData = useMemo(() => {
    let cumul = 0;
    return MONTHS.map((m, i) => {
      const net = sumGroupMonth(data.Revenus, i) - sumGroupMonth(data.Dépenses, i) - sumGroupMonth(data.Factures, i) - sumGroupMonth(data.Crédits, i) - sumGroupMonth(data.Épargne, i);
      cumul += net;
      return { mois: m, Solde: cumul };
    });
  }, [data]);

  const updateCell = (group, rowIdx, mIdx, value) => {
    setData((prev) => {
      const next = { ...prev };
      const rows = next[group].map((r, i) =>
        i === rowIdx ? { ...r, values: r.values.map((v, j) => (j === mIdx ? Number(value) || 0 : v)) } : r
      );
      next[group] = rows;
      return next;
    });
  };

  const addRow = (group) => {
    setData((prev) => ({ ...prev, [group]: [...prev[group], { name: "Nouveau libellé", values: Array(12).fill(0) }] }));
  };

  const removeRow = (group, idx) => {
    setData((prev) => ({ ...prev, [group]: prev[group].filter((_, i) => i !== idx) }));
  };

  const renameRow = (group, idx, name) => {
    setData((prev) => ({ ...prev, [group]: prev[group].map((r, i) => (i === idx ? { ...r, name } : r)) }));
  };

  const moveRow = (group, idx, direction) => {
    setData((prev) => {
      const rows = [...prev[group]];
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= rows.length) return prev;
      [rows[idx], rows[newIdx]] = [rows[newIdx], rows[idx]];
      return { ...prev, [group]: rows };
    });
  };

  const submitTx = async (e) => {
    e.preventDefault();
    if (!txForm.category || !txForm.amount) return;
    const payload = {
      user_id: session.user.id,
      date: txForm.date || null,
      type: txForm.type,
      category: txForm.category,
      amount: Number(txForm.amount),
      comment: txForm.comment,
    };
    const { data: inserted, error } = await supabase.from("transactions").insert(payload).select().single();
    if (!error && inserted) {
      setTransactions((prev) => [
        { id: inserted.id, date: inserted.date, type: inserted.type, category: inserted.category, amount: inserted.amount, comment: inserted.comment },
        ...prev,
      ]);
      setTxForm({ date: "", type: "Dépenses", category: "", amount: "", comment: "" });
    }
  };

  const deleteTx = async (id) => {
    setTransactions((prev) => prev.filter((x) => x.id !== id));
    await supabase.from("transactions").delete().eq("id", id);
  };

  const signOut = () => supabase.auth.signOut();

  const updateAvatar = async (base64) => {
    const { data: updated, error } = await supabase.auth.updateUser({ data: { avatar_url: base64 } });
    if (!error && updated?.user) setSession((prev) => ({ ...prev, user: updated.user }));
  };

  const allCategoryNames = useMemo(() => {
    const group = data[txForm.type] || [];
    return group.map((r) => r.name);
  }, [data, txForm.type]);

  if (!authChecked) return null;
  if (!session) return <Auth />;

  return (
    <ThemeContext.Provider value={{ colors, theme, setTheme }}>
      <div className="w-full min-h-screen" style={{ background: colors.ink, color: colors.text, fontFamily: "'Inter', sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
          .num { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
          .disp { font-family: 'Fraunces', serif; }
          input[type=number]::-webkit-inner-spin-button { opacity: 0; }
          ::-webkit-scrollbar { height: 6px; width: 6px; }
          ::-webkit-scrollbar-thumb { background: ${colors.surface3}; border-radius: 4px; }
        `}</style>

        {/* Header */}
        <div className="px-5 sm:px-8 pt-6 pb-4 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: `1px solid ${colors.line}` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: colors.gold }}>
              <Wallet size={18} color={colors.ink} strokeWidth={2.25} />
            </div>
            <span className="disp text-xl" style={{ color: colors.text }}>Mon Budget</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs uppercase tracking-wide" style={{ color: colors.textDim }}>Mois</span>
              <div className="relative">
                <select
                  value={monthIdx}
                  onChange={(e) => setMonthIdx(Number(e.target.value))}
                  className="appearance-none pl-3 pr-8 py-1.5 rounded-md text-sm font-medium cursor-pointer"
                  style={{ background: colors.surface2, color: colors.text, border: `1px solid ${colors.line}` }}
                >
                  <option value={-1}>Année 2026 (tous les mois)</option>
                  {MONTHS_FULL.map((m, i) => <option key={m} value={i}>{m} 2026</option>)}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: colors.textDim }} />
              </div>
            </div>
            <ProfileMenu session={session} onSignOut={signOut} onAvatarChange={updateAvatar} />
          </div>
        </div>

        {/* Hero solde */}
        <div className="px-5 sm:px-8 py-6">
          <div className="text-xs uppercase tracking-widest mb-1.5" style={{ color: colors.textDim }}>Solde net — {monthIdx === -1 ? "Année 2026" : `${MONTHS_FULL[monthIdx]} 2026`}</div>
          <div className="disp num flex items-baseline gap-3 flex-wrap">
            <span style={{ fontSize: "clamp(2.2rem, 6vw, 3.2rem)", color: totals.solde >= 0 ? colors.mint : colors.coral, lineHeight: 1 }}>
              {fmt(totals.solde)}
            </span>
          </div>
          <div className="flex gap-5 mt-4 flex-wrap">
            <StatPill icon={<TrendingUp size={14} />} label="Revenus" value={fmt(totals.revenus)} color={colors.mint} />
            <StatPill icon={<TrendingDown size={14} />} label="Dépenses" value={fmt(totals.depenses)} color={colors.coral} />
            <StatPill icon={<PiggyBank size={14} />} label="Épargne" value={fmt(totals.epargne)} color={colors.gold} />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 sm:px-8 flex gap-1 sticky top-0 z-10 overflow-x-auto" style={{ background: colors.ink, borderBottom: `1px solid ${colors.line}` }}>
          <TabBtn active={tab === "dashboard"} onClick={() => setTab("dashboard")} icon={<LayoutDashboard size={15} />} label="Tableau de bord" />
          <TabBtn active={tab === "transactions"} onClick={() => setTab("transactions")} icon={<ListPlus size={15} />} label="Transactions" />
          <TabBtn active={tab === "budget"} onClick={() => setTab("budget")} icon={<Table2 size={15} />} label="Budget" />
          <TabBtn active={tab === "suivi"} onClick={() => setTab("suivi")} icon={<Scale size={15} />} label="Suivi réel" />
        </div>

        <div className="px-5 sm:px-8 py-6">
          {tab === "dashboard" && <Dashboard pieData={pieData} barData={barData} lineData={lineData} data={data} monthIdx={monthIdx} totals={totals} />}
          {tab === "transactions" && (
            <TransactionsTab
              txForm={txForm} setTxForm={setTxForm} submitTx={submitTx}
              transactions={transactions} onDeleteTx={deleteTx}
              categories={allCategoryNames} groups={TX_GROUPS}
            />
          )}
          {tab === "budget" && (
            <BudgetTab data={data} updateCell={updateCell} addRow={addRow} removeRow={removeRow} renameRow={renameRow} moveRow={moveRow} />
          )}
          {tab === "suivi" && (
            <SuiviReelTab data={data} transactions={transactions} monthIdx={monthIdx} />
          )}
        </div>
      </div>
      {!onboardingSeen && <Onboarding onClose={() => { setOnboardingSeen(true); try { localStorage.setItem("budget-onboarding-seen", "1"); } catch (e) {} }} />}
    </ThemeContext.Provider>
  );
}

function ProfileMenu({ session, onSignOut, onAvatarChange }) {
  const { colors, theme, setTheme } = useContext(ThemeContext);
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  const email = session?.user?.email || "";
  const avatarUrl = session?.user?.user_metadata?.avatar_url;
  const displayName = session?.user?.user_metadata?.full_name || email;

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await resizeImageToBase64(file, 128);
    await onAvatarChange(base64);
    setOpen(false);
  };

  const sendReset = async () => {
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setResetSent(true);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={displayName}
        className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0"
        style={{ background: colors.surface2, border: `1px solid ${colors.line}` }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
        ) : (
          <User size={16} color={colors.textDim} />
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg z-20 overflow-hidden"
          style={{ background: colors.surface, border: `1px solid ${colors.line}` }}
        >
          <div className="px-3.5 py-3" style={{ borderBottom: `1px solid ${colors.line}` }}>
            <div className="text-sm font-medium truncate" style={{ color: colors.text }}>{displayName}</div>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <MenuItem icon={<Camera size={14} />} label="Changer la photo" onClick={() => fileInputRef.current?.click()} colors={colors} />

          <div className="px-3.5 py-2.5 flex items-center justify-between" style={{ borderTop: `1px solid ${colors.line}`, borderBottom: `1px solid ${colors.line}` }}>
            <span className="text-sm flex items-center gap-2" style={{ color: colors.text }}>
              {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />} Thème
            </span>
            <div className="flex rounded-md overflow-hidden" style={{ border: `1px solid ${colors.line}` }}>
              <button
                onClick={() => setTheme("light")}
                className="px-2 py-1 text-xs"
                style={{ background: theme === "light" ? colors.gold : "transparent", color: theme === "light" ? colors.ink : colors.textDim }}
              >Clair</button>
              <button
                onClick={() => setTheme("dark")}
                className="px-2 py-1 text-xs"
                style={{ background: theme === "dark" ? colors.gold : "transparent", color: theme === "dark" ? colors.ink : colors.textDim }}
              >Sombre</button>
            </div>
          </div>

          <MenuItem icon={<Settings size={14} />} label="Paramètres du compte" onClick={() => { setShowSettings(true); setOpen(false); }} colors={colors} />
          <MenuItem icon={<LogOut size={14} />} label="Déconnexion" onClick={onSignOut} colors={colors} danger />
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-30 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-xl p-5" style={{ background: colors.surface, border: `1px solid ${colors.line}` }}>
            <div className="flex items-center justify-between mb-4">
              <span className="disp text-lg" style={{ color: colors.text }}>Paramètres du compte</span>
              <button onClick={() => setShowSettings(false)} style={{ color: colors.textDim }}><X size={18} /></button>
            </div>
            <div className="text-xs mb-1" style={{ color: colors.textDim }}>Email</div>
            <div className="text-sm mb-4" style={{ color: colors.text }}>{email}</div>
            <button
              onClick={sendReset}
              className="w-full py-2.5 rounded-md text-sm font-semibold"
              style={{ background: colors.gold, color: colors.ink }}
            >
              Envoyer un lien de réinitialisation du mot de passe
            </button>
            {resetSent && <div className="text-xs mt-2" style={{ color: colors.mint }}>Email envoyé — vérifie ta boîte de réception.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, colors, danger }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left"
      style={{ color: danger ? colors.coral : colors.text }}
    >
      {icon}{label}
    </button>
  );
}

function StatPill({ icon, label, value, color }) {
  const { colors } = useContext(ThemeContext);
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: color + "22", color }}>{icon}</div>
      <div>
        <div className="text-[10px] uppercase tracking-wide" style={{ color: colors.textDim }}>{label}</div>
        <div className="num text-sm font-semibold" style={{ color: colors.text }}>{value}</div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }) {
  const { colors } = useContext(ThemeContext);
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium transition-colors"
      style={{
        color: active ? colors.gold : colors.textDim,
        borderBottom: active ? `2px solid ${colors.gold}` : "2px solid transparent",
      }}
    >
      {icon}{label}
    </button>
  );
}

function Card({ title, children, className = "" }) {
  const { colors } = useContext(ThemeContext);
  return (
    <div className={`rounded-xl p-4 sm:p-5 ${className}`} style={{ background: colors.surface, border: `1px solid ${colors.line}` }}>
      <div className="text-xs uppercase tracking-widest mb-3" style={{ color: colors.textDim }}>{title}</div>
      {children}
    </div>
  );
}

function Dashboard({ pieData, barData, lineData, data, monthIdx, totals }) {
  const { colors } = useContext(ThemeContext);
  const tooltipStyle = { background: colors.surface2, border: `1px solid ${colors.line}`, borderRadius: 8, fontSize: 12, color: colors.text };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card title="Répartition des dépenses du mois">
        {pieData.length === 0 ? (
          <EmptyState text="Aucune dépense ce mois-ci." />
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
          {pieData.map((d, i) => (
            <div key={d.name} className="flex items-center gap-1.5 text-xs" style={{ color: colors.textDim }}>
              <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
              {d.name}
            </div>
          ))}
        </div>
      </Card>

      <Card title="Revenus vs dépenses (12 mois)">
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={barData}>
            <CartesianGrid stroke={colors.line} vertical={false} />
            <XAxis dataKey="mois" stroke={colors.textDim} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={colors.textDim} fontSize={10} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip formatter={(v) => fmt(v)} contentStyle={tooltipStyle} />
            <Bar dataKey="Revenus" fill={colors.mint} radius={[3, 3, 0, 0]} />
            <Bar dataKey="Dépenses" fill={colors.coral} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <ObjectifMoisCard data={data} monthIdx={monthIdx} totals={totals} />
      <ObjectifAnneeCard data={data} monthIdx={monthIdx} />

      <Card title="Évolution du solde cumulé" className="lg:col-span-2">
        <ResponsiveContainer width="100%" height={210}>
          <LineChart data={lineData}>
            <CartesianGrid stroke={colors.line} vertical={false} />
            <XAxis dataKey="mois" stroke={colors.textDim} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={colors.textDim} fontSize={10} tickLine={false} axisLine={false} width={45} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip formatter={(v) => fmt(v)} contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="Solde" stroke={colors.gold} strokeWidth={2.5} dot={{ r: 3, fill: colors.gold }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function ObjectifMoisCard({ data, monthIdx, totals }) {
  const { colors } = useContext(ThemeContext);
  const objectifRows = data.Objectifs || [];
  const objectifMois = valAt(objectifRows, monthIdx);
  const epargneMois = totals.epargne;

  if (objectifMois === 0) {
    return (
      <Card title="Objectif du mois">
        <EmptyState text="Ajoute un objectif dans l'onglet Budget pour suivre ta progression." />
      </Card>
    );
  }

  const pct = (epargneMois / objectifMois) * 100;
  const atteint = Math.min(epargneMois, objectifMois);
  const restantPart = Math.max(objectifMois - epargneMois, 0);
  const pieSlices = [
    { name: "Atteint", value: atteint },
    { name: "Restant", value: restantPart || 0.0001 },
  ];
  const manqueEpargne = Math.max(objectifMois - epargneMois, 0);
  const disponible = totals.solde - manqueEpargne;

  return (
    <Card title="Objectif du mois">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieSlices} dataKey="value" innerRadius={42} outerRadius={58} startAngle={90} endAngle={-270} stroke="none">
                <Cell fill={pct >= 100 ? colors.mint : colors.gold} />
                <Cell fill={colors.surface3} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="num text-lg font-semibold" style={{ color: colors.text }}>{Math.round(pct)}%</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 text-xs" style={{ color: colors.textDim }}>
          <div>Objectif : <span className="num font-medium" style={{ color: colors.text }}>{fmt(objectifMois)}</span></div>
          <div>Épargné ce mois-ci : <span className="num font-medium" style={{ color: colors.text }}>{fmt(epargneMois)}</span></div>
        </div>
      </div>
      <div className="mt-4 pt-3 text-sm" style={{ borderTop: `1px solid ${colors.line}` }}>
        {disponible >= 0 ? (
          <span style={{ color: colors.text }}>
            Tu peux encore dépenser <span className="num font-semibold" style={{ color: colors.mint }}>{fmt(disponible)}</span> ce mois-ci tout en atteignant ton objectif d'épargne.
          </span>
        ) : (
          <span style={{ color: colors.text }}>
            Tu as déjà dépassé de <span className="num font-semibold" style={{ color: colors.coral }}>{fmt(Math.abs(disponible))}</span> ce que tu peux dépenser pour atteindre ton objectif ce mois-ci.
          </span>
        )}
      </div>
    </Card>
  );
}

function ObjectifAnneeCard({ data, monthIdx }) {
  const { colors } = useContext(ThemeContext);
  const objectifRows = data.Objectifs || [];
  const epargneRows = data.Épargne || [];

  const evolution = useMemo(() => {
    let cumulSaved = 0, cumulObjectif = 0;
    return MONTHS.map((m, i) => {
      cumulSaved += sumGroupMonth(epargneRows, i);
      cumulObjectif += sumGroupMonth(objectifRows, i);
      const pct = cumulObjectif > 0 ? (cumulSaved / cumulObjectif) * 100 : 0;
      return { mois: m, Progression: Math.round(pct * 10) / 10, cumulSaved, cumulObjectif };
    });
  }, [data]);

  const current = monthIdx === -1 ? evolution[11] : evolution[monthIdx];
  const cumulObjectifTotal = sumGroupTotal(objectifRows);

  const [selected, setSelected] = useState(() => {
    return [...objectifRows]
      .map((r, i) => ({ ...r, idx: i }))
      .sort((a, b) => sumRow(b) - sumRow(a))
      .slice(0, 3)
      .map((r) => r.name);
  });

  const toggleSelect = (name) => {
    setSelected((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (prev.length >= 3) return prev;
      return [...prev, name];
    });
  };

  let statusSet, diff;
  if (cumulObjectifTotal === 0 && current) {
    statusSet = null; diff = 0;
  } else {
    diff = current ? current.cumulSaved - current.cumulObjectif : 0;
  }
  const variantIdx = monthIdx % 5;
  let status = null;
  if (statusSet !== null && current) {
    if (Math.abs(diff) < 1) status = RESPECTE[variantIdx];
    else if (diff < 0) status = RATTRAPER[variantIdx];
    else status = DEPASSE[variantIdx];
  }

  const showMini = objectifRows.length >= 2;
  const miniLabels = objectifRows.length > 3 ? selected : objectifRows.map((r) => r.name);

  return (
    <Card title="Objectif de l'année">
      {cumulObjectifTotal === 0 ? (
        <EmptyState text="Ajoute un objectif dans l'onglet Budget pour suivre ta progression annuelle." />
      ) : (
        <>
          {status && (
            <div className="mb-3 p-3 rounded-lg" style={{ background: colors.surface2 }}>
              <div className="text-sm font-semibold mb-0.5" style={{ color: colors.text }}>{status.title}</div>
              <div className="text-xs" style={{ color: colors.textDim }}>{status.message(Math.abs(diff))}</div>
            </div>
          )}
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={evolution}>
              <CartesianGrid stroke={colors.line} vertical={false} />
              <XAxis dataKey="mois" stroke={colors.textDim} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={colors.textDim} fontSize={10} tickLine={false} axisLine={false} width={38} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: colors.surface2, border: `1px solid ${colors.line}`, borderRadius: 8, fontSize: 12, color: colors.text }} />
              <Line type="monotone" dataKey="Progression" stroke={colors.gold} strokeWidth={2.5} dot={{ r: 3, fill: colors.gold }} />
            </LineChart>
          </ResponsiveContainer>

          {showMini && (
            <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${colors.line}` }}>
              {objectifRows.length > 3 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {objectifRows.map((r) => (
                    <button
                      key={r.name}
                      onClick={() => toggleSelect(r.name)}
                      className="text-[11px] px-2 py-1 rounded-full"
                      style={{
                        background: selected.includes(r.name) ? colors.gold : colors.surface2,
                        color: selected.includes(r.name) ? colors.ink : colors.textDim,
                        border: `1px solid ${colors.line}`,
                      }}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {objectifRows.filter((r) => miniLabels.includes(r.name)).slice(0, 3).map((row) => {
                  let c = 0;
                  const rowEvo = row.values.map((v, i) => { c += v; return { mois: MONTHS[i], val: c }; });
                  return (
                    <div key={row.name}>
                      <div className="text-[11px] mb-1 truncate" style={{ color: colors.textDim }}>{row.name}</div>
                      <ResponsiveContainer width="100%" height={70}>
                        <LineChart data={rowEvo}>
                          <Line type="monotone" dataKey="val" stroke={colors.mint} strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function EmptyState({ text }) {
  const { colors } = useContext(ThemeContext);
  return <div className="text-sm py-10 text-center" style={{ color: colors.textDim }}>{text}</div>;
}

function TransactionsTab({ txForm, setTxForm, submitTx, transactions, onDeleteTx, categories, groups }) {
  const { colors } = useContext(ThemeContext);
  const inputStyle = { background: colors.surface2, border: `1px solid ${colors.line}`, borderRadius: 6, padding: "7px 10px", color: colors.text, fontSize: 13.5, outline: "none" };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 items-start">
      <Card title="Ajouter une transaction">
        <form onSubmit={submitTx} className="flex flex-col gap-3">
          <Field label="Date"><input type="date" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} className="w-full" style={inputStyle} /></Field>
          <Field label="Type">
            <select value={txForm.type} onChange={(e) => setTxForm({ ...txForm, type: e.target.value, category: "" })} className="w-full" style={inputStyle}>
              {groups.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Catégorie">
            <select value={txForm.category} onChange={(e) => setTxForm({ ...txForm, category: e.target.value })} className="w-full" style={inputStyle}>
              <option value="">Choisir…</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Montant (F CFA)"><input type="number" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} placeholder="0" className="w-full num" style={inputStyle} /></Field>
          <Field label="Commentaire"><input type="text" value={txForm.comment} onChange={(e) => setTxForm({ ...txForm, comment: e.target.value })} placeholder="Optionnel" className="w-full" style={inputStyle} /></Field>
          <button type="submit" className="mt-1.5 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-sm font-semibold" style={{ background: colors.gold, color: colors.ink }}>
            <Plus size={15} /> Ajouter
          </button>
        </form>
      </Card>

      <Card title={`Historique (${transactions.length})`}>
        {transactions.length === 0 ? (
          <EmptyState text="Aucune transaction enregistrée pour l'instant." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: colors.textDim }} className="text-left text-xs uppercase tracking-wide">
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 pr-3 font-medium">Catégorie</th>
                  <th className="py-2 pr-3 font-medium">Commentaire</th>
                  <th className="py-2 pr-3 font-medium text-right">Montant</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} style={{ borderTop: `1px solid ${colors.line}` }}>
                    <td className="py-2 pr-3 num" style={{ color: colors.textDim }}>{t.date || "—"}</td>
                    <td className="py-2 pr-3">{t.type}</td>
                    <td className="py-2 pr-3">{t.category}</td>
                    <td className="py-2 pr-3" style={{ color: colors.textDim }}>{t.comment || "—"}</td>
                    <td className="py-2 pr-3 num text-right font-medium">{fmt(t.amount)}</td>
                    <td className="py-2 text-right">
                      <button onClick={() => onDeleteTx(t.id)} style={{ color: colors.textDim }}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Field({ label, children }) {
  const { colors } = useContext(ThemeContext);
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: colors.textDim }}>{label}</span>
      {children}
    </label>
  );
}

function MonthCell({ value, onChange }) {
  const { colors } = useContext(ThemeContext);
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value || "");
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [editing]);

  const commit = () => {
    onChange(temp);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={temp}
        onChange={(e) => setTemp(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setTemp(value || ""); setEditing(false); }
        }}
        className="w-full num text-right text-xs py-1 px-1.5 rounded"
        style={{ background: colors.surface2, border: `1px solid ${colors.gold}`, color: colors.text, outline: "none" }}
      />
    );
  }

  return (
    <div
      onDoubleClick={() => { setTemp(value || ""); setEditing(true); }}
      title="Double-clic pour modifier"
      className="w-full num text-right text-xs py-1 px-1.5 rounded cursor-default select-none"
      style={{ background: colors.surface2, border: `1px solid ${colors.line}`, color: value ? colors.text : colors.textDim }}
    >
      {value ? fmt(value).replace(" F", "") : "0"}
    </div>
  );
}

function BudgetTab({ data, updateCell, addRow, removeRow, renameRow, moveRow }) {
  const { colors } = useContext(ThemeContext);
  return (
    <div className="flex flex-col gap-5">
      {Object.entries(data).map(([group, rows]) => (
        <Card key={group} title={group}>
          <div className="overflow-x-auto">
            <table className="text-sm border-separate" style={{ borderSpacing: 0, minWidth: 950 }}>
              <thead>
                <tr>
                  <th style={{ width: 46 }}></th>
                  <th className="text-left py-1.5 pr-3 sticky left-0 font-medium text-xs uppercase tracking-wide" style={{ color: colors.textDim, background: colors.surface, minWidth: 160 }}>Libellé</th>
                  {MONTHS.map((m) => (
                    <th key={m} className="text-right py-1.5 px-2 font-medium text-xs" style={{ color: colors.textDim, minWidth: 78 }}>{m}</th>
                  ))}
                  <th className="text-right py-1.5 pl-2 font-medium text-xs" style={{ color: colors.gold, minWidth: 90 }}>Total</th>
                  <th style={{ width: 28 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri}>
                    <td className="py-1">
                      <div className="flex flex-col items-center">
                        <button onClick={() => moveRow(group, ri, -1)} disabled={ri === 0} style={{ color: ri === 0 ? colors.line : colors.textDim, opacity: ri === 0 ? 0.4 : 1 }}>
                          <ChevronUp size={13} />
                        </button>
                        <button onClick={() => moveRow(group, ri, 1)} disabled={ri === rows.length - 1} style={{ color: ri === rows.length - 1 ? colors.line : colors.textDim, opacity: ri === rows.length - 1 ? 0.4 : 1 }}>
                          <ChevronDown size={13} />
                        </button>
                      </div>
                    </td>
                    <td className="py-1 pr-3 sticky left-0" style={{ background: colors.surface }}>
                      <input
                        value={row.name}
                        onChange={(e) => renameRow(group, ri, e.target.value)}
                        className="w-full bg-transparent text-sm font-medium"
                        style={{ color: colors.text, border: "none", outline: "none" }}
                      />
                    </td>
                    {row.values.map((v, mi) => (
                      <td key={mi} className="py-1 px-1">
                        <MonthCell value={v} onChange={(newVal) => updateCell(group, ri, mi, newVal)} />
                      </td>
                    ))}
                    <td className="py-1 pl-2 num text-right text-xs font-semibold" style={{ color: colors.gold }}>{fmt(sumRow(row))}</td>
                    <td className="text-center">
                      <button onClick={() => removeRow(group, ri)} style={{ color: colors.textDim }}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: `1px solid ${colors.line}` }}>
                  <td></td>
                  <td className="py-1.5 pr-3 sticky left-0 text-xs font-semibold uppercase" style={{ color: colors.textDim, background: colors.surface }}>Total</td>
                  {MONTHS.map((_, mi) => (
                    <td key={mi} className="py-1.5 px-2 num text-right text-xs" style={{ color: colors.textDim }}>{fmt(sumGroupMonth(rows, mi))}</td>
                  ))}
                  <td className="py-1.5 pl-2 num text-right text-xs font-semibold" style={{ color: colors.gold }}>{fmt(sumGroupTotal(rows))}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
          <button onClick={() => addRow(group)} className="mt-3 flex items-center gap-1.5 text-xs font-medium" style={{ color: colors.gold }}>
            <Plus size={13} /> Ajouter un libellé
          </button>
        </Card>
      ))}
    </div>
  );
}

function reelForLabel(transactions, group, label, monthIdx) {
  return transactions
    .filter((t) => {
      if (t.type !== group || t.category !== label || !t.date) return false;
      const d = new Date(t.date);
      if (Number.isNaN(d.getTime())) return false;
      return monthIdx === -1 ? true : d.getMonth() === monthIdx;
    })
    .reduce((a, t) => a + (Number(t.amount) || 0), 0);
}

const SUIVI_GROUPS = ["Revenus", "Dépenses", "Factures", "Crédits", "Épargne"];

function SuiviReelTab({ data, transactions, monthIdx }) {
  const { colors } = useContext(ThemeContext);
  const periodLabel = monthIdx === -1 ? "sur l'année 2026" : `pour ${["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"][monthIdx]} 2026`;

  return (
    <div className="flex flex-col gap-5">
      <div className="text-xs" style={{ color: colors.textDim }}>
        Comparaison entre ce que tu avais prévu (Estimé) et ce que tes transactions montrent réellement (Réel), {periodLabel}.
      </div>
      {SUIVI_GROUPS.map((group) => {
        const rows = data[group] || [];
        const favorableWhenHigher = group === "Revenus" || group === "Épargne";
        return (
          <Card key={group} title={group}>
            <div className="flex flex-col gap-3">
              {rows.map((row) => {
                const estime = valAt([row], monthIdx);
                const reel = reelForLabel(transactions, group, row.name, monthIdx);
                const ecart = reel - estime;
                const isEqual = Math.abs(ecart) < 1;
                const isFavorable = favorableWhenHigher ? ecart >= 0 : ecart <= 0;
                const statusColor = isEqual ? colors.textDim : isFavorable ? colors.mint : colors.coral;
                const StatusIcon = isEqual ? Minus : isFavorable ? CheckCircle2 : AlertTriangle;
                const maxVal = Math.max(estime, reel, 1);
                return (
                  <div key={row.name} className="pb-3" style={{ borderBottom: `1px solid ${colors.line}` }}>
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="text-sm font-medium truncate" style={{ color: colors.text }}>{row.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StatusIcon size={13} color={statusColor} />
                        <span className="num text-xs font-semibold" style={{ color: statusColor }}>
                          {isEqual ? "= " : ecart > 0 ? "+" : ""}{fmt(ecart)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] w-10 shrink-0" style={{ color: colors.textDim }}>Estimé</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: colors.surface2 }}>
                          <div className="h-full rounded-full" style={{ width: `${(estime / maxVal) * 100}%`, background: colors.textDim }} />
                        </div>
                        <span className="num text-[11px] w-20 text-right shrink-0" style={{ color: colors.textDim }}>{fmt(estime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] w-10 shrink-0" style={{ color: colors.textDim }}>Réel</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: colors.surface2 }}>
                          <div className="h-full rounded-full" style={{ width: `${(reel / maxVal) * 100}%`, background: statusColor }} />
                        </div>
                        <span className="num text-[11px] w-20 text-right shrink-0" style={{ color: colors.text }}>{fmt(reel)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {rows.length === 0 && <EmptyState text="Aucun libellé dans ce volet." />}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

const SLIDES = [
  { title: "Bienvenue sur Mon Budget 👋", text: "Une application pensée pour suivre tes revenus, tes dépenses et ton épargne, avec tes propres chiffres — tout est vide au départ, à toi de le remplir." },
  { title: "1. L'onglet Budget", text: "Prévois tes montants pour chaque mois : Revenus, Dépenses, Factures, Crédits, Épargne et Objectifs. Double-clique sur une case pour la modifier." },
  { title: "2. L'onglet Transactions", text: "Enregistre au jour le jour ce que tu gagnes ou dépenses réellement. C'est ce qui alimente automatiquement l'onglet Suivi réel." },
  { title: "3. L'onglet Suivi réel", text: "Compare ce que tu avais prévu (Estimé) à ce qui s'est vraiment passé (Réel), libellé par libellé." },
  { title: "4. Le Tableau de bord", text: "Retrouve tes graphiques, ta progression vers tes objectifs d'épargne, et ton solde net — ils se remplissent au fur et à mesure que tu utilises l'application." },
];

function Onboarding({ onClose }) {
  const { colors } = useContext(ThemeContext);
  const [step, setStep] = useState(0);
  const isLast = step === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-5" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: colors.surface, border: `1px solid ${colors.line}` }}>
        <div className="flex items-center gap-2 mb-4" style={{ color: colors.gold }}>
          <PlayCircle size={18} />
          <span className="text-xs uppercase tracking-widest">Visite guidée</span>
        </div>
        <div className="disp text-xl mb-2" style={{ color: colors.text }}>{SLIDES[step].title}</div>
        <div className="text-sm leading-relaxed mb-6" style={{ color: colors.textDim }}>{SLIDES[step].text}</div>

        <div className="flex items-center justify-center gap-1.5 mb-5">
          {SLIDES.map((_, i) => (
            <span key={i} className="rounded-full" style={{ width: i === step ? 16 : 6, height: 6, background: i === step ? colors.gold : colors.surface3, transition: "width 0.2s" }} />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button onClick={onClose} className="text-xs" style={{ color: colors.textDim }}>Passer</button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)} className="flex items-center gap-1 px-3 py-2 rounded-md text-sm" style={{ color: colors.text, border: `1px solid ${colors.line}` }}>
                <ChevronLeft size={14} /> Précédent
              </button>
            )}
            <button
              onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}
              className="flex items-center gap-1 px-4 py-2 rounded-md text-sm font-semibold"
              style={{ background: colors.gold, color: colors.ink }}
            >
              {isLast ? "Commencer" : "Suivant"} {!isLast && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
