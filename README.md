# Suivi-temps-travail — SICAAP

Deux applications web internes pour le service appro/tarifs de la SICAAP : suivi du temps de travail et des tâches d'un côté, suivi des fournisseurs de l'autre. Chaque application tient dans un seul fichier HTML, sans build, sans serveur applicatif. Les données vivent dans Supabase. L'hébergement se fait via GitHub Pages.

## Sommaire

1. [Les deux applications](#1-les-deux-applications)
2. [Stack technique](#2-stack-technique)
3. [Déploiement](#3-déploiement)
4. [Fichiers du dépôt](#4-fichiers-du-dépôt)
5. [Documentation détaillée](#5-documentation-détaillée)

---

## 1. Les deux applications

### `index.html` — Suivi de charge & tâches

Suivi du temps passé (production, charge indirecte, projets) et gestion des tâches personnelles.

- **Saisie** : pointeuse (début/pause/fin de journée), saisie ultra-rapide par préréglages ou texte libre, gestion des écarts entre le temps pointé et le temps catégorisé.
- **Tableau de bord** : répartition du temps par catégorie (camembert, barres), temps consacrés à la production vs à l'indirect, tendances par semaine/mois, comparaison à la période précédente.
- **Tâches** : trois vues complémentaires — liste groupée par catégorie, tableau façon Kanban (une colonne par catégorie, glisser-déposer), et matrice d'Eisenhower (urgent/important). Terminer une tâche peut directement journaliser le temps passé dessus dans la Saisie.

Données Supabase (tables `entries`, `app_settings`, `day_logs`, `projects`, `tasks`), sans table dédiée aux schémas SQL versionnés dans ce dépôt — le schéma a été posé directement dans Supabase.

### `Fournisseurs.html` — Suivi fournisseurs SICAAP

Suivi des versions tarifaires fournisseurs, du circuit de traitement interne (réception → responsable → SAP → diffusion), des conditions commerciales et de l'historique des échanges. Documentation complète : [`README_Fournisseurs.md`](./README_Fournisseurs.md).

Données Supabase (tables `fournisseurs`, `tarifs`, `conditions`, `journal`, `conditions_nationales`).

Les deux applications partagent le **même projet Supabase**, mais des tables distinctes — aucun recoupement de données entre elles.

---

## 2. Stack technique

- **Aucun build, aucun `npm install`.** Chaque page HTML embarque React 18 et ReactDOM (UMD, minifiés, collés dans des balises `<script>`) ainsi que Babel Standalone. Le code applicatif (JSX) est stocké dans un `<script type="text/plain" id="app-src">`, transpilé dans le navigateur au chargement, puis exécuté.
- **Supabase** (Postgres + Auth) comme seul backend. Connexion via `@supabase/supabase-js`, clé publique (`anon`) intégrée dans la page — la sécurité repose sur les règles RLS (Row Level Security) côté base, pas sur le secret de la clé.
- **PWA** : chaque application a son `manifest.json`, ses icônes et partage le même service worker (`sw.js`) pour fonctionner hors ligne et s'installer sur mobile (« Ajouter à l'écran d'accueil »).

## 3. Déploiement

1. Pousser sur la branche principale (`main`).
2. GitHub Pages sert directement les fichiers du dépôt — pas d'étape de build.
3. Adresses :
   - `https://<compte>.github.io/<depot>/index.html` (ou `/` si configuré en page d'accueil)
   - `https://<compte>.github.io/<depot>/Fournisseurs.html`

Une page qui appelle Supabase ne fonctionne pas ouverte en local depuis l'explorateur de fichiers (le navigateur bloque les appels réseau depuis `file://`). Toujours tester depuis l'adresse `https://…` publiée.

---

## 4. Fichiers du dépôt

| Fichier / dossier | Rôle |
|---|---|
| `index.html` | Application **Suivi de charge & tâches**, en service |
| `Fournisseurs.html` | Application **Suivi fournisseurs SICAAP**, en service |
| `README_Fournisseurs.md` | Documentation détaillée de l'application fournisseurs |
| `manifest.json`, `icons/` | PWA de `index.html` |
| `manifest-fournisseurs.json`, `icons-fournisseurs/` | PWA de `Fournisseurs.html` |
| `sw.js` | Service worker partagé par les deux applications |
| `Tache.html` | Redirection vers `index.html#taches` — ancien outil de tâches, fusionné depuis dans `index.html` |

Fichiers présents dans le dépôt mais **non liés aux deux applications ci-dessus** (anciennes versions ou projets sans rapport, à vérifier avant toute suppression) :

| Fichier / dossier | Remarque |
|---|---|
| `index (1).html` | Ancienne copie de `index.html`, non utilisée |
| `Fournisseur.html` (singulier) | Ancienne version de `Fournisseurs.html`, non utilisée |
| `budget.html` | Application personnelle sans rapport avec la SICAAP, renvoie vers des fichiers absents du dépôt |
| `Tache/`, `Taches` | Fichiers résiduels d'anciens imports, vides ou obsolètes |

## 5. Documentation détaillée

- Application fournisseurs : [`README_Fournisseurs.md`](./README_Fournisseurs.md) — installation, reprise d'historique, mode opératoire quotidien, règles de gestion, import/export, structure des données, import annuel des conditions nationales IVRPM, dépannage.
- Application Suivi de charge & tâches : pas de documentation dédiée pour l'instant — l'interface est auto-descriptive (libellés, info-bulles) et les catégories/sous-catégories sont définies dans le code (`const CATS` en tête du bloc applicatif).
