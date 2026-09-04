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

## Mise à jour : graphiques circulaires, tri des transactions, renommage propagé

- **Objectif de l'année** et ses mini-graphiques par intitulé sont maintenant des **cercles/donuts** (% atteint) au lieu de courbes.
- **Transactions** : l'historique est trié de la plus récente à la plus ancienne ; pour une même date, l'heure de saisie départage l'ordre.
- **Budget** : renommer un libellé existant (clic dans le champ, modifier, puis cliquer ailleurs) met automatiquement à jour toutes les transactions déjà enregistrées sous l'ancien nom — et donc l'onglet Suivi réel s'aligne aussi, sans action supplémentaire.



La fenêtre de répartition du surplus affiche maintenant un champ **Date de la répartition**, pré-rempli avec la date du jour, modifiable avant de confirmer. Les transactions créées utilisent cette date.



Le vrai souci : quand aucun montant estimé n'était encore défini pour tes intitulés Épargne/Objectifs (ce qui est le cas par défaut), l'écran "Répartir automatiquement" affichait une liste vide et ne menait nulle part clairement. Corrections :
- Si aucun montant estimé n'est défini, l'application passe désormais directement à l'étape "choisis où affecter le surplus" (répartition égale entre les intitulés cochés), au lieu d'un écran vide trompeur.
- Chaque transaction créée porte maintenant un **commentaire distinct** précisant l'intitulé concerné et la raison (ex: "Répartition du surplus — Vacances (montant choisi manuellement)").
- Une confirmation visuelle apparaît une fois les transactions bien créées, avant fermeture de la fenêtre.



### Correctif important : libellés en double
La cause a été trouvée : chaque modification déclenchait un "tout supprimer, tout réinsérer" en base — si deux synchronisations se chevauchaient, ça dupliquait les lignes. Le système utilise maintenant un identifiant stable par ligne (upsert), qui élimine ce risque à la racine. **Au prochain chargement de l'application, les doublons déjà présents dans ta base seront automatiquement détectés et supprimés** — aucune manipulation de ta part n'est nécessaire.

### Transactions
- Filtres par Date, Type, Catégorie, Commentaire et Montant, au-dessus de l'historique
- Les dates s'affichent désormais au format `23-08-2026`

### Suivi réel
La ligne "Total" de chaque catégorie a maintenant un encadré doré distinct, avec un texte plus grand — elle se démarque clairement des lignes de libellés individuels.



### Graphiques du tableau de bord basés sur le réel
Tous les graphiques du Tableau de bord (répartition des dépenses, revenus vs dépenses sur 12 mois, évolution du solde cumulé, progression annuelle des objectifs et ses mini-graphiques par intitulé) utilisent maintenant les montants **réels** issus des Transactions, et non plus les estimations du Budget. Seul le cercle "Objectif du mois" garde volontairement l'estimé comme cible à atteindre (c'est la référence, pas une mesure).

### Nouveautés
- **Page d'accueil** : Revenus, Dépenses, Épargne affichent maintenant les montants **réels** (calculés depuis Transactions), plus un 4e indicateur **Objectif**.
- **Transactions** : le type "Objectifs" est sélectionnable, la date se met par défaut à aujourd'hui, le formulaire se réinitialise après ajout (sauf la date), et un message apparaît si type/catégorie/montant manque.
- **Suivi réel** : chaque catégorie affiche maintenant aussi un total global (Estimé vs Réel), la catégorie Objectifs y figure, et le sens des couleurs pour Dépenses/Factures a été inversé pour rester intuitif (positif+vert = favorable, partout).
- **Bilan du mois** : en bas de l'onglet Suivi réel, un récapitulatif Revenus réels − toutes les charges réelles, avec un bouton "Répartir le surplus" (automatique ou manuel) qui crée les transactions d'épargne/objectifs correspondantes.
- **Verrouillage de l'application** : code à 4 chiffres + durée d'inactivité, dans le menu profil.
- **Revoir les diapos** : disponible dans le menu profil.
- **Nous contacter** : ouvre un brouillon dans ta messagerie (adresse à personnaliser, voir ci-dessous).
- **Suppression de compte** : envoie un code à 6 chiffres par email, supprime toutes les données une fois confirmé.

### Configuration requise dans Supabase

Pour que le code de confirmation à 6 chiffres fonctionne (suppression de compte) :
1. Va dans Authentication > Email Templates > "Magic Link"
2. Vérifie que le modèle contient bien `{{ .Token }}` (le code à 6 chiffres) et pas seulement un lien — sinon édite le modèle pour l'inclure

### Personnalisation à faire

Dans `src/App.jsx`, cherche `CONTACT_EMAIL` et remplace `support@monbudget.app` par ta vraie adresse de contact.

### Limite connue : suppression de compte

Le bouton "Supprimer le compte" efface toutes tes données (Budget, Transactions) après vérification du code — mais le compte de connexion lui-même (email + mot de passe) reste techniquement présent dans Supabase, car sa suppression complète nécessite un accès serveur que l'application seule n'a pas. Pour le supprimer aussi : va dans Supabase → Authentication → Users → sélectionne le compte → Delete.
