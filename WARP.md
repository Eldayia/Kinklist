# WARP.md

Ce fichier fournit des directives à WARP (warp.dev) lors du travail avec le code dans ce dépôt.

## Commandes courantes

### Développement local
```bash
# Ouvrir le site localement (sans serveur)
# Ouvrir simplement index.html dans un navigateur

# Ou utiliser un serveur HTTP local Python
python -m http.server 8000

# Ou avec Node.js (si http-server est installé)
npx http-server -p 8080
```

### Docker
```bash
# Démarrer l'application
docker-compose up -d

# Arrêter l'application
docker-compose down

# Voir les logs en temps réel
docker-compose logs -f

# Reconstruire après modifications
docker-compose up -d --build

# Vérifier le statut
docker-compose ps
```

### Tests et validation
```bash
# Vérifier la santé du container
docker-compose ps

# Accéder au site en local
# http://localhost:8080 (ou le port configuré dans .env)
```

## Architecture du projet

### Structure globale
Il s'agit d'une **application web statique** (Vanilla JavaScript, pas de framework) avec un focus sur l'**accessibilité** (daltoniens, navigation clavier, lecteurs d'écran).

### Fichiers principaux

- **index.html** : Structure HTML sémantique avec attributs ARIA
- **style.css** : Styles avec formes distinctes pour chaque statut (cercle, carré, triangle, losange, croix, étoile) pour l'accessibilité daltonienne
- **script.js** : Logique de l'application (état, rendu, filtres, import/export)
- **kinks-data.js** : Base de données des 350+ kinks organisés en 18 catégories

### Système de gestion d'état

L'application utilise un **state management simple** basé sur:
- **localStorage** pour la persistance (`STORAGE_KEY = 'kinklist-selections'`)
- Objet JavaScript `kinkSelections` : `{ "Catégorie::Kink": "status" }`
- 6 types de statuts : `['love', 'like', 'curious', 'maybe', 'no', 'limit']`

### Système d'identifiants
Les kinks sont identifiés par la clé : `"${category}::${kink}"` (ex: `"BDSM & Domination::Bondage (léger)"`)

### Rendu et filtrage
- Fonction centrale `renderKinklist(filterCategory, filterStatus, searchTerm)`
- Rendu complet à chaque changement (pas de DOM virtuel)
- Filtres applicables : catégorie, statut, recherche textuelle

### Accessibilité
Le projet **priorise fortement l'accessibilité** :
- **Formes distinctes** pour chaque statut (● ■ ▲ ◆ ✕ ★) en plus des couleurs
- Navigation clavier complète (Tab, Enter, Espace, raccourcis 1-6)
- Attributs ARIA pour lecteurs d'écran
- Support de `prefers-reduced-motion` et `prefers-contrast`

### Export/Import
- Format JSON avec version, date et sélections
- Option d'export image (utilise html2canvas.js)
- Fusion ou remplacement lors de l'import

## Principes de développement

### Langue
- **Interface en français** : tous les labels, messages et textes UI
- Commentaires de code peuvent être en français ou anglais

### Accessibilité (priorité absolue)
Lors de modifications :
- **Toujours** maintenir les formes distinctes pour les icônes de statut
- **Toujours** préserver les attributs ARIA
- **Toujours** tester la navigation au clavier
- Contraste minimum WCAG 2.1 AA

### Gestion des données
- Les clés kink suivent strictement le format `"Catégorie::Nom"`
- Ne jamais modifier directement localStorage sans passer par `saveToLocalStorage()`
- Préserver la compatibilité du format JSON pour l'import/export

### Style de code
- Vanilla JavaScript (ES6+)
- Pas de dépendances externes (sauf html2canvas pour export image)
- Code commenté pour la lisibilité
- Fonctions courtes et ciblées

### Modifications du fichier kinks-data.js
Si vous ajoutez des catégories ou kinks :
- Respecter la structure existante `{ "Catégorie": ["kink1", "kink2"] }`
- Les catégories doivent être des clés uniques
- Les kinks dans une catégorie doivent être uniques
- Mettre à jour la documentation du README si nécessaire

## Configuration Docker

### Variables d'environnement
Fichier `.env` (créer à partir de `.env.example`) :
```
PORT=8080              # Port d'écoute sur l'hôte
NGINX_HOST=localhost   # Nom d'hôte nginx
```

### Architecture
- Image : `nginx:alpine` (légère)
- Health check : vérification automatique toutes les 30s
- Restart policy : `unless-stopped`

### Modification de nginx.conf
Le fichier contient :
- Headers de sécurité (X-Frame-Options, CSP, etc.)
- Compression gzip pour performance
- Cache des assets statiques
- Configuration optimisée pour SPA
