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
  Target, Lock, Mail, AlertOctagon, Sparkles, CircleCheck,
  Landmark, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Link2, Pencil,
} from "lucide-react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";

const GROUPS = ["Revenus", "Dépenses", "Factures", "Crédits", "Épargne", "Objectifs"];
const TX_GROUPS = GROUPS;
const SPLIT_GROUPS = ["Épargne", "Objectifs"];
const ACCOUNT_TRACE_TYPE = "Compte";
const FLIP_SIGN_GROUPS = ["Dépenses", "Factures"];
const ACCOUNT_TYPES = [
  { value: "mobile_money", label: "Mobile Money" },
  { value: "banque", label: "Compte bancaire" },
  { value: "liquide", label: "Liquide" },
  { value: "autre", label: "Autre" },
];
const ACCOUNT_TYPE_ICONS = { mobile_money: "📱", banque: "🏦", liquide: "💵", autre: "💼" };
const LOCK_OPTIONS = [
  { value: 5, label: "5 minutes" },
  { value: 10, label: "10 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 heure" },
  { value: 120, label: "2 heures" },
  { value: 240, label: "4 heures" },
];
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

const rawDefaultData = () => ({
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

function makeId() {
  return (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const defaultData = () => {
  const raw = rawDefaultData();
  const withIds = {};
  Object.keys(raw).forEach((g) => { withIds[g] = raw[g].map((row) => ({ ...row, id: makeId() })); });
  return withIds;
};

function valAt(rows, monthIdx) { return monthIdx === -1 ? sumGroupTotal(rows) : sumGroupMonth(rows, monthIdx); }

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

function sumRealGroup(transactions, group, rows, monthIdx) {
  return (rows || []).reduce((a, r) => a + reelForLabel(transactions, group, r.name, monthIdx), 0);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateFR(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}-${m}-${y}`;
}

function sortTransactions(list) {
  return [...list].sort((a, b) => {
    const dateCmp = (b.date || "").localeCompare(a.date || "");
    if (dateCmp !== 0) return dateCmp;
    return (b.created_at || "").localeCompare(a.created_at || "");
  });
}

function accountBalance(movements, accountId) {
  return movements.reduce((bal, m) => {
    if (m.account_id === accountId) {
      if (m.type === "depot") return bal + m.amount;
      if (m.type === "retrait") return bal - m.amount;
      if (m.type === "transfert") return bal - m.amount;
    }
    if (m.target_account_id === accountId && m.type === "transfert") return bal + m.amount;
    return bal;
  }, 0);
}

function sortMovements(list) {
  return [...list].sort((a, b) => {
    const dateCmp = (b.date || "").localeCompare(a.date || "");
    if (dateCmp !== 0) return dateCmp;
    return (b.created_at || "").localeCompare(a.created_at || "");
  });
}

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
  const [accounts, setAccounts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [monthIdx, setMonthIdx] = useState(new Date().getMonth());
  const [loaded, setLoaded] = useState(false);
  const [txForm, setTxForm] = useState({ date: todayStr(), type: "", category: "", amount: "", comment: "" });
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("budget-theme") || "dark"; } catch (e) { return "dark"; }
  });
  const [onboardingSeen, setOnboardingSeen] = useState(() => {
    try { return localStorage.getItem("budget-onboarding-seen") === "1"; } catch (e) { return false; }
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [lock, setLockState] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("budget-lock") || "null");
      return saved || { enabled: false, pin: "", timeout: 10 };
    } catch (e) { return { enabled: false, pin: "", timeout: 10 }; }
  });
  const [isLocked, setIsLocked] = useState(false);

  const setLock = (next) => {
    setLockState(next);
    try { localStorage.setItem("budget-lock", JSON.stringify(next)); } catch (e) {}
  };

  useEffect(() => {
    if (!lock.enabled) return;
    let lastActive = Date.now();
    const bump = () => { lastActive = Date.now(); };
    const events = ["mousemove", "keydown", "click", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, bump));
    const interval = setInterval(() => {
      if (Date.now() - lastActive > lock.timeout * 60 * 1000) setIsLocked(true);
    }, 5000);
    return () => { events.forEach((ev) => window.removeEventListener(ev, bump)); clearInterval(interval); };
  }, [lock.enabled, lock.timeout]);

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
      const { data: txRows, error: e2 } = await supabase.from("transactions").select("*").order("date", { ascending: false }).order("created_at", { ascending: false });

      if (!e1 && rows && rows.length > 0) {
        const rebuilt = {};
        GROUPS.forEach((g) => (rebuilt[g] = []));
        const seen = new Set();
        const duplicateIds = [];
        rows.forEach((r) => {
          if (!rebuilt[r.group_name]) rebuilt[r.group_name] = [];
          const key = `${r.group_name}::${r.item_name}`;
          if (seen.has(key)) { duplicateIds.push(r.id); return; }
          seen.add(key);
          rebuilt[r.group_name].push({ id: r.id, name: r.item_name, values: r.values_by_month });
        });
        setData(rebuilt);
        if (duplicateIds.length > 0) {
          await supabase.from("budget_items").delete().in("id", duplicateIds);
        }
      } else if (!e1) {
        const initial = defaultData();
        setData(initial);
        const toInsert = [];
        GROUPS.forEach((g) => initial[g].forEach((row, idx) => {
          toInsert.push({ id: row.id, user_id: session.user.id, group_name: g, item_name: row.name, values_by_month: row.values, position: idx });
        }));
        await supabase.from("budget_items").insert(toInsert);
      }

      if (!e2 && txRows) {
        setTransactions(sortTransactions(txRows.map((t) => ({
          id: t.id, date: t.date, type: t.type, category: t.category, amount: t.amount, comment: t.comment, created_at: t.created_at,
        }))));
      }

      const { data: accRows, error: e3 } = await supabase.from("accounts").select("*").order("created_at", { ascending: true });
      if (!e3 && accRows) setAccounts(accRows);

      const { data: movRows, error: e4 } = await supabase.from("account_movements").select("*").order("date", { ascending: false }).order("created_at", { ascending: false });
      if (!e4 && movRows) setMovements(sortMovements(movRows));

      setLoaded(true);
    })();
  }, [session]);

  useEffect(() => {
    if (!loaded || !session) return;
    const timeout = setTimeout(async () => {
      const toUpsert = [];
      GROUPS.forEach((g) => (data[g] || []).forEach((row, idx) => {
        toUpsert.push({ id: row.id, user_id: session.user.id, group_name: g, item_name: row.name, values_by_month: row.values, position: idx });
      }));
      if (toUpsert.length > 0) await supabase.from("budget_items").upsert(toUpsert, { onConflict: "id" });
    }, 800);
    return () => clearTimeout(timeout);
  }, [data, loaded, session]);

  const totals = useMemo(() => {
    const revenus = sumRealGroup(transactions, "Revenus", data.Revenus, monthIdx);
    const depenses = sumRealGroup(transactions, "Dépenses", data.Dépenses, monthIdx) + sumRealGroup(transactions, "Factures", data.Factures, monthIdx) + sumRealGroup(transactions, "Crédits", data.Crédits, monthIdx);
    const epargne = sumRealGroup(transactions, "Épargne", data.Épargne, monthIdx);
    const objectif = valAt(data.Objectifs, monthIdx);
    return { revenus, depenses, epargne, objectif, solde: revenus - depenses - epargne };
  }, [data, transactions, monthIdx]);

  const pieData = useMemo(() => {
    const groups = ["Dépenses", "Factures", "Crédits"];
    const result = [];
    groups.forEach((g) => (data[g] || []).forEach((r) => {
      const value = reelForLabel(transactions, g, r.name, monthIdx);
      if (value > 0) result.push({ name: r.name, value });
    }));
    return result;
  }, [data, transactions, monthIdx]);

  const barData = useMemo(() => MONTHS.map((m, i) => ({
    mois: m,
    Revenus: sumRealGroup(transactions, "Revenus", data.Revenus, i),
    Dépenses: sumRealGroup(transactions, "Dépenses", data.Dépenses, i) + sumRealGroup(transactions, "Factures", data.Factures, i) + sumRealGroup(transactions, "Crédits", data.Crédits, i),
  })), [data, transactions]);

  const lineData = useMemo(() => {
    let cumul = 0;
    return MONTHS.map((m, i) => {
      const net = sumRealGroup(transactions, "Revenus", data.Revenus, i)
        - sumRealGroup(transactions, "Dépenses", data.Dépenses, i)
        - sumRealGroup(transactions, "Factures", data.Factures, i)
        - sumRealGroup(transactions, "Crédits", data.Crédits, i)
        - sumRealGroup(transactions, "Épargne", data.Épargne, i);
      cumul += net;
      return { mois: m, Solde: cumul };
    });
  }, [data, transactions]);

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
    setData((prev) => ({ ...prev, [group]: [...prev[group], { id: makeId(), name: "Nouveau libellé", values: Array(12).fill(0) }] }));
  };

  const removeRow = (group, idx) => {
    setData((prev) => {
      const row = prev[group][idx];
      if (row?.id) supabase.from("budget_items").delete().eq("id", row.id);
      return { ...prev, [group]: prev[group].filter((_, i) => i !== idx) };
    });
  };

  const renameRow = (group, idx, name) => {
    setData((prev) => ({ ...prev, [group]: prev[group].map((r, i) => (i === idx ? { ...r, name } : r)) }));
  };

  const commitRename = async (group, oldName, newName) => {
    if (!oldName || oldName === newName || !newName) return;
    setTransactions((prev) => prev.map((t) => (t.type === group && t.category === oldName) ? { ...t, category: newName } : t));
    await supabase.from("transactions")
      .update({ category: newName })
      .eq("user_id", session.user.id)
      .eq("type", group)
      .eq("category", oldName);
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

  const [popupMsg, setPopupMsg] = useState("");
  const [pendingConfirm, setPendingConfirm] = useState(false);

  const doInsert = async () => {
    const payload = {
      user_id: session.user.id,
      date: txForm.date || todayStr(),
      type: txForm.type,
      category: txForm.category,
      amount: Number(txForm.amount),
      comment: txForm.comment,
    };
    const { data: inserted, error } = await supabase.from("transactions").insert(payload).select().single();
    if (!error && inserted) {
      setTransactions((prev) => sortTransactions([
        { id: inserted.id, date: inserted.date, type: inserted.type, category: inserted.category, amount: inserted.amount, comment: inserted.comment, created_at: inserted.created_at },
        ...prev,
      ]));
      setTxForm({ date: todayStr(), type: "", category: "", amount: "", comment: "" });
    }
  };

  const submitTx = async (e) => {
    e.preventDefault();
    if (!txForm.type) { setPopupMsg("Veuillez choisir un type."); return; }
    if (!txForm.category) { setPopupMsg("Veuillez choisir une catégorie."); return; }
    if (!txForm.amount || Number(txForm.amount) === 0) { setPopupMsg("Veuillez indiquer un montant."); return; }
    const isBalanceType = SPLIT_GROUPS.includes(txForm.type);
    const amt = Number(txForm.amount);
    if (!isBalanceType && amt < 0) { setPopupMsg("Le montant doit être positif pour ce type de transaction."); return; }
    if (isBalanceType && amt < 0) { setPendingConfirm(true); return; }
    await doInsert();
  };

  const confirmNegative = async () => { setPendingConfirm(false); await doInsert(); };
  const cancelNegative = () => setPendingConfirm(false);

  const deleteTx = async (id) => {
    setTransactions((prev) => prev.filter((x) => x.id !== id));
    await supabase.from("transactions").delete().eq("id", id);
  };

  const applyDistribution = async (rows, distribDate) => {
    const clean = rows.filter((r) => Number.isFinite(r.amount) && r.amount > 0);
    if (clean.length === 0) return;
    const payload = clean.map((r) => ({
      user_id: session.user.id,
      date: distribDate || todayStr(),
      type: r.group,
      category: r.label,
      amount: Math.round(r.amount),
      comment: `Répartition du surplus — ${r.label}${r.note ? ` (${r.note})` : ""}`,
    }));
    const { data: inserted, error } = await supabase.from("transactions").insert(payload).select();
    if (!error && inserted) {
      setTransactions((prev) => sortTransactions([
        ...inserted.map((t) => ({ id: t.id, date: t.date, type: t.type, category: t.category, amount: t.amount, comment: t.comment, created_at: t.created_at })),
        ...prev,
      ]));
    }
  };

  const addAccount = async (name, type) => {
    const payload = { id: makeId(), user_id: session.user.id, name, type };
    const { data: inserted, error } = await supabase.from("accounts").insert(payload).select().single();
    if (!error && inserted) setAccounts((prev) => [...prev, inserted]);
  };

  const renameAccount = async (id, name) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)));
    await supabase.from("accounts").update({ name }).eq("id", id);
  };

  const deleteAccount = async (id) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setMovements((prev) => prev.filter((m) => m.account_id !== id && m.target_account_id !== id));
    await supabase.from("accounts").delete().eq("id", id);
  };

  const addMovement = async (m) => {
    const amt = Math.round(Number(m.amount));
    const account = accounts.find((a) => a.id === m.accountId);
    const targetAccount = m.type === "transfert" ? accounts.find((a) => a.id === m.targetAccountId) : null;
    const date = m.date || todayStr();

    const movPayload = {
      id: makeId(),
      user_id: session.user.id,
      account_id: m.accountId,
      target_account_id: m.type === "transfert" ? m.targetAccountId : null,
      type: m.type,
      amount: amt,
      date,
      comment: m.comment || null,
      linked_group: null,
      linked_label: null,
      linked_transaction_id: null,
    };

    // Détermine si ce mouvement doit créer une transaction budgétaire (revenu ou épargne),
    // sinon on laisse quand même une trace neutre (type "Compte") dans l'historique.
    let txPayload = null;
    if (m.type === "depot" && m.depositKind === "epargne" && m.linkGroup && m.linkLabel) {
      txPayload = { type: m.linkGroup, category: m.linkLabel, amount: amt, comment: `Compte ${account?.name || ""} — dépôt mis de côté` };
    } else if (m.type === "depot" && m.depositKind === "revenu" && m.linkLabel) {
      txPayload = { type: "Revenus", category: m.linkLabel, amount: amt, comment: `Compte ${account?.name || ""} — revenu reçu` };
    } else if (m.type === "retrait" && m.linkEnabled && m.linkGroup && m.linkLabel) {
      txPayload = { type: m.linkGroup, category: m.linkLabel, amount: -amt, comment: `Compte ${account?.name || ""} — retrait` };
    }

    if (txPayload) {
      const { data: txInserted } = await supabase.from("transactions").insert({ user_id: session.user.id, date, ...txPayload }).select().single();
      if (txInserted) {
        movPayload.linked_group = txInserted.type;
        movPayload.linked_label = txInserted.category;
        movPayload.linked_transaction_id = txInserted.id;
        setTransactions((prev) => sortTransactions([
          { id: txInserted.id, date: txInserted.date, type: txInserted.type, category: txInserted.category, amount: txInserted.amount, comment: txInserted.comment, created_at: txInserted.created_at },
          ...prev,
        ]));
      }
    } else {
      let traceCategory, traceAmount, traceComment;
      if (m.type === "transfert") {
        traceCategory = `${account?.name || "?"} → ${targetAccount?.name || "?"}`;
        traceAmount = amt;
        traceComment = m.comment || "Transfert entre comptes";
      } else if (m.type === "depot") {
        traceCategory = account?.name || "Compte";
        traceAmount = amt;
        traceComment = m.comment || "Dépôt (argent en transit, ne compte pas dans le budget)";
      } else {
        traceCategory = account?.name || "Compte";
        traceAmount = -amt;
        traceComment = m.comment || "Retrait";
      }
      const { data: traceInserted } = await supabase.from("transactions").insert({
        user_id: session.user.id, date, type: ACCOUNT_TRACE_TYPE, category: traceCategory, amount: traceAmount, comment: traceComment,
      }).select().single();
      if (traceInserted) {
        movPayload.linked_transaction_id = traceInserted.id;
        setTransactions((prev) => sortTransactions([
          { id: traceInserted.id, date: traceInserted.date, type: traceInserted.type, category: traceInserted.category, amount: traceInserted.amount, comment: traceInserted.comment, created_at: traceInserted.created_at },
          ...prev,
        ]));
      }
    }

    const { data: inserted, error } = await supabase.from("account_movements").insert(movPayload).select().single();
    if (!error && inserted) setMovements((prev) => sortMovements([inserted, ...prev]));
  };

  const deleteMovement = async (movement) => {
    setMovements((prev) => prev.filter((m) => m.id !== movement.id));
    await supabase.from("account_movements").delete().eq("id", movement.id);
    if (movement.linked_transaction_id) {
      setTransactions((prev) => prev.filter((t) => t.id !== movement.linked_transaction_id));
      await supabase.from("transactions").delete().eq("id", movement.linked_transaction_id);
    }
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
            <ProfileMenu
              session={session} onSignOut={signOut} onAvatarChange={updateAvatar}
              onReplaySlides={() => setShowOnboarding(true)}
              lock={lock} setLock={setLock}
              onAccountDeleted={signOut}
            />
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
            <StatPill icon={<Target size={14} />} label="Objectif" value={fmt(totals.objectif)} color={colors.textDim} />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 sm:px-8 flex gap-1 sticky top-0 z-10 overflow-x-auto" style={{ background: colors.ink, borderBottom: `1px solid ${colors.line}` }}>
          <TabBtn active={tab === "dashboard"} onClick={() => setTab("dashboard")} icon={<LayoutDashboard size={15} />} label="Tableau de bord" />
          <TabBtn active={tab === "transactions"} onClick={() => setTab("transactions")} icon={<ListPlus size={15} />} label="Transactions" />
          <TabBtn active={tab === "budget"} onClick={() => setTab("budget")} icon={<Table2 size={15} />} label="Budget" />
          <TabBtn active={tab === "suivi"} onClick={() => setTab("suivi")} icon={<Scale size={15} />} label="Suivi réel" />
          <TabBtn active={tab === "comptes"} onClick={() => setTab("comptes")} icon={<Landmark size={15} />} label="Comptes" />
        </div>

        <div className="px-5 sm:px-8 py-6">
          {tab === "dashboard" && <Dashboard pieData={pieData} barData={barData} lineData={lineData} data={data} transactions={transactions} monthIdx={monthIdx} totals={totals} />}
          {tab === "transactions" && (
            <TransactionsTab
              txForm={txForm} setTxForm={setTxForm} submitTx={submitTx}
              transactions={transactions} onDeleteTx={deleteTx}
              categories={allCategoryNames} groups={TX_GROUPS}
              popupMsg={popupMsg} onClosePopup={() => setPopupMsg("")}
              pendingConfirm={pendingConfirm} onConfirmNegative={confirmNegative} onCancelNegative={cancelNegative}
            />
          )}
          {tab === "budget" && (
            <BudgetTab data={data} updateCell={updateCell} addRow={addRow} removeRow={removeRow} renameRow={renameRow} moveRow={moveRow} commitRename={commitRename} />
          )}
          {tab === "suivi" && (
            <SuiviReelTab data={data} transactions={transactions} monthIdx={monthIdx} onDistribute={applyDistribution} />
          )}
          {tab === "comptes" && (
            <ComptesTab
              accounts={accounts} movements={movements} data={data}
              onAddAccount={addAccount} onRenameAccount={renameAccount} onDeleteAccount={deleteAccount}
              onAddMovement={addMovement} onDeleteMovement={deleteMovement}
            />
          )}
        </div>
      </div>
      {(!onboardingSeen || showOnboarding) && (
        <Onboarding onClose={() => {
          setOnboardingSeen(true); setShowOnboarding(false);
          try { localStorage.setItem("budget-onboarding-seen", "1"); } catch (e) {}
        }} />
      )}
      {isLocked && <LockScreen pin={lock.pin} onUnlock={() => setIsLocked(false)} />}
    </ThemeContext.Provider>
  );
}

function ProfileMenu({ session, onSignOut, onAvatarChange, onReplaySlides, lock, setLock, onAccountDeleted }) {
  const { colors, theme, setTheme } = useContext(ThemeContext);
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLock, setShowLock] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showContact, setShowContact] = useState(false);
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
          <MenuItem icon={<PlayCircle size={14} />} label="Revoir les diapos" onClick={() => { onReplaySlides(); setOpen(false); }} colors={colors} />
          <MenuItem icon={<Lock size={14} />} label="Verrouiller l'application" onClick={() => { setShowLock(true); setOpen(false); }} colors={colors} />
          <MenuItem icon={<Mail size={14} />} label="Nous contacter" onClick={() => { setShowContact(true); setOpen(false); }} colors={colors} />
          <MenuItem icon={<LogOut size={14} />} label="Déconnexion" onClick={onSignOut} colors={colors} />
          <MenuItem icon={<AlertOctagon size={14} />} label="Supprimer le compte" onClick={() => { setShowDelete(true); setOpen(false); }} colors={colors} danger />
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

      {showLock && <LockSetupModal lock={lock} setLock={setLock} onClose={() => setShowLock(false)} />}
      {showContact && <ContactModal email={email} onClose={() => setShowContact(false)} />}
      {showDelete && <DeleteAccountModal email={email} onClose={() => setShowDelete(false)} onDeleted={onAccountDeleted} />}
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

function LockSetupModal({ lock, setLock, onClose }) {
  const { colors } = useContext(ThemeContext);
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [timeout, setTimeoutVal] = useState(lock.timeout || 10);
  const [error, setError] = useState("");

  const enable = () => {
    if (pin1.length !== 4) { setError("Le code doit contenir 4 chiffres."); return; }
    if (pin1 !== pin2) { setError("Les deux codes ne correspondent pas."); return; }
    setLock({ enabled: true, pin: pin1, timeout });
    onClose();
  };

  const disable = () => {
    setLock({ enabled: false, pin: "", timeout });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-sm rounded-xl p-5" style={{ background: colors.surface, border: `1px solid ${colors.line}` }}>
        <div className="flex items-center justify-between mb-4">
          <span className="disp text-lg" style={{ color: colors.text }}>Verrouiller l'application</span>
          <button onClick={onClose} style={{ color: colors.textDim }}><X size={18} /></button>
        </div>

        {lock.enabled && (
          <div className="mb-4 p-3 rounded-lg text-xs" style={{ background: colors.surface2, color: colors.textDim }}>
            Le verrouillage est actuellement activé. Tu peux le désactiver ci-dessous ou changer les réglages en confirmant un nouveau code.
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Field label="Choisir un code à 4 chiffres">
            <input
              type="password" inputMode="numeric" maxLength={4} value={pin1}
              onChange={(e) => setPin1(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full text-center tracking-[0.5em] num" style={{ background: colors.surface2, border: `1px solid ${colors.line}`, borderRadius: 6, padding: "8px 10px", color: colors.text, outline: "none" }}
            />
          </Field>
          <Field label="Confirmer le code">
            <input
              type="password" inputMode="numeric" maxLength={4} value={pin2}
              onChange={(e) => setPin2(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full text-center tracking-[0.5em] num" style={{ background: colors.surface2, border: `1px solid ${colors.line}`, borderRadius: 6, padding: "8px 10px", color: colors.text, outline: "none" }}
            />
          </Field>
          <Field label="Verrouiller après une inactivité de">
            <select
              value={timeout} onChange={(e) => setTimeoutVal(Number(e.target.value))}
              className="w-full" style={{ background: colors.surface2, border: `1px solid ${colors.line}`, borderRadius: 6, padding: "8px 10px", color: colors.text, outline: "none" }}
            >
              {LOCK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>

          {error && <div className="text-xs" style={{ color: colors.coral }}>{error}</div>}

          <button onClick={enable} className="mt-1 py-2.5 rounded-md text-sm font-semibold" style={{ background: colors.gold, color: colors.ink }}>
            Activer le verrouillage
          </button>
          {lock.enabled && (
            <button onClick={disable} className="py-2.5 rounded-md text-sm font-semibold" style={{ background: colors.surface2, color: colors.coral }}>
              Désactiver le verrouillage
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactModal({ email, onClose }) {
  const { colors } = useContext(ThemeContext);
  const [message, setMessage] = useState("");
  const CONTACT_EMAIL = "support@monbudget.app";
  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Contact depuis Mon Budget")}&body=${encodeURIComponent(message + "\n\n— envoyé par " + email)}`;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-sm rounded-xl p-5" style={{ background: colors.surface, border: `1px solid ${colors.line}` }}>
        <div className="flex items-center justify-between mb-4">
          <span className="disp text-lg" style={{ color: colors.text }}>Nous contacter</span>
          <button onClick={onClose} style={{ color: colors.textDim }}><X size={18} /></button>
        </div>
        <div className="text-xs mb-3" style={{ color: colors.textDim }}>
          Écris ton message ci-dessous — il s'ouvrira dans ton application email habituelle, prêt à envoyer.
        </div>
        <textarea
          value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Ton message…"
          className="w-full mb-3" style={{ background: colors.surface2, border: `1px solid ${colors.line}`, borderRadius: 6, padding: "8px 10px", color: colors.text, outline: "none", resize: "none" }}
        />
        <a
          href={mailtoHref}
          className="block text-center w-full py-2.5 rounded-md text-sm font-semibold"
          style={{ background: colors.gold, color: colors.ink }}
        >
          Ouvrir dans ma messagerie
        </a>
      </div>
    </div>
  );
}

function DeleteAccountModal({ email, onClose, onDeleted }) {
  const { colors } = useContext(ThemeContext);
  const [stage, setStage] = useState("warn"); // warn | sent | verifying | error
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const sendCode = async () => {
    setBusy(true); setError("");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setStage("sent");
  };

  const confirmDelete = async () => {
    setBusy(true); setError("");
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (error || !data?.session) { setBusy(false); setError("Code incorrect ou expiré."); return; }
    const uid = data.session.user.id;
    await supabase.from("budget_items").delete().eq("user_id", uid);
    await supabase.from("transactions").delete().eq("user_id", uid);
    setBusy(false);
    onDeleted();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-sm rounded-xl p-5" style={{ background: colors.surface, border: `1px solid ${colors.line}` }}>
        <div className="flex items-center justify-between mb-4">
          <span className="disp text-lg" style={{ color: colors.coral }}>Supprimer le compte</span>
          <button onClick={onClose} style={{ color: colors.textDim }}><X size={18} /></button>
        </div>

        {stage === "warn" && (
          <div className="flex flex-col gap-3">
            <div className="text-sm" style={{ color: colors.text }}>
              Cette action supprimera définitivement toutes tes données (Budget, Transactions). Un code de confirmation te sera envoyé par email à <span className="font-medium">{email}</span>.
            </div>
            {error && <div className="text-xs" style={{ color: colors.coral }}>{error}</div>}
            <button onClick={sendCode} disabled={busy} className="py-2.5 rounded-md text-sm font-semibold" style={{ background: colors.coral, color: "#fff", opacity: busy ? 0.7 : 1 }}>
              {busy ? "Envoi…" : "Envoyer le code de confirmation"}
            </button>
          </div>
        )}

        {stage === "sent" && (
          <div className="flex flex-col gap-3">
            <div className="text-sm" style={{ color: colors.text }}>Entre le code à 6 chiffres reçu par email :</div>
            <input
              type="text" inputMode="numeric" maxLength={6} value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full text-center tracking-[0.4em] num text-lg"
              style={{ background: colors.surface2, border: `1px solid ${colors.line}`, borderRadius: 6, padding: "10px", color: colors.text, outline: "none" }}
            />
            {error && <div className="text-xs" style={{ color: colors.coral }}>{error}</div>}
            <button onClick={confirmDelete} disabled={busy || code.length !== 6} className="py-2.5 rounded-md text-sm font-semibold" style={{ background: colors.coral, color: "#fff", opacity: busy ? 0.7 : 1 }}>
              {busy ? "Suppression…" : "Confirmer la suppression définitive"}
            </button>
          </div>
        )}
      </div>
    </div>
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

function Dashboard({ pieData, barData, lineData, data, transactions, monthIdx, totals }) {
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
      <ObjectifAnneeCard data={data} transactions={transactions} monthIdx={monthIdx} />

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
  const atteint = Math.max(Math.min(epargneMois, objectifMois), 0);
  const restantPart = Math.max(objectifMois - Math.max(epargneMois, 0), 0);
  const pieSlices = [
    { name: "Atteint", value: atteint || 0.0001 },
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

function ObjectifAnneeCard({ data, transactions, monthIdx }) {
  const { colors } = useContext(ThemeContext);
  const objectifRows = data.Objectifs || [];
  const epargneRows = data.Épargne || [];

  const evolution = useMemo(() => {
    let cumulSaved = 0, cumulObjectif = 0;
    return MONTHS.map((m, i) => {
      cumulSaved += sumRealGroup(transactions, "Épargne", epargneRows, i);
      cumulObjectif += sumGroupMonth(objectifRows, i);
      const pct = cumulObjectif > 0 ? (cumulSaved / cumulObjectif) * 100 : 0;
      return { mois: m, Progression: Math.round(pct * 10) / 10, cumulSaved, cumulObjectif };
    });
  }, [data, transactions]);

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
  const currentPct = current && current.cumulObjectif > 0 ? (current.cumulSaved / current.cumulObjectif) * 100 : 0;
  const donutData = [
    { name: "Atteint", value: Math.max(Math.min(current?.cumulSaved || 0, current?.cumulObjectif || 0), 0) || 0.0001 },
    { name: "Restant", value: Math.max((current?.cumulObjectif || 0) - Math.max(current?.cumulSaved || 0, 0), 0) || 0.0001 },
  ];

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
          <div className="flex items-center gap-4">
            <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" innerRadius={46} outerRadius={63} startAngle={90} endAngle={-270} stroke="none">
                    <Cell fill={currentPct >= 100 ? colors.mint : colors.gold} />
                    <Cell fill={colors.surface3} />
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: colors.surface2, border: `1px solid ${colors.line}`, borderRadius: 8, fontSize: 12, color: colors.text }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="num text-lg font-semibold" style={{ color: colors.text }}>{Math.round(currentPct)}%</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 text-xs" style={{ color: colors.textDim }}>
              <div>Objectif cumulé : <span className="num font-medium" style={{ color: colors.text }}>{fmt(current?.cumulObjectif || 0)}</span></div>
              <div>Épargné cumulé : <span className="num font-medium" style={{ color: colors.text }}>{fmt(current?.cumulSaved || 0)}</span></div>
            </div>
          </div>

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
                  const targetTotal = sumRow(row);
                  const savedTotal = reelForLabel(transactions, "Objectifs", row.name, -1);
                  const pct = targetTotal > 0 ? (savedTotal / targetTotal) * 100 : 0;
                  const miniDonut = [
                    { name: "Atteint", value: Math.max(Math.min(savedTotal, targetTotal), 0) || 0.0001 },
                    { name: "Restant", value: Math.max(targetTotal - Math.max(savedTotal, 0), 0) || 0.0001 },
                  ];
                  return (
                    <div key={row.name} className="flex flex-col items-center">
                      <div className="text-[11px] mb-1 truncate w-full text-center" style={{ color: colors.textDim }}>{row.name}</div>
                      <div className="relative" style={{ width: 72, height: 72 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={miniDonut} dataKey="value" innerRadius={22} outerRadius={32} startAngle={90} endAngle={-270} stroke="none">
                              <Cell fill={pct >= 100 ? colors.mint : colors.gold} />
                              <Cell fill={colors.surface3} />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="num text-[11px] font-semibold" style={{ color: colors.text }}>{Math.round(pct)}%</span>
                        </div>
                      </div>
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

function InfoModal({ message, onClose, tone = "warning" }) {
  const { colors } = useContext(ThemeContext);
  if (!message) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-xs rounded-xl p-5 text-center" style={{ background: colors.surface, border: `1px solid ${colors.line}` }}>
        <div className="flex justify-center mb-3">
          {tone === "warning" ? <AlertOctagon size={28} color={colors.coral} /> : <CircleCheck size={28} color={colors.mint} />}
        </div>
        <div className="text-sm mb-4" style={{ color: colors.text }}>{message}</div>
        <button onClick={onClose} className="w-full py-2 rounded-md text-sm font-semibold" style={{ background: colors.gold, color: colors.ink }}>
          D'accord
        </button>
      </div>
    </div>
  );
}

function TransactionsTab({ txForm, setTxForm, submitTx, transactions, onDeleteTx, categories, groups, popupMsg, onClosePopup, pendingConfirm, onConfirmNegative, onCancelNegative }) {
  const { colors } = useContext(ThemeContext);
  const inputStyle = { background: colors.surface2, border: `1px solid ${colors.line}`, borderRadius: 6, padding: "7px 10px", color: colors.text, fontSize: 13.5, outline: "none" };
  const [filters, setFilters] = useState({ date: "", type: "", category: "", comment: "", amount: "" });
  const hasFilters = Object.values(filters).some((v) => v);
  const isBalanceType = SPLIT_GROUPS.includes(txForm.type);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filters.date && t.date !== filters.date) return false;
      if (filters.type && t.type !== filters.type) return false;
      if (filters.category && !(t.category || "").toLowerCase().includes(filters.category.toLowerCase())) return false;
      if (filters.comment && !(t.comment || "").toLowerCase().includes(filters.comment.toLowerCase())) return false;
      if (filters.amount && Number(t.amount) !== Number(filters.amount)) return false;
      return true;
    });
  }, [transactions, filters]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 items-start">
      <Card title="Ajouter une transaction">
        <form onSubmit={submitTx} className="flex flex-col gap-3">
          <Field label="Date"><input type="date" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} className="w-full" style={inputStyle} /></Field>
          <Field label="Type">
            <select value={txForm.type} onChange={(e) => setTxForm({ ...txForm, type: e.target.value, category: "" })} className="w-full" style={inputStyle}>
              <option value="">Choisir…</option>
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
            {isBalanceType && (
              <span className="text-[11px] mt-0.5" style={{ color: colors.textDim }}>
                Astuce : indique un montant négatif pour enregistrer un retrait.
              </span>
            )}
          </Field>
          <Field label="Commentaire"><input type="text" value={txForm.comment} onChange={(e) => setTxForm({ ...txForm, comment: e.target.value })} placeholder="Optionnel" className="w-full" style={inputStyle} /></Field>
          <button type="submit" className="mt-1.5 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-sm font-semibold" style={{ background: colors.gold, color: colors.ink }}>
            <Plus size={15} /> Ajouter
          </button>
        </form>
      </Card>

      <Card title={`Historique (${filtered.length}${hasFilters ? ` / ${transactions.length}` : ""})`}>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
          <input type="date" value={filters.date} onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))} className="text-xs" style={inputStyle} />
          <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))} className="text-xs" style={inputStyle}>
            <option value="">Tous types</option>
            {groups.map((g) => <option key={g} value={g}>{g}</option>)}
            <option value={ACCOUNT_TRACE_TYPE}>Compte</option>
          </select>
          <input type="text" placeholder="Catégorie" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} className="text-xs" style={inputStyle} />
          <input type="text" placeholder="Commentaire" value={filters.comment} onChange={(e) => setFilters((f) => ({ ...f, comment: e.target.value }))} className="text-xs" style={inputStyle} />
          <input type="number" placeholder="Montant" value={filters.amount} onChange={(e) => setFilters((f) => ({ ...f, amount: e.target.value }))} className="text-xs num" style={inputStyle} />
        </div>
        {hasFilters && (
          <button onClick={() => setFilters({ date: "", type: "", category: "", comment: "", amount: "" })} className="text-xs mb-3" style={{ color: colors.gold }}>
            Réinitialiser les filtres
          </button>
        )}

        {filtered.length === 0 ? (
          <EmptyState text={hasFilters ? "Aucune transaction ne correspond à ces filtres." : "Aucune transaction enregistrée pour l'instant."} />
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
                {filtered.map((t) => {
                  const isWithdrawal = Number(t.amount) < 0;
                  const isDeposit = SPLIT_GROUPS.includes(t.type) && Number(t.amount) > 0;
                  return (
                    <tr key={t.id} style={{ borderTop: `1px solid ${colors.line}`, background: isWithdrawal ? (colors.coral + "0d") : "transparent" }}>
                      <td className="py-2 pr-3 num" style={{ color: colors.textDim }}>{formatDateFR(t.date)}</td>
                      <td className="py-2 pr-3">{t.type}</td>
                      <td className="py-2 pr-3">{t.category}</td>
                      <td className="py-2 pr-3" style={{ color: colors.textDim }}>{t.comment || "—"}</td>
                      <td className="py-2 pr-3 num text-right font-medium" style={{ color: isWithdrawal ? colors.coral : colors.text }}>
                        {isWithdrawal ? "↓ Retrait — " : isDeposit ? "↑ " : ""}{fmt(Math.abs(t.amount))}
                      </td>
                      <td className="py-2 text-right">
                        <button onClick={() => onDeleteTx(t.id)} style={{ color: colors.textDim }}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <InfoModal message={popupMsg} onClose={onClosePopup} />
      {pendingConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-xs rounded-xl p-5 text-center" style={{ background: colors.surface, border: `1px solid ${colors.line}` }}>
            <div className="flex justify-center mb-3">
              <AlertTriangle size={28} color={colors.coral} />
            </div>
            <div className="text-sm mb-1 font-medium" style={{ color: colors.text }}>Confirmer ce retrait ?</div>
            <div className="text-xs mb-4" style={{ color: colors.textDim }}>
              Tu es sur le point d'enregistrer un retrait de <span className="num font-semibold" style={{ color: colors.coral }}>{fmt(Math.abs(Number(txForm.amount)))}</span> sur « {txForm.category} » ({txForm.type}), à la date du {formatDateFR(txForm.date)}.
            </div>
            <div className="flex gap-2">
              <button onClick={onCancelNegative} className="flex-1 py-2 rounded-md text-sm font-medium" style={{ background: colors.surface2, color: colors.text }}>
                Annuler
              </button>
              <button onClick={onConfirmNegative} className="flex-1 py-2 rounded-md text-sm font-semibold" style={{ background: colors.coral, color: "#fff" }}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
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

function BudgetTab({ data, updateCell, addRow, removeRow, renameRow, moveRow, commitRename }) {
  const { colors } = useContext(ThemeContext);
  const originalNames = useRef({});
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
                        onFocus={() => { originalNames.current[row.id || `${group}-${ri}`] = row.name; }}
                        onChange={(e) => renameRow(group, ri, e.target.value)}
                        onBlur={() => {
                          const key = row.id || `${group}-${ri}`;
                          const original = originalNames.current[key];
                          if (original && original !== row.name) commitRename(group, original, row.name);
                        }}
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

const SUIVI_GROUPS = ["Revenus", "Dépenses", "Factures", "Crédits", "Épargne", "Objectifs"];

function calcEcart(group, estime, reel) {
  return FLIP_SIGN_GROUPS.includes(group) ? estime - reel : reel - estime;
}

function EcartRow({ label, estime, reel, group, bold }) {
  const { colors } = useContext(ThemeContext);
  const ecart = calcEcart(group, estime, reel);
  const isEqual = Math.abs(ecart) < 1;
  const statusColor = isEqual ? colors.textDim : ecart > 0 ? colors.mint : colors.coral;
  const StatusIcon = isEqual ? Minus : ecart > 0 ? CheckCircle2 : AlertTriangle;
  const maxVal = Math.max(estime, reel, 1);

  const content = (
    <>
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <span
          className={bold ? "text-xs font-bold uppercase tracking-wide" : "text-sm font-medium truncate"}
          style={{ color: bold ? colors.gold : colors.text }}
        >
          {label}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusIcon size={bold ? 15 : 13} color={statusColor} />
          <span className={bold ? "num text-sm font-bold" : "num text-xs font-semibold"} style={{ color: statusColor }}>
            {isEqual ? "= " : ecart > 0 ? "+" : ""}{fmt(ecart)}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] w-10 shrink-0" style={{ color: colors.textDim }}>Estimé</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: colors.surface3 }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min((estime / maxVal) * 100, 100)}%`, background: colors.textDim }} />
          </div>
          <span className="num text-[11px] w-20 text-right shrink-0" style={{ color: colors.textDim }}>{fmt(estime)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] w-10 shrink-0" style={{ color: colors.textDim }}>Réel</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: colors.surface3 }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min((reel / maxVal) * 100, 100)}%`, background: statusColor }} />
          </div>
          <span className="num text-[11px] w-20 text-right shrink-0" style={{ color: colors.text }}>{fmt(reel)}</span>
        </div>
      </div>
    </>
  );

  if (bold) {
    return (
      <div className="p-3 rounded-lg" style={{ background: colors.surface2, border: `1.5px solid ${colors.gold}` }}>
        {content}
      </div>
    );
  }

  return (
    <div className="pb-3" style={{ borderBottom: `1px solid ${colors.line}` }}>
      {content}
    </div>
  );
}

function SuiviReelTab({ data, transactions, monthIdx, onDistribute }) {
  const { colors } = useContext(ThemeContext);
  const periodLabel = monthIdx === -1 ? "sur l'année 2026" : `pour ${["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"][monthIdx]} 2026`;

  const recap = useMemo(() => {
    const revenus = sumRealGroup(transactions, "Revenus", data.Revenus, monthIdx);
    const sorties = ["Dépenses", "Factures", "Crédits", "Épargne", "Objectifs"]
      .reduce((a, g) => a + sumRealGroup(transactions, g, data[g], monthIdx), 0);
    return revenus - sorties;
  }, [data, transactions, monthIdx]);

  return (
    <div className="flex flex-col gap-5">
      <div className="text-xs" style={{ color: colors.textDim }}>
        Comparaison entre ce que tu avais prévu (Estimé) et ce que tes transactions montrent réellement (Réel), {periodLabel}. Pour les dépenses et factures, dépenser moins que prévu s'affiche en positif (vert) ; pour les revenus, crédits, épargne et objectifs, avoir plus que prévu s'affiche en positif (vert).
      </div>
      {SUIVI_GROUPS.map((group) => {
        const rows = data[group] || [];
        const estimeTotal = rows.reduce((a, r) => a + valAt([r], monthIdx), 0);
        const reelTotal = rows.reduce((a, r) => a + reelForLabel(transactions, group, r.name, monthIdx), 0);
        return (
          <Card key={group} title={group}>
            <div className="flex flex-col gap-3">
              {rows.map((row) => (
                <EcartRow
                  key={row.name}
                  label={row.name}
                  estime={valAt([row], monthIdx)}
                  reel={reelForLabel(transactions, group, row.name, monthIdx)}
                  group={group}
                />
              ))}
              {rows.length === 0 && <EmptyState text="Aucun libellé dans ce volet." />}
              {rows.length > 0 && (
                <div className="pt-1">
                  <EcartRow label={`Total ${group}`} estime={estimeTotal} reel={reelTotal} group={group} bold />
                </div>
              )}
            </div>
          </Card>
        );
      })}

      <RecapCard recap={recap} data={data} transactions={transactions} monthIdx={monthIdx} onDistribute={onDistribute} />
    </div>
  );
}

function RecapCard({ recap, data, transactions, monthIdx, onDistribute }) {
  const { colors } = useContext(ThemeContext);
  const [showDistrib, setShowDistrib] = useState(false);
  const positive = recap > 0.5;

  return (
    <Card title="Bilan du mois — revenus réels moins toutes les charges réelles">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="num text-2xl font-semibold" style={{ color: positive ? colors.mint : recap < -0.5 ? colors.coral : colors.textDim }}>
            {fmt(recap)}
          </div>
          {!positive && (
            <div className="text-xs mt-1" style={{ color: colors.textDim }}>
              {recap < -0.5 ? "Tes dépenses réelles dépassent tes revenus réels — rien à répartir pour l'instant." : "Pas encore de surplus à répartir pour cette période."}
            </div>
          )}
        </div>
        <button
          onClick={() => positive && setShowDistrib(true)}
          disabled={!positive}
          className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold"
          style={{
            background: positive ? colors.gold : colors.surface2,
            color: positive ? colors.ink : colors.textDim,
            cursor: positive ? "pointer" : "not-allowed",
          }}
        >
          <Sparkles size={15} /> Répartir le surplus
        </button>
      </div>

      {showDistrib && (
        <DistributeModal
          surplus={recap}
          data={data}
          transactions={transactions}
          monthIdx={monthIdx}
          onClose={() => setShowDistrib(false)}
          onDistribute={onDistribute}
        />
      )}
    </Card>
  );
}

function DistributeModal({ surplus, data, transactions, monthIdx, onClose, onDistribute }) {
  const { colors } = useContext(ThemeContext);
  const [mode, setMode] = useState(null); // null | "auto" | "manual"
  const [manualAmounts, setManualAmounts] = useState({});
  const [extraSelected, setExtraSelected] = useState([]);
  const [autoStage, setAutoStage] = useState("compute"); // compute | needExtra
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [distribDate, setDistribDate] = useState(todayStr());

  const targets = useMemo(() => {
    const list = [];
    SPLIT_GROUPS.forEach((g) => (data[g] || []).forEach((row) => {
      const estime = valAt([row], monthIdx);
      const reel = reelForLabel(transactions, g, row.name, monthIdx);
      list.push({ key: `${g}::${row.name}`, group: g, name: row.name, estime, reel, need: Math.max(estime - reel, 0) });
    }));
    return list;
  }, [data, transactions, monthIdx]);

  const totalNeed = targets.reduce((a, t) => a + t.need, 0);

  const autoAllocation = useMemo(() => {
    let remaining = surplus;
    const alloc = targets.map((t) => ({ ...t, amount: 0 }));
    for (const t of alloc) {
      if (remaining <= 0) break;
      const give = Math.min(t.need, remaining);
      t.amount = give;
      remaining -= give;
    }
    return { alloc, remaining };
  }, [targets, surplus]);

  const chooseAuto = () => {
    setMode("auto");
    // S'il n'y a aucun objectif chiffré à combler, on saute directement à la répartition manuelle des intitulés
    setAutoStage(totalNeed > 0.5 ? "compute" : "needExtra");
  };

  const finishWith = async (rows) => {
    if (rows.length === 0) { onClose(); return; }
    setBusy(true);
    await onDistribute(rows, distribDate);
    setBusy(false);
    setDone(true);
    setTimeout(onClose, 900);
  };

  const applyAuto = async () => {
    const rows = autoAllocation.alloc
      .filter((a) => a.amount > 0)
      .map((a) => ({ group: a.group, label: a.name, amount: a.amount, note: `atteinte de l'objectif estimé (${fmt(a.amount)})` }));

    if (autoAllocation.remaining > 0.5) {
      if (rows.length > 0) { setBusy(true); await onDistribute(rows, distribDate); setBusy(false); }
      setAutoStage("needExtra");
    } else {
      finishWith(rows);
    }
  };

  const applyExtra = () => {
    if (extraSelected.length === 0) { onClose(); return; }
    const each = autoAllocation.remaining / extraSelected.length;
    const rows = extraSelected.map((key) => {
      const t = targets.find((x) => x.key === key);
      return { group: t.group, label: t.name, amount: each, note: "répartition égale du surplus restant" };
    });
    finishWith(rows);
  };

  const manualTotal = Object.values(manualAmounts).reduce((a, v) => a + (Number(v) || 0), 0);
  const applyManual = () => {
    const rows = targets
      .filter((t) => Number(manualAmounts[t.key]) > 0)
      .map((t) => ({ group: t.group, label: t.name, amount: Number(manualAmounts[t.key]), note: "montant choisi manuellement" }));
    finishWith(rows);
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }}>
        <div className="w-full max-w-xs rounded-xl p-6 text-center" style={{ background: colors.surface, border: `1px solid ${colors.line}` }}>
          <CircleCheck size={28} color={colors.mint} className="mx-auto mb-2" />
          <div className="text-sm font-medium" style={{ color: colors.text }}>Répartition effectuée — les transactions ont été créées.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-md rounded-xl p-5" style={{ background: colors.surface, border: `1px solid ${colors.line}` }}>
        <div className="flex items-center justify-between mb-4">
          <span className="disp text-lg" style={{ color: colors.text }}>Répartir {fmt(surplus)}</span>
          <button onClick={onClose} style={{ color: colors.textDim }}><X size={18} /></button>
        </div>

        {targets.length > 0 && !done && (
          <div className="mb-4">
            <Field label="Date de la répartition">
              <input
                type="date" value={distribDate} onChange={(e) => setDistribDate(e.target.value)}
                className="w-full" style={{ background: colors.surface2, border: `1px solid ${colors.line}`, borderRadius: 6, padding: "7px 10px", color: colors.text, fontSize: 13.5, outline: "none" }}
              />
            </Field>
          </div>
        )}

        {targets.length === 0 && <EmptyState text="Ajoute au moins un intitulé dans Épargne ou Objectifs (onglet Budget) pour pouvoir répartir un surplus." />}

        {targets.length > 0 && mode === null && (
          <div className="flex flex-col gap-2.5">
            <button onClick={chooseAuto} className="w-full text-left p-3 rounded-lg text-sm" style={{ background: colors.surface2, color: colors.text }}>
              <span className="font-semibold">Répartir automatiquement</span>
              <div className="text-xs mt-0.5" style={{ color: colors.textDim }}>Comble d'abord les montants estimés non encore atteints, puis répartit le reste selon ton choix.</div>
            </button>
            <button onClick={() => setMode("manual")} className="w-full text-left p-3 rounded-lg text-sm" style={{ background: colors.surface2, color: colors.text }}>
              <span className="font-semibold">Choisir moi-même les montants</span>
              <div className="text-xs mt-0.5" style={{ color: colors.textDim }}>Répartis le surplus comme tu le souhaites.</div>
            </button>
          </div>
        )}

        {mode === "auto" && autoStage === "compute" && (
          <div className="flex flex-col gap-3">
            <div className="text-xs" style={{ color: colors.textDim }}>Voici ce qui sera affecté à chaque intitulé pour combler ce qui manque à son montant estimé :</div>
            {autoAllocation.alloc.filter((a) => a.amount > 0).map((a) => (
              <div key={a.key} className="flex items-center justify-between text-sm">
                <span style={{ color: colors.text }}>{a.name} <span className="text-xs" style={{ color: colors.textDim }}>({a.group})</span></span>
                <span className="num font-medium" style={{ color: colors.mint }}>+{fmt(a.amount)}</span>
              </div>
            ))}
            <button onClick={applyAuto} disabled={busy} className="mt-2 py-2.5 rounded-md text-sm font-semibold" style={{ background: colors.gold, color: colors.ink, opacity: busy ? 0.7 : 1 }}>
              {busy ? "Répartition en cours…" : "Confirmer"}
            </button>
          </div>
        )}

        {mode === "auto" && autoStage === "needExtra" && (
          <div className="flex flex-col gap-3">
            <div className="text-sm" style={{ color: colors.text }}>
              {totalNeed > 0.5
                ? <>Tous les intitulés ont atteint leur montant estimé ! Il te reste <span className="num font-semibold">{fmt(autoAllocation.remaining)}</span> à répartir.</>
                : <>Aucun montant estimé n'est encore défini pour tes intitulés Épargne/Objectifs — choisis où affecter les <span className="num font-semibold">{fmt(surplus)}</span> disponibles.</>
              }
            </div>
            <div className="text-xs" style={{ color: colors.textDim }}>Coche les intitulés où tu veux ajouter ce montant (réparti à parts égales entre eux) :</div>
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
              {targets.map((t) => (
                <label key={t.key} className="flex items-center gap-2 text-sm" style={{ color: colors.text }}>
                  <input
                    type="checkbox"
                    checked={extraSelected.includes(t.key)}
                    onChange={(e) => setExtraSelected((prev) => e.target.checked ? [...prev, t.key] : prev.filter((k) => k !== t.key))}
                  />
                  {t.name} <span className="text-xs" style={{ color: colors.textDim }}>({t.group})</span>
                </label>
              ))}
            </div>
            <button onClick={applyExtra} disabled={busy || extraSelected.length === 0} className="mt-1 py-2.5 rounded-md text-sm font-semibold" style={{ background: colors.gold, color: colors.ink, opacity: busy || extraSelected.length === 0 ? 0.7 : 1 }}>
              {busy ? "Répartition en cours…" : `Répartir ${fmt(autoAllocation.remaining)}`}
            </button>
          </div>
        )}

        {mode === "manual" && (
          <div className="flex flex-col gap-3">
            {targets.map((t) => (
              <label key={t.key} className="flex items-center justify-between gap-2 text-sm">
                <span style={{ color: colors.text }}>{t.name} <span className="text-xs" style={{ color: colors.textDim }}>({t.group})</span></span>
                <input
                  type="number" min="0" placeholder="0"
                  value={manualAmounts[t.key] || ""}
                  onChange={(e) => setManualAmounts((prev) => ({ ...prev, [t.key]: e.target.value }))}
                  className="w-24 num text-right text-xs py-1.5 px-2 rounded"
                  style={{ background: colors.surface2, border: `1px solid ${colors.line}`, color: colors.text, outline: "none" }}
                />
              </label>
            ))}
            <div className="text-xs pt-2" style={{ borderTop: `1px solid ${colors.line}`, color: manualTotal > surplus ? colors.coral : colors.textDim }}>
              Total réparti : {fmt(manualTotal)} / {fmt(surplus)}
            </div>
            <button
              onClick={applyManual}
              disabled={busy || manualTotal <= 0 || manualTotal > surplus}
              className="mt-1 py-2.5 rounded-md text-sm font-semibold"
              style={{ background: manualTotal > 0 && manualTotal <= surplus ? colors.gold : colors.surface2, color: manualTotal > 0 && manualTotal <= surplus ? colors.ink : colors.textDim }}
            >
              {busy ? "Répartition en cours…" : "Confirmer la répartition"}
            </button>
          </div>
        )}
      </div>
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

function LockScreen({ pin, onUnlock }) {
  const { colors } = useContext(ThemeContext);
  const [entered, setEntered] = useState("");
  const [error, setError] = useState(false);

  const handleDigit = (d) => {
    const next = (entered + d).slice(0, 4);
    setEntered(next);
    setError(false);
    if (next.length === 4) {
      if (next === pin) { setTimeout(() => onUnlock(), 150); }
      else { setError(true); setTimeout(() => setEntered(""), 400); }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5" style={{ background: colors.ink }}>
      <div className="w-full max-w-xs text-center">
        <Lock size={28} color={colors.gold} className="mx-auto mb-4" />
        <div className="disp text-lg mb-1" style={{ color: colors.text }}>Application verrouillée</div>
        <div className="text-xs mb-6" style={{ color: colors.textDim }}>Entre ton code à 4 chiffres</div>
        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="w-3.5 h-3.5 rounded-full" style={{ background: i < entered.length ? (error ? colors.coral : colors.gold) : colors.surface2, border: `1px solid ${colors.line}` }} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
            d === "" ? <div key={i} /> : (
              <button
                key={i}
                onClick={() => d === "⌫" ? setEntered((s) => s.slice(0, -1)) : handleDigit(d)}
                className="py-3 rounded-lg text-lg num"
                style={{ background: colors.surface, color: colors.text, border: `1px solid ${colors.line}` }}
              >
                {d}
              </button>
            )
          ))}
        </div>
      </div>
    </div>
  );
}

function ComptesTab({ accounts, movements, data, onAddAccount, onRenameAccount, onDeleteAccount, onAddMovement, onDeleteMovement }) {
  const { colors } = useContext(ThemeContext);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [movementFor, setMovementFor] = useState(null); // account object or null
  const [historyFor, setHistoryFor] = useState(null); // account object or null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="text-xs" style={{ color: colors.textDim }}>
          Suis le solde de tes comptes mobile money, bancaires ou en liquide. Chaque mouvement peut, si tu le souhaites, être aussi compté dans ton suivi budgétaire (Épargne/Objectifs).
        </div>
      </div>

      {accounts.length === 0 ? (
        <Card title="Aucun compte pour l'instant">
          <EmptyState text="Ajoute ton premier compte (mobile money, banque, liquide…) pour commencer à suivre son solde." />
          <button onClick={() => setShowAddAccount(true)} className="mt-3 flex items-center gap-1.5 text-sm font-semibold" style={{ color: colors.gold }}>
            <Plus size={15} /> Ajouter un compte
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              balance={accountBalance(movements, acc.id)}
              onAddMovement={() => setMovementFor(acc)}
              onHistory={() => setHistoryFor(acc)}
              onRename={(name) => onRenameAccount(acc.id, name)}
              onDelete={() => onDeleteAccount(acc.id)}
            />
          ))}
          <button
            onClick={() => setShowAddAccount(true)}
            className="rounded-xl p-4 sm:p-5 flex items-center justify-center gap-2 text-sm font-medium"
            style={{ border: `1.5px dashed ${colors.line}`, color: colors.textDim, minHeight: 120 }}
          >
            <Plus size={16} /> Ajouter un compte
          </button>
        </div>
      )}

      {showAddAccount && (
        <AddAccountModal onClose={() => setShowAddAccount(false)} onAdd={(name, type) => { onAddAccount(name, type); setShowAddAccount(false); }} />
      )}

      {movementFor && (
        <MovementModal
          account={movementFor}
          accounts={accounts}
          data={data}
          onClose={() => setMovementFor(null)}
          onSubmit={(m) => { onAddMovement(m); setMovementFor(null); }}
        />
      )}

      {historyFor && (
        <AccountHistoryModal
          account={historyFor}
          accounts={accounts}
          movements={movements.filter((m) => m.account_id === historyFor.id || m.target_account_id === historyFor.id)}
          onClose={() => setHistoryFor(null)}
          onDeleteMovement={onDeleteMovement}
        />
      )}
    </div>
  );
}

function AccountCard({ account, balance, onAddMovement, onHistory, onRename, onDelete }) {
  const { colors } = useContext(ThemeContext);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(account.name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="rounded-xl p-4 sm:p-5 flex flex-col gap-3" style={{ background: colors.surface, border: `1px solid ${colors.line}` }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">{ACCOUNT_TYPE_ICONS[account.type] || "💼"}</span>
          {editing ? (
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              onBlur={() => { setEditing(false); if (name.trim() && name !== account.name) onRename(name.trim()); }}
              onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
              autoFocus
              className="text-sm font-medium bg-transparent min-w-0"
              style={{ color: colors.text, border: "none", outline: "none" }}
            />
          ) : (
            <span className="text-sm font-medium truncate" style={{ color: colors.text }}>{account.name}</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setEditing(true)} style={{ color: colors.textDim }}><Pencil size={13} /></button>
          <button onClick={() => setConfirmDelete(true)} style={{ color: colors.textDim }}><Trash2 size={13} /></button>
        </div>
      </div>

      <div className="num text-2xl font-semibold" style={{ color: balance < 0 ? colors.coral : colors.text }}>{fmt(balance)}</div>
      <div className="text-[11px]" style={{ color: colors.textDim }}>{ACCOUNT_TYPES.find((t) => t.value === account.type)?.label || "Autre"}</div>

      <div className="flex gap-2 mt-1">
        <button onClick={onAddMovement} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold" style={{ background: colors.gold, color: colors.ink }}>
          <Plus size={13} /> Mouvement
        </button>
        <button onClick={onHistory} className="px-3 py-2 rounded-md text-xs font-medium" style={{ background: colors.surface2, color: colors.text }}>
          Historique
        </button>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-5" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-xs rounded-xl p-5" style={{ background: colors.surface, border: `1px solid ${colors.line}` }}>
            <div className="text-sm mb-4" style={{ color: colors.text }}>
              Supprimer le compte « {account.name} » ? Tous ses mouvements seront aussi supprimés (les transactions budgétaires liées resteront, sauf si tu les supprimes depuis l'historique).
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-md text-sm font-medium" style={{ background: colors.surface2, color: colors.text }}>Annuler</button>
              <button onClick={() => { onDelete(); setConfirmDelete(false); }} className="flex-1 py-2 rounded-md text-sm font-semibold" style={{ background: colors.coral, color: "#fff" }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddAccountModal({ onClose, onAdd }) {
  const { colors } = useContext(ThemeContext);
  const [name, setName] = useState("");
  const [type, setType] = useState("mobile_money");

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-sm rounded-xl p-5" style={{ background: colors.surface, border: `1px solid ${colors.line}` }}>
        <div className="flex items-center justify-between mb-4">
          <span className="disp text-lg" style={{ color: colors.text }}>Nouveau compte</span>
          <button onClick={onClose} style={{ color: colors.textDim }}><X size={18} /></button>
        </div>
        <div className="flex flex-col gap-3">
          <Field label="Nom du compte">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Orange Money" className="w-full" style={{ background: colors.surface2, border: `1px solid ${colors.line}`, borderRadius: 6, padding: "7px 10px", color: colors.text, fontSize: 13.5, outline: "none" }} />
          </Field>
          <Field label="Type de compte">
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full" style={{ background: colors.surface2, border: `1px solid ${colors.line}`, borderRadius: 6, padding: "7px 10px", color: colors.text, fontSize: 13.5, outline: "none" }}>
              {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <button
            onClick={() => name.trim() && onAdd(name.trim(), type)}
            disabled={!name.trim()}
            className="mt-1 py-2.5 rounded-md text-sm font-semibold"
            style={{ background: name.trim() ? colors.gold : colors.surface2, color: name.trim() ? colors.ink : colors.textDim }}
          >
            Créer le compte
          </button>
        </div>
      </div>
    </div>
  );
}

function MovementModal({ account, accounts, data, onClose, onSubmit }) {
  const { colors } = useContext(ThemeContext);
  const [type, setType] = useState("depot");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr());
  const [comment, setComment] = useState("");
  const [targetAccountId, setTargetAccountId] = useState("");
  // Dépôt : nature de l'argent
  const [depositKind, setDepositKind] = useState("epargne"); // epargne | revenu | transit
  const [depositEpargneGroup, setDepositEpargneGroup] = useState("Épargne");
  const [depositEpargneLabel, setDepositEpargneLabel] = useState("");
  const [depositRevenuLabel, setDepositRevenuLabel] = useState("");
  // Retrait : lien optionnel
  const [linkEnabled, setLinkEnabled] = useState(false);
  const [linkGroup, setLinkGroup] = useState("Épargne");
  const [linkLabel, setLinkLabel] = useState("");
  const [error, setError] = useState("");

  const otherAccounts = accounts.filter((a) => a.id !== account.id);
  const epargneLabelOptions = (data[depositEpargneGroup] || []).map((r) => r.name);
  const revenuLabelOptions = (data.Revenus || []).map((r) => r.name);
  const retraitLabelOptions = (data[linkGroup] || []).map((r) => r.name);

  const submit = () => {
    if (!amount || Number(amount) <= 0) { setError("Indique un montant positif."); return; }
    if (type === "transfert" && !targetAccountId) { setError("Choisis un compte de destination."); return; }
    if (type === "depot" && depositKind === "epargne" && !depositEpargneLabel) { setError("Choisis l'intitulé où ranger ce dépôt."); return; }
    if (type === "depot" && depositKind === "revenu" && !depositRevenuLabel) { setError("Choisis l'intitulé de revenu correspondant."); return; }
    if (type === "retrait" && linkEnabled && !linkLabel) { setError("Choisis un intitulé à lier, ou décoche l'option."); return; }
    onSubmit({
      accountId: account.id, type, amount, date, comment, targetAccountId,
      depositKind,
      linkGroup: type === "depot" ? depositEpargneGroup : linkGroup,
      linkLabel: type === "depot" ? (depositKind === "revenu" ? depositRevenuLabel : depositEpargneLabel) : linkLabel,
      linkEnabled: type === "retrait" ? linkEnabled : false,
    });
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-sm rounded-xl p-5" style={{ background: colors.surface, border: `1px solid ${colors.line}` }}>
        <div className="flex items-center justify-between mb-4">
          <span className="disp text-lg" style={{ color: colors.text }}>Mouvement — {account.name}</span>
          <button onClick={onClose} style={{ color: colors.textDim }}><X size={18} /></button>
        </div>

        <div className="flex rounded-md overflow-hidden mb-4" style={{ border: `1px solid ${colors.line}` }}>
          {[
            { v: "depot", l: "Dépôt", Icon: ArrowUpCircle },
            { v: "retrait", l: "Retrait", Icon: ArrowDownCircle },
            { v: "transfert", l: "Transfert", Icon: ArrowLeftRight },
          ].map(({ v, l, Icon }) => (
            <button
              key={v}
              onClick={() => setType(v)}
              className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium"
              style={{ background: type === v ? colors.gold : "transparent", color: type === v ? colors.ink : colors.textDim }}
            >
              <Icon size={13} /> {l}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {type === "transfert" && (
            <Field label="Vers quel compte ?">
              <select value={targetAccountId} onChange={(e) => setTargetAccountId(e.target.value)} className="w-full" style={{ background: colors.surface2, border: `1px solid ${colors.line}`, borderRadius: 6, padding: "7px 10px", color: colors.text, fontSize: 13.5, outline: "none" }}>
                <option value="">Choisir…</option>
                {otherAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Montant (F CFA)">
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="w-full num" style={{ background: colors.surface2, border: `1px solid ${colors.line}`, borderRadius: 6, padding: "7px 10px", color: colors.text, fontSize: 13.5, outline: "none" }} />
          </Field>
          <Field label="Date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full" style={{ background: colors.surface2, border: `1px solid ${colors.line}`, borderRadius: 6, padding: "7px 10px", color: colors.text, fontSize: 13.5, outline: "none" }} />
          </Field>
          <Field label="Commentaire">
            <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optionnel" className="w-full" style={{ background: colors.surface2, border: `1px solid ${colors.line}`, borderRadius: 6, padding: "7px 10px", color: colors.text, fontSize: 13.5, outline: "none" }} />
          </Field>

          {type === "depot" && (
            <div className="p-3 rounded-lg flex flex-col gap-2" style={{ background: colors.surface2 }}>
              <div className="text-xs font-medium flex items-center gap-1.5" style={{ color: colors.text }}><Link2 size={13} /> D'où vient cet argent ?</div>

              <label className="flex items-start gap-2 text-xs p-2 rounded-md cursor-pointer" style={{ background: depositKind === "epargne" ? colors.surface3 : "transparent", color: colors.text }}>
                <input type="radio" checked={depositKind === "epargne"} onChange={() => setDepositKind("epargne")} className="mt-0.5" />
                <span><span className="font-medium">Je range une partie de mon revenu</span><br /><span style={{ color: colors.textDim }}>Ce montant sera déduit de ton solde disponible (épargne/objectif).</span></span>
              </label>
              {depositKind === "epargne" && (
                <div className="flex flex-col gap-2 pl-6">
                  <select value={depositEpargneGroup} onChange={(e) => { setDepositEpargneGroup(e.target.value); setDepositEpargneLabel(""); }} className="w-full text-xs" style={{ background: colors.surface3, border: `1px solid ${colors.line}`, borderRadius: 6, padding: "6px 8px", color: colors.text, outline: "none" }}>
                    {SPLIT_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <select value={depositEpargneLabel} onChange={(e) => setDepositEpargneLabel(e.target.value)} className="w-full text-xs" style={{ background: colors.surface3, border: `1px solid ${colors.line}`, borderRadius: 6, padding: "6px 8px", color: colors.text, outline: "none" }}>
                    <option value="">Choisir un intitulé…</option>
                    {epargneLabelOptions.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              )}

              <label className="flex items-start gap-2 text-xs p-2 rounded-md cursor-pointer" style={{ background: depositKind === "revenu" ? colors.surface3 : "transparent", color: colors.text }}>
                <input type="radio" checked={depositKind === "revenu"} onChange={() => setDepositKind("revenu")} className="mt-0.5" />
                <span><span className="font-medium">Je reçois un revenu</span><br /><span style={{ color: colors.textDim }}>S'ajoute à ton solde revenu (ex: salaire versé directement, argent reçu).</span></span>
              </label>
              {depositKind === "revenu" && (
                <div className="pl-6">
                  <select value={depositRevenuLabel} onChange={(e) => setDepositRevenuLabel(e.target.value)} className="w-full text-xs" style={{ background: colors.surface3, border: `1px solid ${colors.line}`, borderRadius: 6, padding: "6px 8px", color: colors.text, outline: "none" }}>
                    <option value="">Choisir un intitulé…</option>
                    {revenuLabelOptions.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              )}

              <label className="flex items-start gap-2 text-xs p-2 rounded-md cursor-pointer" style={{ background: depositKind === "transit" ? colors.surface3 : "transparent", color: colors.text }}>
                <input type="radio" checked={depositKind === "transit"} onChange={() => setDepositKind("transit")} className="mt-0.5" />
                <span><span className="font-medium">Cet argent ne m'appartient pas</span><br /><span style={{ color: colors.textDim }}>Il ne fait que transiter — aucun impact sur tes totaux, juste une trace dans Transactions.</span></span>
              </label>
            </div>
          )}

          {type === "retrait" && (
            <div className="p-3 rounded-lg" style={{ background: colors.surface2 }}>
              <label className="flex items-center gap-2 text-xs font-medium" style={{ color: colors.text }}>
                <input type="checkbox" checked={linkEnabled} onChange={(e) => setLinkEnabled(e.target.checked)} />
                <Link2 size={13} /> Compter aussi dans le suivi budgétaire
              </label>
              {linkEnabled ? (
                <div className="flex flex-col gap-2 mt-2.5">
                  <select value={linkGroup} onChange={(e) => { setLinkGroup(e.target.value); setLinkLabel(""); }} className="w-full text-xs" style={{ background: colors.surface3, border: `1px solid ${colors.line}`, borderRadius: 6, padding: "6px 8px", color: colors.text, outline: "none" }}>
                    {SPLIT_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <select value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} className="w-full text-xs" style={{ background: colors.surface3, border: `1px solid ${colors.line}`, borderRadius: 6, padding: "6px 8px", color: colors.text, outline: "none" }}>
                    <option value="">Choisir un intitulé…</option>
                    {retraitLabelOptions.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              ) : (
                <div className="text-[11px] mt-1" style={{ color: colors.textDim }}>Sans lien, ce retrait apparaîtra quand même dans Transactions (catégorie "Compte"), sans impacter tes totaux.</div>
              )}
            </div>
          )}

          {type === "transfert" && (
            <div className="text-[11px]" style={{ color: colors.textDim }}>Ce transfert sera visible dans Transactions (catégorie "Compte"), sans impacter tes totaux.</div>
          )}

          {error && <div className="text-xs" style={{ color: colors.coral }}>{error}</div>}

          <button onClick={submit} className="mt-1 py-2.5 rounded-md text-sm font-semibold" style={{ background: colors.gold, color: colors.ink }}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountHistoryModal({ account, accounts, movements, onClose, onDeleteMovement }) {
  const { colors } = useContext(ThemeContext);
  const accName = (id) => accounts.find((a) => a.id === id)?.name || "?";

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-lg rounded-xl p-5 max-h-[80vh] overflow-y-auto" style={{ background: colors.surface, border: `1px solid ${colors.line}` }}>
        <div className="flex items-center justify-between mb-4">
          <span className="disp text-lg" style={{ color: colors.text }}>Historique — {account.name}</span>
          <button onClick={onClose} style={{ color: colors.textDim }}><X size={18} /></button>
        </div>
        {movements.length === 0 ? (
          <EmptyState text="Aucun mouvement enregistré pour ce compte." />
        ) : (
          <div className="flex flex-col gap-2">
            {movements.map((m) => {
              const isOut = m.account_id === account.id;
              const label = m.type === "transfert"
                ? (isOut ? `Transfert vers ${accName(m.target_account_id)}` : `Transfert depuis ${accName(m.account_id)}`)
                : m.type === "depot" ? "Dépôt" : "Retrait";
              const sign = m.type === "depot" || (m.type === "transfert" && !isOut) ? "+" : "-";
              const color = sign === "+" ? colors.mint : colors.coral;
              return (
                <div key={m.id} className="flex items-center justify-between gap-2 pb-2" style={{ borderBottom: `1px solid ${colors.line}` }}>
                  <div className="min-w-0">
                    <div className="text-sm font-medium" style={{ color: colors.text }}>{label}</div>
                    <div className="text-[11px]" style={{ color: colors.textDim }}>
                      {formatDateFR(m.date)}{m.comment ? ` — ${m.comment}` : ""}{m.linked_label ? ` · 🔗 ${m.linked_group} > ${m.linked_label}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="num text-sm font-semibold" style={{ color }}>{sign}{fmt(m.amount)}</span>
                    <button onClick={() => onDeleteMovement(m)} style={{ color: colors.textDim }}><Trash2 size={13} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
