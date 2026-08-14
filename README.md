# Mon Budget

Application web de suivi de budget personnel (Tableau de bord, Transactions, Budget mensuel).

## Déployer en ligne (recommandé, sans rien installer sur ton ordinateur)

1. Décompresse ce dossier.
2. Crée un compte sur https://github.com puis un nouveau dépôt (ex: `budget-personnel`).
3. Dans ce dépôt, utilise "Add file > Upload files" et dépose **tous les fichiers et dossiers** de ce projet (garde la structure telle quelle : `src/`, `package.json`, etc.).
4. Crée un compte sur https://vercel.com en te connectant avec GitHub.
5. Clique sur "Add New > Project", choisis ton dépôt `budget-personnel", puis "Deploy".
6. Après 1-2 minutes, Vercel te donne un lien du type `budget-personnel.vercel.app` — c'est ton application, en ligne.

## Tester sur ton ordinateur avant de déployer (optionnel)

Si tu as Node.js installé (https://nodejs.org) :

```
npm install
npm run dev
```

Puis ouvre le lien affiché dans le terminal (généralement http://localhost:5173).

## Note sur les données

Les données sont sauvegardées dans le navigateur (localStorage) : elles restent présentes tant que tu utilises le même navigateur sur le même appareil. Pour retrouver tes données sur plusieurs appareils, il faudra une vraie base de données en ligne (ex: Supabase) — étape possible dans un second temps.
