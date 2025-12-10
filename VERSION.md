# Gestion des versions

## Version actuelle : 2.0.0

### Système de cache-busting

Le projet utilise deux mécanismes pour éviter les problèmes de cache :

1. **Headers HTTP** (server.js) :
   - JS/CSS : `no-cache, no-store, must-revalidate`
   - HTML : `no-cache, must-revalidate`
   - Assets : cache 24h

2. **Versioning des fichiers** (index.html) :
   - `style.css?v=2.0.0`
   - `script.js?v=2.0.0`
   - `kinks-data.js?v=2.0.0`

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
   <link rel="stylesheet" href="style.css?v=2.1.0">
   <script src="kinks-data.js?v=2.1.0"></script>
   <script src="script.js?v=2.1.0"></script>
   ```

3. Mettre à jour ce fichier (VERSION.md)

4. Commit et push :
   ```bash
   git commit -am "Bump version to 2.1.0"
   git push
   ```

5. Sur le serveur :
   ```bash
   git pull
   docker-compose restart
   ```

## Historique des versions

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
