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

## Mise à jour : frais sur retraits et transferts

Un champ **Frais (optionnel)** apparaît désormais pour les retraits et transferts (pas les dépôts — généralement gratuits sur mobile money/banque). Le frais est toujours déduit du compte source, en plus du montant principal ; pour un transfert, le compte destinataire ne reçoit que le montant principal. Tu peux, si tu le souhaites, compter ces frais comme une vraie dépense budgétaire (ex: "Frais bancaires").

### Configuration requise dans Supabase

Exécute ceci une seule fois dans le SQL Editor :

```sql
alter table account_movements add column if not exists fee numeric default 0;
alter table account_movements add column if not exists linked_fee_transaction_id uuid;
```



Les **retraits** suivent maintenant la même logique que les dépôts, avec 3 natures possibles :
1. **Je reprends de l'épargne mise de côté** → lié à Épargne/Objectifs (annule une partie de ce que tu avais rangé)
2. **Je paie une dépense** *(nouveau)* → lié à Dépenses/Factures/Crédits (enregistre une vraie dépense, ex: paiement de la facture d'électricité depuis l'argent mis de côté)
3. **Aucun des deux** → aucun impact sur tes totaux, juste une trace dans Transactions (catégorie "Compte")



### Dépôts sur un compte : 3 choix clairs
Quand tu enregistres un **dépôt**, tu choisis maintenant sa nature :
1. **Je range une partie de mon revenu** → déduit de ton solde disponible (lié à Épargne/Objectifs, comme avant)
2. **Je reçois un revenu** → s'ajoute à ton solde revenu (lié à un intitulé Revenus) — utile quand un employeur ou un tiers te paie directement sur ce compte
3. **Cet argent ne m'appartient pas** → aucun impact sur tes totaux (argent en transit pour quelqu'un d'autre)

### Trace systématique
Désormais, **toute opération sur un compte** (dépôt, retrait, transfert) laisse une trace dans l'onglet Transactions :
- Si elle est liée à Revenus/Épargne/Objectifs → c'est cette transaction-là qui apparaît
- Sinon (transit, retrait non lié, transfert) → une transaction neutre de type **"Compte"** est créée, visible et filtrable dans Transactions, mais qui ne compte dans aucun total ni graphique



### Ce qui a été ajouté
Un onglet **Comptes** permet de suivre le solde de plusieurs comptes (mobile money, bancaire, liquide, autre) :
- Crée autant de comptes que tu veux, avec un nom et un type
- Enregistre des **dépôts**, **retraits**, ou des **transferts** entre tes propres comptes (les transferts ne comptent ni comme gain ni comme dépense — juste un déplacement)
- Pour un dépôt ou un retrait, tu peux cocher **"Compter aussi dans le suivi budgétaire"** et choisir à ce moment précis (pas à la création du compte) un intitulé Épargne ou Objectifs — ça crée automatiquement la transaction correspondante, prise en compte dans Suivi réel et le tableau de bord. Si tu ne coches rien, le mouvement reste uniquement dans Comptes.
- Historique par compte, avec suppression (qui supprime aussi la transaction liée si elle existe)

### Configuration requise dans Supabase

Ce nouvel onglet a besoin de deux nouvelles tables. Va dans le SQL Editor de ton projet Supabase et exécute :

```sql
create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  type text not null default 'autre',
  created_at timestamp with time zone default now()
);

create table account_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  account_id uuid references accounts not null,
  target_account_id uuid references accounts,
  type text not null,
  amount numeric not null,
  date date not null,
  comment text,
  linked_group text,
  linked_label text,
  linked_transaction_id uuid,
  created_at timestamp with time zone default now()
);

alter table accounts enable row level security;
alter table account_movements enable row level security;

create policy "Chacun gère ses propres comptes"
  on accounts for all using (auth.uid() = user_id);

create policy "Chacun gère ses propres mouvements"
  on account_movements for all using (auth.uid() = user_id);
```

Sans cette étape, l'onglet Comptes restera vide (l'application affiche une liste vide plutôt qu'une erreur, mais rien ne se sauvegardera).



Dans Transactions, un montant **négatif** est maintenant accepté pour les types Épargne et Objectifs (pour représenter un retrait sur un compte mobile money par exemple). Une fenêtre de confirmation apparaît avant l'enregistrement. Dans l'historique, ces retraits s'affichent en rouge avec la mention "↓ Retrait", et les dépôts (montants positifs) sur ces mêmes catégories sont marqués "↑". Pour tous les autres types (Dépenses, Factures, etc.), le montant doit rester positif.



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
