# 🌰 Cashew 2.0 — Dépenses & Budget

Application web de suivi budgétaire **inspirée de Cashew** (*Expense Budget Tracker*) :
vert cajou, cartes très arrondies, thème sombre, couleurs d'accent personnalisables et
bouton « + » omniprésent.

> Application de démonstration non affiliée — les données restent **100 % en local**
> dans le stockage de votre navigateur (aucun serveur, aucun compte).

## ✨ Fonctionnalités

- **Accueil** : portefeuilles (multi-devises), dépenses du mois avec barre de
  progression et marqueur « Aujourd'hui », courbe d'évolution du solde,
  abonnements à venir (avec bouton *Payer*), transactions récentes.
- **Transactions** : navigation par mois, résumé dépenses / revenus / net
  (cliquable pour filtrer), recherche, filtres par catégorie, groupement par jour.
- **Budgets** : budget global avec anneau de progression, budgets par catégorie
  (hebdo / mensuel / annuel / libre), onglet **Statistiques** : bilan mensuel,
  donut par catégorie, comparatif 6 mois, plus grosses dépenses.
- **Plus** : thème clair / sombre / système, 8 couleurs d'accent, devise principale
  (15 devises, conversion indicative), portefeuilles, catégories personnalisées,
  abonnements récurrents (avec débit automatique optionnel), export / import JSON,
  données de démonstration.
- **Données de démo** : ~4 mois de transactions réalistes pré-chargées au premier
  lancement (réinitialisables depuis *Plus → Données*).

## 🚀 Démarrer

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de production dans dist/
npm run preview  # sert le build de production
```

## 🧱 Stack

- [React 18](https://react.dev) + TypeScript
- [Vite 5](https://vitejs.dev)
- Zéro dépendance UI : graphiques (aire, donut, barres), feuilles modales et
  composants faits main, en SVG/CSS.
- Police [Figtree](https://fonts.google.com/specimen/Figtree) (repli système hors-ligne).

## 📁 Structure

```
src/
├── App.tsx               # coquille : onglets, thème, FAB
├── data/                 # devises, catégories par défaut, démo, accents
├── store/                # store (localStorage) + gestion des feuilles modales
├── utils/                # dates, argent, calculs (budgets, soldes, abonnements)
├── components/           # UI partagée + graphiques SVG
├── sheets/               # formulaires modaux (transaction, budget, etc.)
└── pages/                # Accueil, Transactions, Budgets, Plus
```
