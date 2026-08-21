import { createClient } from '@supabase/supabase-js'

// ⚠️ Les clés sont maintenant dans .env (fichier ignoré par Git)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Vérification au démarrage (évite les erreurs silencieuses)
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '⚠️ Clés Supabase manquantes ! Vérifiez votre fichier .env ou les variables Vercel'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)