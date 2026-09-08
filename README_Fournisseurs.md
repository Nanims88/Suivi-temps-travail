# Suivi fournisseurs SICAAP

Application web de suivi des fournisseurs : versions tarifaires, circuit de traitement interne, conditions commerciales et historique des échanges. Page unique, sans serveur, données dans Supabase.

## Sommaire

1. [Ce que fait l'outil](#1-ce-que-fait-loutil)
2. [Installation](#2-installation)
3. [Reprise de l'historique](#3-reprise-de-lhistorique)
4. [Mode opératoire quotidien](#4-mode-opératoire-quotidien)
5. [Règles de gestion](#5-règles-de-gestion)
6. [Import et export](#6-import-et-export)
7. [Structure des données](#7-structure-des-données)
8. [Sauvegarde et dépannage](#8-sauvegarde-et-dépannage)

---

## 1. Ce que fait l'outil

Trois questions auxquelles il répond en un coup d'oeil :

- **Quel fournisseur dois-je relancer ?** Alerte trente jours avant l'échéance attendue, et signalement des tarifs en retard.
- **Quel tarif attend encore d'être diffusé ?** Liste des versions applicables ou imminentes non encore diffusées en magasin, avec leur avancement SAP.
- **Que s'est-il passé avec ce fournisseur ?** Chronologie complète des versions tarifaires et des échanges, sans limite d'ancienneté.

Il ne stocke pas de prix par article. Un tarif est suivi comme **une version datée, globale au fournisseur**.

---

## 2. Installation

### 2.1 Base de données

1. Dans Supabase, ouvrir **SQL Editor**, coller `schema.sql`, cliquer sur **Run**. Quatre tables sont créées.
2. Coller ensuite `schema_v2.sql` et faire **Run**. Dix colonnes de processus sont ajoutées à la table des tarifs.
3. Aller dans **Authentication > Add user > Create new user**, saisir une adresse et un mot de passe, cocher **Auto Confirm User**.
4. Désactiver **Allow new users to sign up**, sans désactiver le fournisseur Email lui-même. Le premier réglage ferme les inscriptions, le second couperait aussi votre propre connexion.

### 2.2 Clés

Les deux valeurs sont déjà renseignées en haut du bloc script de `Fournisseurs.html`. Elles se retrouvent au besoin par le bouton **Connect** du dashboard, ou dans **Project Settings > Data API** pour l'URL et **Settings > API Keys** pour la clé anon.

La clé anon est publique par conception. Ce qui protège les données, ce sont les règles RLS créées par `schema.sql`. La clé `service_role` ne doit jamais figurer dans ce fichier.

### 2.3 Mise en ligne

1. Déposer `Fournisseurs.html` dans le dépôt GitHub.
2. **Settings > Pages**, source sur la branche principale.
3. L'adresse est `https://votre-compte.github.io/votre-depot/Fournisseurs.html`, à la casse exacte, extension comprise.

Sur téléphone, ouvrir l'adresse puis « Ajouter à l'écran d'accueil ».

Un point à retenir : une page appelant une API ne peut pas être testée en ouvrant le fichier depuis le dossier Téléchargements. Le navigateur y bloque les appels réseau. Il faut passer par l'adresse en `https`.

---

## 3. Reprise de l'historique

Les fichiers du dossier `import` reprennent l'intégralité du fichier TARIFS existant, soit 1166 lignes réparties en 1030 versions tarifaires et 136 événements, pour 362 fiches fournisseur.

### 3.1 Ordre d'import, à respecter

| Rang | Fichier | Contenu |
|---|---|---|
| 1 | `1_fournisseurs.csv` | 362 fiches |
| 2 | `2_tarifs.csv` | 1030 versions tarifaires |
| 3 | `3_journal.csv` | 136 événements sans date d'application |

Les deux derniers se rattachent au premier par le code fournisseur. Les importer dans le désordre ferait rejeter toutes les lignes.

Pour chaque fichier : onglet **Données**, choisir la table de destination, sélectionner le fichier, cliquer sur **Importer**. Le rapport affiché indique les lignes enregistrées et, le cas échéant, les lignes rejetées avec leur numéro et le motif.

### 3.2 Codes fournisseurs

Les codes proviennent de l'export ERP. Sur 371 noms distincts relevés dans l'historique :

| Situation | Nombre | Traitement |
|---|---|---|
| Correspondance exacte avec l'ERP | 302 | Code ERP repris |
| Rapprochement automatique au delà de 93 % | 13 | Code ERP repris, à contrôler |
| Ressemblance insuffisante | 7 | Code provisoire `TMP_` |
| Absent du référentiel ERP | 49 | Code provisoire `TMP_` |

Le rapprochement a résolu au passage neuf doublons de saisie : AB 7 INDUSTRIES, AB7 INDUSTRIE et AB7 INDUSTRIES partagent le code 24938 et forment désormais une seule fiche, avec son historique complet.

Le détail figure dans `rapprochement_erp.txt`.

### 3.3 Ce qui reste à arbitrer

Les 56 fiches portant un code commençant par `TMP_` sont volontairement repérables. Deux cas :

- **Le fournisseur existe dans l'ERP** sous un nom trop différent pour être rapproché automatiquement. Ouvrir la fiche, cliquer sur **Modifier la fiche**, remplacer le code provisoire par le code ERP. L'historique suit, le rattachement interne ne reposant pas sur le code.
- **Le fournisseur n'existe pas dans l'ERP**, cas des références anciennes ou ponctuelles. Passer le statut de la fiche à **Clos** : elle disparaît alors des alertes tout en conservant son historique.

Pour retrouver ces fiches : onglet **Fournisseurs**, taper `TMP` dans la recherche.

### 3.4 Périodicités

La périodicité de chaque fournisseur a été calculée à partir de la médiane des intervalles réellement observés entre deux versions. Les fournisseurs n'ayant qu'une seule version reçoivent douze mois par défaut, valeur à ajuster au fil de l'eau.

---

## 4. Mode opératoire quotidien

### 4.1 Réception d'un nouveau tarif

1. Enregistrer le document source dans le dossier réseau des tarifs.
2. Ouvrir la fiche du fournisseur, cliquer sur **Enregistrer un tarif**.
3. Saisir au minimum la date d'application, la date de réception et l'état.
4. Compléter le circuit au fur et à mesure : envoi au responsable, retour, MAJ SAP, diffusion. Chaque étape renseignée fait progresser la ligne dans la vue de pilotage.
5. Ne pas modifier la version précédente. Sa date de fin est déduite automatiquement de la nouvelle.

### 4.2 Rituel hebdomadaire

Ouvrir l'onglet **À surveiller**, qui présente deux blocs :

- **Ce qui demande une relance** : fournisseurs dont l'échéance approche ou est dépassée. Traiter, puis tracer la relance dans l'historique du fournisseur avec une échéance.
- **Tarifs reçus, pas encore diffusés** : versions applicables ou imminentes sans diffusion. C'est le bloc à vider en priorité, un tarif applicable non diffusé coûtant de la marge chaque jour.

L'onglet **Actions** regroupe ensuite tout ce qui reste marqué à faire.

### 4.4 Clôturer un tarif sans information

Certains tarifs anciens ont été traités sans que la diffusion soit notée. Plutôt que de leur attribuer une diffusion qui n'a pas été constatée, l'outil propose la valeur **CLÔTURÉ SANS INFO**.

Le bouton **Clôturer**, présent sur chaque ligne du bloc des tarifs non diffusés, applique cette valeur en deux clics. La ligne sort de la liste, son état et son historique restent intacts, et la distinction demeure lisible : un tarif clôturé faute d'information ne sera jamais confondu avec un tarif effectivement diffusé.

La reprise de l'historique a appliqué cette valeur aux 33 tarifs antérieurs à 2026 dépourvus d'information de diffusion, avec la mention correspondante en commentaire. Les 34 tarifs de 2026 et 2027 restent ouverts : ce sont ceux sur lesquels il y a réellement quelque chose à faire.

### 4.3 Les deux modes de suivi

| Mode | Pour qui | À renseigner | Calcul de l'échéance |
|---|---|---|---|
| Échéance prévisible | National, BAN Teract | Date de prochaine révision | La date saisie |
| Surveillance ancienneté | Régionaux, envois subis | Périodicité en mois | Dernier tarif reçu plus périodicité |

L'import a placé tous les fournisseurs en surveillance ancienneté, aucune date de révision future ne figurant dans l'historique. Basculer au cas par cas les fournisseurs dont vous connaissez le calendrier.

---

## 5. Règles de gestion

- **Une version de tarif ne se corrige pas, elle se remplace par une nouvelle version.** L'historique est la valeur de l'outil.
- **Les dates de fin et les statuts ne sont jamais stockés.** La fin d'une version est déduite du début de la suivante, moins un jour. Le délai SAP est recalculé comme l'écart entre la MAJ SAP et la date d'application. Une seule vérité en base, donc aucune incohérence possible.
- **La fin de validité annoncée est une donnée distincte**, communiquée par le fournisseur. Elle est affichée à titre indicatif et ne se substitue pas à la fin déduite.
- **Les conditions commerciales sont indépendantes des tarifs** et suivent leur propre calendrier. Une remise qui change donne une nouvelle ligne, pas une modification de l'ancienne.
- **Le code fournisseur reprend celui de l'ERP.** Il peut être corrigé à tout moment sans casser les rattachements.

---

## 6. Import et export

### 6.1 Export

Onglet **Données**, quatre boutons CSV et une sauvegarde complète en JSON. Les fichiers sont en point-virgule avec BOM, donc directement lisibles par Excel. Les tables liées portent le code fournisseur, ce qui rend tout export réimportable.

### 6.2 Import

Le bouton **Télécharger le modèle** fournit les en-têtes exacts attendus pour la table choisie. Formats acceptés sans réglage particulier : dates en `jj/mm/aaaa` ou `aaaa-mm-jj`, décimales à la virgule ou au point, montants avec symbole et espaces.

Une colonne en trop est ignorée et signalée. Une colonne absente laisse la valeur vide.

### 6.3 Comportement en cas de réimport

| Table | Comportement |
|---|---|
| Fournisseurs | Mise à jour sur le code, pas de doublon |
| Tarifs, conditions, journal | Ajout systématique de lignes |

Un fichier de fournisseurs corrigé peut donc être réimporté autant de fois que nécessaire. Un fichier de tarifs importé deux fois créera des doublons.

---

## 7. Structure des données

| Table | Contenu |
|---|---|
| `fournisseurs` | Fiche signalétique et paramétrage du suivi |
| `tarifs` | Une ligne par version reçue, avec son circuit de traitement complet |
| `conditions` | Remises, RFA, franco, escomptes, avec leurs périodes |
| `journal` | Échanges, relances, décisions, suites à donner |

Colonnes de processus de la table `tarifs`, ajoutées par `schema_v2.sql` : état, fin de validité annoncée, évolutions achat, PC et PVGC, envoi et retour responsable, MAJ SAP, diffusion et date de diffusion, spécificités.

---

## 8. Sauvegarde et dépannage

### 8.1 Sauvegarde

Supabase assure des sauvegardes automatiques à rétention limitée sur le plan gratuit. Un export JSON trimestriel depuis l'onglet Données constitue une sécurité suffisante au vu du volume.

### 8.2 Messages d'erreur

| Message | Cause | Correction |
|---|---|---|
| Adresse non confirmée | Compte créé sans Auto Confirm User | Recréer l'utilisateur avec la case cochée |
| Connexion par email désactivée | Fournisseur Email coupé | Le réactiver, ne désactiver que les inscriptions |
| Projet injoignable | Page ouverte en local, ou réseau bloquant | Ouvrir l'adresse en `https` depuis GitHub Pages |
| Lecture des données impossible | Schéma non exécuté | Relancer `schema.sql` puis `schema_v2.sql` |
| Ce code fournisseur existe déjà | Code en doublon | Vérifier le code dans la fiche existante |
| Erreur 404 sur l'adresse | Nom de fichier ou casse incorrects | Respecter `Fournisseurs.html` exactement |

### 8.3 Réinitialiser le mot de passe

Dans le SQL Editor :

```sql
update auth.users
set encrypted_password = crypt('NouveauMotDePasse', gen_salt('bf'))
where email = 'votre.adresse@exemple.fr'
returning email, updated_at;
```

Une ligne renvoyée confirme la mise à jour. Pour fermer toutes les sessions ouvertes :

```sql
delete from auth.sessions where user_id = 'identifiant de l utilisateur';
```

Ne jamais supprimer l'utilisateur : d'autres applications du même projet Supabase peuvent y rattacher leurs données.
