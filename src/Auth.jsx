import React, { useState } from "react";
import { Wallet, Eye, EyeOff } from "lucide-react";
import { supabase } from "./supabaseClient";

const COLORS = {
  ink: "#0E211D",
  surface: "#15332C",
  surface2: "#1C4038",
  gold: "#C99A44",
  text: "#EFEAE0",
  textDim: "#9DB3AC",
  line: "#2A5148",
  coral: "#E2725B",
};

export default function Auth() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo("Compte créé. Vérifie ta boîte mail pour confirmer, puis connecte-toi.");
      }
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="w-full min-h-screen flex items-center justify-center px-5"
      style={{ background: COLORS.ink, color: COLORS.text, fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Inter:wght@400;500;600&display=swap');`}</style>
      <div className="w-full max-w-sm rounded-xl p-6" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: COLORS.gold }}>
            <Wallet size={18} color={COLORS.ink} strokeWidth={2.25} />
          </div>
          <span style={{ fontFamily: "'Fraunces', serif" }} className="text-xl">Mon Budget</span>
        </div>

        <div className="flex gap-1 mb-5 rounded-md p-1" style={{ background: COLORS.surface2 }}>
          <button
            onClick={() => setMode("signin")}
            className="flex-1 py-1.5 rounded text-sm font-medium"
            style={{ background: mode === "signin" ? COLORS.gold : "transparent", color: mode === "signin" ? COLORS.ink : COLORS.textDim }}
          >
            Connexion
          </button>
          <button
            onClick={() => setMode("signup")}
            className="flex-1 py-1.5 rounded text-sm font-medium"
            style={{ background: mode === "signup" ? COLORS.gold : "transparent", color: mode === "signup" ? COLORS.ink : COLORS.textDim }}
          >
            Créer un compte
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: COLORS.textDim }}>Email</span>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full" style={inputStyle}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: COLORS.textDim }}>Mot de passe</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full" style={{ ...inputStyle, paddingRight: 34 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                style={{ color: COLORS.textDim }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>

          {error && <div className="text-xs" style={{ color: COLORS.coral }}>{error}</div>}
          {info && <div className="text-xs" style={{ color: COLORS.gold }}>{info}</div>}

          <button
            type="submit" disabled={busy}
            className="mt-1.5 py-2.5 rounded-md text-sm font-semibold"
            style={{ background: COLORS.gold, color: COLORS.ink, opacity: busy ? 0.7 : 1 }}
          >
            {busy ? "Un instant…" : mode === "signin" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  background: COLORS.surface2, border: `1px solid ${COLORS.line}`, borderRadius: 6,
  padding: "8px 10px", color: COLORS.text, fontSize: 13.5, outline: "none",
};
