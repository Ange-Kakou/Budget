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

## Base de données (Supabase)

L'application est maintenant connectée à une base de données en ligne (Supabase). Tes données sont liées à ton compte (email + mot de passe) et accessibles depuis n'importe quel appareil.

Les clés de connexion sont déjà dans `src/supabaseClient.js` — c'est normal et sans risque, la clé "anon public" est faite pour être visible dans le code d'une application.

Si ce n'est pas déjà fait, exécute le script SQL fourni dans l'éditeur SQL de ton projet Supabase (onglet "SQL Editor") pour créer les tables `budget_items` et `transactions` avant la première utilisation.

Après avoir redéployé sur Vercel (Deployments > Redeploy), crée ton compte directement depuis l'application avec le bouton "Créer un compte".

## Mise à jour : onglet Suivi réel, objectifs, diaporama de bienvenue

- **Onglet "Suivi réel"** : compare, libellé par libellé, ce que tu avais prévu (Budget) à ce que tes Transactions montrent réellement — avec un indicateur coloré (✓ vert / ⚠ rouge / — neutre).
- **Édition des montants** : dans l'onglet Budget, il faut désormais **double-cliquer** sur une case pour la modifier (fini l'incrémentation accidentelle au survol).
- **Sélecteur de mois** : une option "Année 2026 (tous les mois)" a été ajoutée en plus des 12 mois — pratique pour une vue annuelle. Les années suivantes (2027, 2028…) pourront être ajoutées plus tard en étendant ce même principe.
- **Données de départ vides** : une nouvelle inscription démarre avec les libellés déjà en place mais tous les montants à zéro.
- **Diaporama de bienvenue** : s'affiche automatiquement à la première visite (ou après avoir vidé les données du navigateur), explique les 4 onglets. Pas de vraie vidéo (hors de portée ici), mais un diaporama interactif similaire dans l'esprit.

### Important : ton compte a déjà des données de test

Comme demandé, les nouvelles inscriptions démarrent vides — mais ton compte à toi a déjà les anciennes valeurs de démonstration enregistrées dans Supabase. Pour repartir à zéro sur *ton* compte :
1. Va dans Supabase → Table Editor → table `budget_items`
2. Sélectionne toutes les lignes qui t'appartiennent et supprime-les (ou filtre par `user_id`)
3. Recharge l'application : elle réinsérera automatiquement les libellés avec des montants à zéro
