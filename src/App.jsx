import React, { useState, useEffect, useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, LineChart, Line, CartesianGrid,
} from "recharts";
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank, Plus, LayoutDashboard,
  ListPlus, Table2, Trash2, ChevronDown, LogOut,
} from "lucide-react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";

const GROUPS = ["Revenus", "Dépenses", "Factures", "Crédits", "Épargne"];

const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const MONTHS_FULL = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const COLORS = {
  ink: "#0E211D",
  surface: "#15332C",
  surface2: "#1C4038",
  surface3: "#234A41",
  gold: "#C99A44",
  goldSoft: "#E4C98A",
  mint: "#6FCF97",
  coral: "#E2725B",
  text: "#EFEAE0",
  textDim: "#9DB3AC",
  line: "#2A5148",
};

const PIE_COLORS = ["#C99A44", "#6FCF97", "#5FA8D3", "#E2725B", "#8B6FCF", "#D3935F"];

const defaultData = () => ({
  Revenus: [
    { name: "Salaire net", values: Array(12).fill(250000) },
    { name: "Extras", values: Array(12).fill(50000) },
    { name: "Revenus lucratifs", values: [15000,0,10000,0,0,0,0,0,14000,0,0,0] },
  ],
  Dépenses: [
    { name: "Loyer", values: Array(12).fill(60000) },
    { name: "Courses", values: Array(12).fill(45000) },
    { name: "Enfant", values: [0,0,0,0,50000,0,0,20000,50000,0,0,0] },
    { name: "Carburant", values: Array(12).fill(25000) },
    { name: "Shopping", values: Array(12).fill(15000) },
    { name: "Restaurant", values: Array(12).fill(12000) },
    { name: "Imprévus", values: Array(12).fill(8000) },
  ],
  Factures: [
    { name: "Électricité (CIE)", values: Array(12).fill(35000) },
    { name: "Eau (SODECI)", values: Array(12).fill(9000) },
    { name: "Wifi", values: Array(12).fill(25000) },
    { name: "Netflix", values: Array(12).fill(5000) },
  ],
  Crédits: [
    { name: "Prêt au travail", values: Array(12).fill(20000) },
    { name: "Voiture", values: Array(12).fill(50000) },
  ],
  Épargne: [
    { name: "Voyages", values: Array(12).fill(30000) },
    { name: "Projets", values: Array(12).fill(20000) },
    { name: "Urgence", values: Array(12).fill(15000) },
  ],
});

const fmt = (n) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n || 0) + " F";

function sumRow(row) { return row.values.reduce((a, b) => a + (Number(b) || 0), 0); }
function sumGroupMonth(group, mIdx) { return group.reduce((a, r) => a + (Number(r.values[mIdx]) || 0), 0); }
function sumGroupTotal(group) { return group.reduce((a, r) => a + sumRow(r), 0); }

export default function BudgetApp() {
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [data, setData] = useState(defaultData());
  const [transactions, setTransactions] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [monthIdx, setMonthIdx] = useState(new Date().getMonth());
  const [loaded, setLoaded] = useState(false);
  const [txForm, setTxForm] = useState({ date: "", type: "Dépenses", category: "", amount: "", comment: "" });

  // Suivre la session de connexion
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

  // Charger les données depuis Supabase une fois connecté
  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data: rows, error: e1 } = await supabase.from("budget_items").select("*");
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
        // Premier login : on initialise la base avec les données de départ
        const initial = defaultData();
        setData(initial);
        const toInsert = [];
        GROUPS.forEach((g) => initial[g].forEach((row) => {
          toInsert.push({ user_id: session.user.id, group_name: g, item_name: row.name, values_by_month: row.values });
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

  // Resynchroniser l'intégralité des postes budgétaires vers Supabase à chaque changement
  useEffect(() => {
    if (!loaded || !session) return;
    const timeout = setTimeout(async () => {
      await supabase.from("budget_items").delete().eq("user_id", session.user.id);
      const toInsert = [];
      GROUPS.forEach((g) => (data[g] || []).forEach((row) => {
        toInsert.push({ user_id: session.user.id, group_name: g, item_name: row.name, values_by_month: row.values });
      }));
      if (toInsert.length > 0) await supabase.from("budget_items").insert(toInsert);
    }, 800);
    return () => clearTimeout(timeout);
  }, [data, loaded, session]);

  if (!authChecked) return null;
  if (!session) return <Auth />;

  const totals = useMemo(() => {
    const revenus = sumGroupMonth(data.Revenus, monthIdx);
    const depenses = sumGroupMonth(data.Dépenses, monthIdx) + sumGroupMonth(data.Factures, monthIdx) + sumGroupMonth(data.Crédits, monthIdx);
    const epargne = sumGroupMonth(data.Épargne, monthIdx);
    return { revenus, depenses, epargne, solde: revenus - depenses - epargne };
  }, [data, monthIdx]);

  const pieData = useMemo(() => {
    const rows = [...data.Dépenses, ...data.Factures, ...data.Crédits];
    return rows
      .map((r) => ({ name: r.name, value: r.values[monthIdx] || 0 }))
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
    setData((prev) => ({ ...prev, [group]: [...prev[group], { name: "Nouveau poste", values: Array(12).fill(0) }] }));
  };

  const removeRow = (group, idx) => {
    setData((prev) => ({ ...prev, [group]: prev[group].filter((_, i) => i !== idx) }));
  };

  const renameRow = (group, idx, name) => {
    setData((prev) => ({ ...prev, [group]: prev[group].map((r, i) => (i === idx ? { ...r, name } : r)) }));
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

  const allCategoryNames = useMemo(() => {
    const group = data[txForm.type] || [];
    return group.map((r) => r.name);
  }, [data, txForm.type]);

  return (
    <div className="w-full min-h-screen" style={{ background: COLORS.ink, color: COLORS.text, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .num { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        .disp { font-family: 'Fraunces', serif; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0; }
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.surface3}; border-radius: 4px; }
      `}</style>

      {/* Header */}
      <div className="px-5 sm:px-8 pt-6 pb-4 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: COLORS.gold }}>
            <Wallet size={18} color={COLORS.ink} strokeWidth={2.25} />
          </div>
          <span className="disp text-xl" style={{ color: COLORS.text }}>Mon Budget</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={signOut} className="flex items-center gap-1 text-xs" style={{ color: COLORS.textDim }}>
            <LogOut size={13} /> Déconnexion
          </button>
          <span className="text-xs uppercase tracking-wide" style={{ color: COLORS.textDim }}>Mois</span>
          <div className="relative">
            <select
              value={monthIdx}
              onChange={(e) => setMonthIdx(Number(e.target.value))}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-md text-sm font-medium cursor-pointer"
              style={{ background: COLORS.surface2, color: COLORS.text, border: `1px solid ${COLORS.line}` }}
            >
              {MONTHS_FULL.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: COLORS.textDim }} />
          </div>
        </div>
      </div>

      {/* Hero solde */}
      <div className="px-5 sm:px-8 py-6">
        <div className="text-xs uppercase tracking-widest mb-1.5" style={{ color: COLORS.textDim }}>Solde net — {MONTHS_FULL[monthIdx]}</div>
        <div className="disp num flex items-baseline gap-3 flex-wrap">
          <span style={{ fontSize: "clamp(2.2rem, 6vw, 3.2rem)", color: totals.solde >= 0 ? COLORS.mint : COLORS.coral, lineHeight: 1 }}>
            {fmt(totals.solde)}
          </span>
        </div>
        <div className="flex gap-5 mt-4 flex-wrap">
          <StatPill icon={<TrendingUp size={14} />} label="Revenus" value={fmt(totals.revenus)} color={COLORS.mint} />
          <StatPill icon={<TrendingDown size={14} />} label="Dépenses" value={fmt(totals.depenses)} color={COLORS.coral} />
          <StatPill icon={<PiggyBank size={14} />} label="Épargne" value={fmt(totals.epargne)} color={COLORS.gold} />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 sm:px-8 flex gap-1 sticky top-0 z-10" style={{ background: COLORS.ink, borderBottom: `1px solid ${COLORS.line}` }}>
        <TabBtn active={tab === "dashboard"} onClick={() => setTab("dashboard")} icon={<LayoutDashboard size={15} />} label="Tableau de bord" />
        <TabBtn active={tab === "transactions"} onClick={() => setTab("transactions")} icon={<ListPlus size={15} />} label="Transactions" />
        <TabBtn active={tab === "budget"} onClick={() => setTab("budget")} icon={<Table2 size={15} />} label="Budget" />
      </div>

      <div className="px-5 sm:px-8 py-6">
        {tab === "dashboard" && <Dashboard pieData={pieData} barData={barData} lineData={lineData} />}
        {tab === "transactions" && (
          <TransactionsTab
            txForm={txForm} setTxForm={setTxForm} submitTx={submitTx}
            transactions={transactions} onDeleteTx={deleteTx}
            categories={allCategoryNames} groups={Object.keys(data)}
          />
        )}
        {tab === "budget" && (
          <BudgetTab data={data} updateCell={updateCell} addRow={addRow} removeRow={removeRow} renameRow={renameRow} />
        )}
      </div>
    </div>
  );
}

function StatPill({ icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: color + "22", color }}>{icon}</div>
      <div>
        <div className="text-[10px] uppercase tracking-wide" style={{ color: COLORS.textDim }}>{label}</div>
        <div className="num text-sm font-semibold" style={{ color: COLORS.text }}>{value}</div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium transition-colors"
      style={{
        color: active ? COLORS.gold : COLORS.textDim,
        borderBottom: active ? `2px solid ${COLORS.gold}` : "2px solid transparent",
      }}
    >
      {icon}{label}
    </button>
  );
}

function Card({ title, children, className = "" }) {
  return (
    <div className={`rounded-xl p-4 sm:p-5 ${className}`} style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
      <div className="text-xs uppercase tracking-widest mb-3" style={{ color: COLORS.textDim }}>{title}</div>
      {children}
    </div>
  );
}

function Dashboard({ pieData, barData, lineData }) {
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
            <div key={d.name} className="flex items-center gap-1.5 text-xs" style={{ color: COLORS.textDim }}>
              <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
              {d.name}
            </div>
          ))}
        </div>
      </Card>

      <Card title="Revenus vs dépenses (12 mois)">
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={barData}>
            <CartesianGrid stroke={COLORS.line} vertical={false} />
            <XAxis dataKey="mois" stroke={COLORS.textDim} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={COLORS.textDim} fontSize={10} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip formatter={(v) => fmt(v)} contentStyle={tooltipStyle} />
            <Bar dataKey="Revenus" fill={COLORS.mint} radius={[3, 3, 0, 0]} />
            <Bar dataKey="Dépenses" fill={COLORS.coral} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Évolution du solde cumulé" className="lg:col-span-2">
        <ResponsiveContainer width="100%" height={210}>
          <LineChart data={lineData}>
            <CartesianGrid stroke={COLORS.line} vertical={false} />
            <XAxis dataKey="mois" stroke={COLORS.textDim} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={COLORS.textDim} fontSize={10} tickLine={false} axisLine={false} width={45} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip formatter={(v) => fmt(v)} contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="Solde" stroke={COLORS.gold} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.gold }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

const tooltipStyle = { background: COLORS.surface2, border: `1px solid ${COLORS.line}`, borderRadius: 8, fontSize: 12, color: COLORS.text };

function EmptyState({ text }) {
  return <div className="text-sm py-10 text-center" style={{ color: COLORS.textDim }}>{text}</div>;
}

function TransactionsTab({ txForm, setTxForm, submitTx, transactions, onDeleteTx, categories, groups }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 items-start">
      <Card title="Ajouter une transaction">
        <form onSubmit={submitTx} className="flex flex-col gap-3">
          <Field label="Date">
            <input type="date" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} className="w-full" style={inputStyle} />
          </Field>
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
          <Field label="Montant (F CFA)">
            <input type="number" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} placeholder="0" className="w-full num" style={inputStyle} />
          </Field>
          <Field label="Commentaire">
            <input type="text" value={txForm.comment} onChange={(e) => setTxForm({ ...txForm, comment: e.target.value })} placeholder="Optionnel" className="w-full" style={inputStyle} />
          </Field>
          <button type="submit" className="mt-1.5 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-sm font-semibold" style={{ background: COLORS.gold, color: COLORS.ink }}>
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
                <tr style={{ color: COLORS.textDim }} className="text-left text-xs uppercase tracking-wide">
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
                  <tr key={t.id} style={{ borderTop: `1px solid ${COLORS.line}` }}>
                    <td className="py-2 pr-3 num" style={{ color: COLORS.textDim }}>{t.date || "—"}</td>
                    <td className="py-2 pr-3">{t.type}</td>
                    <td className="py-2 pr-3">{t.category}</td>
                    <td className="py-2 pr-3" style={{ color: COLORS.textDim }}>{t.comment || "—"}</td>
                    <td className="py-2 pr-3 num text-right font-medium">{fmt(t.amount)}</td>
                    <td className="py-2 text-right">
                      <button onClick={() => onDeleteTx(t.id)} style={{ color: COLORS.textDim }}>
                        <Trash2 size={14} />
                      </button>
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
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: COLORS.textDim }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = { background: COLORS.surface2, border: `1px solid ${COLORS.line}`, borderRadius: 6, padding: "7px 10px", color: COLORS.text, fontSize: 13.5, outline: "none" };

function BudgetTab({ data, updateCell, addRow, removeRow, renameRow }) {
  return (
    <div className="flex flex-col gap-5">
      {Object.entries(data).map(([group, rows]) => (
        <Card key={group} title={group}>
          <div className="overflow-x-auto">
            <table className="text-sm border-separate" style={{ borderSpacing: 0, minWidth: 900 }}>
              <thead>
                <tr>
                  <th className="text-left py-1.5 pr-3 sticky left-0 font-medium text-xs uppercase tracking-wide" style={{ color: COLORS.textDim, background: COLORS.surface, minWidth: 160 }}>Poste</th>
                  {MONTHS.map((m) => (
                    <th key={m} className="text-right py-1.5 px-2 font-medium text-xs" style={{ color: COLORS.textDim, minWidth: 78 }}>{m}</th>
                  ))}
                  <th className="text-right py-1.5 pl-2 font-medium text-xs" style={{ color: COLORS.gold, minWidth: 90 }}>Total</th>
                  <th style={{ width: 28 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri}>
                    <td className="py-1 pr-3 sticky left-0" style={{ background: COLORS.surface }}>
                      <input
                        value={row.name}
                        onChange={(e) => renameRow(group, ri, e.target.value)}
                        className="w-full bg-transparent text-sm font-medium"
                        style={{ color: COLORS.text, border: "none", outline: "none" }}
                      />
                    </td>
                    {row.values.map((v, mi) => (
                      <td key={mi} className="py-1 px-1">
                        <input
                          type="number"
                          value={v || ""}
                          placeholder="0"
                          onChange={(e) => updateCell(group, ri, mi, e.target.value)}
                          className="w-full num text-right text-xs py-1 px-1.5 rounded"
                          style={{ background: COLORS.surface2, border: `1px solid ${COLORS.line}`, color: COLORS.text, outline: "none" }}
                        />
                      </td>
                    ))}
                    <td className="py-1 pl-2 num text-right text-xs font-semibold" style={{ color: COLORS.gold }}>{fmt(sumRow(row))}</td>
                    <td className="text-center">
                      <button onClick={() => removeRow(group, ri)} style={{ color: COLORS.textDim }}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: `1px solid ${COLORS.line}` }}>
                  <td className="py-1.5 pr-3 sticky left-0 text-xs font-semibold uppercase" style={{ color: COLORS.textDim, background: COLORS.surface }}>Total</td>
                  {MONTHS.map((_, mi) => (
                    <td key={mi} className="py-1.5 px-2 num text-right text-xs" style={{ color: COLORS.textDim }}>{fmt(sumGroupMonth(rows, mi))}</td>
                  ))}
                  <td className="py-1.5 pl-2 num text-right text-xs font-semibold" style={{ color: COLORS.gold }}>{fmt(sumGroupTotal(rows))}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
          <button onClick={() => addRow(group)} className="mt-3 flex items-center gap-1.5 text-xs font-medium" style={{ color: COLORS.gold }}>
            <Plus size={13} /> Ajouter un poste
          </button>
        </Card>
      ))}
    </div>
  );
}
