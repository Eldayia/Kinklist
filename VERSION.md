# Gestion des versions

## Version actuelle : 3.3.0

### Système de cache-busting

Le projet utilise deux mécanismes pour éviter les problèmes de cache :

1. **Headers HTTP** (server.js) :
   - JS/CSS : `no-cache, no-store, must-revalidate`
   - HTML : `no-cache, must-revalidate`
   - Assets : cache 24h

2. **Versioning des fichiers** (index.html) :
   - `style.css?v=3.3.0`
   - `script.js?v=3.3.0`
   - `kinks-data.js?v=3.3.0`

## Quand mettre à jour la version ?

Mettre à jour le numéro de version dans **index.html** après :
- Modifications du JavaScript (script.js, kinks-data.js)
- Modifications du CSS (style.css)
- Changements majeurs de fonctionnalités

## Comment mettre à jour

1. Incrémenter le numéro de version selon [Semantic Versioning](https://semver.org/) :
   - **MAJOR** (X.0.0) : Changements incompatibles
   - **MINOR** (0.X.0) : Nouvelles fonctionnalités compatibles
   - **PATCH** (0.0.X) : Corrections de bugs

2. Mettre à jour dans `index.html` :
   ```html
   <link rel="stylesheet" href="style.css?v=3.3.0">
   <script src="kinks-data.js?v=3.3.0"></script>
   <script src="script.js?v=3.3.0"></script>
   ```

3. Mettre à jour ce fichier (VERSION.md)

4. Commit et push :
   ```bash
   git commit -am "Bump version to 3.3.0"
   git push
   ```

5. Sur le serveur :
   ```bash
   git pull
   docker-compose restart
   ```

## Historique des versions

### 3.3.0 (2026-07-20)
- **Nouvelle fonctionnalité** : Boutons Donne/Reçois (→ ←) pour chaque kink
  - Flèche droite verte (→) pour "Donne"
  - Flèche gauche violette (←) pour "Reçois"
  - Les deux activables simultanément (les deux rôles)
  - Rôle sauvegardé dans localStorage (`kinklist-roles`)
  - Inclus dans les liens partagés (compression avec rétrocompatibilité)
  - Inclus dans l'export image (légende + indicateurs)
- **Nettoyage de la liste de kinks** :
  - "Golden shower (donner/recevoir)" → "Golden shower"
  - "Scat (donner/recevoir)" → "Scat"
  - Suppression de "Gang bang (recevoir/participer)" (doublon avec "Gang bang" existant)
- **Améliorations UI** :
  - Icône J'adore correctement ronde dans la liste (correction CSS)
  - Tooltips au survol des icônes de statut (J'adore, J'aime, etc.)
  - Séparateur visuel entre statuts et rôles dans la légende

### 3.2.0
- Favicon personnalisé (SVG avec dégradé thématique)
- Bouton "Partager le site" dans le header
- Export image optimisé (mise en page en colonnes)

### 3.1.0
- Migration vers backend Node.js + Express
- Système de liens ultra-courts (<80 caractères)
- Génération d'ID avec nanoid

### 3.0.0
- Refonte complète de l'interface
- Système d'icônes daltonien (formes distinctes)
- Export image Canvas natif

### 2.0.0 (2025-12-10)
- Ajout backend Node.js avec API REST
- Système de liens ultra-courts (<80 caractères)
- Génération d'ID avec nanoid
- Fallback automatique vers format legacy
- Headers HTTP pour gestion du cache

### 1.0.0 (Précédent)
- Version initiale avec nginx
- Système de partage compressé (format v2)
- Export image haute qualité
- Accessibilité daltoniens
