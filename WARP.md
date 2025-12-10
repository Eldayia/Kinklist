# WARP.md

Ce fichier fournit des directives à WARP (warp.dev) lors du travail avec le code dans ce dépôt.

## Vue d'ensemble du projet

**Kinklist** est une application web statique permettant de créer et partager une liste de préférences intimes (kinklist). Le projet met un accent particulier sur **l'accessibilité** (daltoniens, navigation clavier, lecteurs d'écran) et la **confidentialité** (100% local, aucun serveur).

### Stack technologique
- **Frontend** : Vanilla JavaScript (ES6+), HTML5, CSS3
- **Stockage** : LocalStorage pour la persistance locale
- **Compression** : Pako (gzip) pour les liens de partage
- **Export image** : Canvas API avec fallback html2canvas
- **Serveur** : Nginx (Alpine) via Docker

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

```
Kinklist/
├── index.html          # Structure HTML sémantique avec attributs ARIA
├── style.css           # Styles avec formes distinctes pour accessibilité daltonienne
├── script.js           # Logique de l'application (état, rendu, filtres, import/export)
├── kinks-data.js       # Base de données des 350+ kinks organisés en 18 catégories
├── favicon.svg         # Favicon avec dégradé thématique (cœur + accents chaînes)
├── Dockerfile          # Configuration Docker
├── docker-compose.yml  # Orchestration Docker
├── nginx.conf          # Configuration Nginx optimisée
├── .env.example        # Exemple de variables d'environnement
├── README.md           # Documentation utilisateur
├── Claude.md           # Documentation pour Claude Code
└── WARP.md             # Ce fichier - directives pour WARP
```

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

Le projet **priorise fortement l'accessibilité** pour les personnes daltoniennes et à mobilité réduite.

**Système d'icônes daltonien** - Chaque statut utilise une forme géométrique distincte + couleur :

- ● **Cercle plein** (rose #d81b60) - J'adore (love)
- ■ **Carré** (bleu #1e88e5) - J'aime (like)
- ▲ **Triangle** (orange #ffa726) - Curieux/se (curious)
- ◆ **Losange** (violet #9c27b0) - Peut-être (maybe)
- ✕ **Croix** (gris #757575) - Non merci (no)
- ★ **Étoile** (noir #000000) - Hard Limit (limit)

**Navigation clavier** :
- Tab/Shift+Tab : Navigation entre éléments
- Enter/Espace : Activation
- 1-6 : Sélection rapide des statuts quand focalisé

**Standards WCAG 2.1** :
- Attributs ARIA pour lecteurs d'écran
- Support de `prefers-reduced-motion` et `prefers-contrast`
- Contraste minimum AA
- Focus visible sur tous les éléments interactifs

### Système de partage innovant

Le système de partage utilise une **compression optimisée** pour générer des liens ultra-courts :

**Format v2** : `#share=v2_[base64-compressed-data]`

**Processus de compression** :
1. Indexation des kinks (numeric ID au lieu de strings)
2. Encodage des statuts en caractères uniques (l/k/c/m/n/h)
3. Format ultra-compact si tous les statuts sont identiques
4. Compression gzip avec pako
5. Encodage base64 URL-safe

**Résultat** : Un lien contenant 50+ sélections en ~100-150 caractères

**Fonctions clés** :
- `compressAndEncode(data)` : Compression (script.js:646-687)
- `decodeAndDecompress(encoded)` : Décompression avec support legacy (script.js:691-783)

### Export/Import

**Export JSON** :
- Format avec version, date et sélections
- Fusion ou remplacement lors de l'import

**Export image** :
- Utilise Canvas API natif pour générer une image haute qualité
- Mise en page large (1400px) avec catégories en colonnes
- HiDPI support (scale 2x)
- Protection contre limites de taille canvas (16384px)
- Fallback html2canvas si taille trop grande
- Design cohérent avec l'interface (dégradés, icônes)
- Fonction principale : `exportKinklistAsImage()` (script.js:293-542)

## Principes de développement

### 1. Accessibilité d'abord (priorité absolue)
Lors de modifications :
- **JAMAIS** sacrifier l'accessibilité pour l'esthétique
- **Toujours** maintenir les formes distinctes pour les icônes de statut
- **Toujours** préserver les attributs ARIA
- **Toujours** tester la navigation au clavier après chaque modification
- Contraste minimum WCAG 2.1 AA

### 2. Performance
- Minimiser les re-renders (rendu complet uniquement quand nécessaire)
- Compression maximale pour les liens de partage
- Images HiDPI mais taille contrôlée

### 3. Compatibilité
- Support format legacy en lecture (rétrocompatibilité)
- Fallbacks pour API modernes (clipboard, canvas)
- Responsive mobile-first

### 4. Confidentialité
- **Aucune donnée** n'est envoyée à un serveur
- Tout reste dans le navigateur (localStorage)
- Pas de tracking, analytics ou cookies

### 5. Langue
- **Interface en français** : tous les labels, messages et textes UI (public cible francophone)
- Code et commentaires peuvent être en français ou anglais
- Messages utilisateur toujours en français

### 6. Gestion des données
- Les clés kink suivent strictement le format `"Catégorie::Nom"`
- Ne jamais modifier directement localStorage sans passer par `saveToLocalStorage()`
- Préserver la compatibilité du format JSON pour l'import/export

### 7. Style de code
- Vanilla JavaScript (ES6+)
- Pas de dépendances externes (sauf pako et html2canvas)
- Code commenté pour la lisibilité
- Fonctions courtes et ciblées

### 8. Modifications du fichier kinks-data.js
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

## Modifications récentes importantes

### 1. Suppression du format legacy (Commit 41dd10f)
- **Avant** : Fallback vers format non compressé si pako échouait
- **Après** : Format v2 compressé uniquement, erreur explicite si pako absent
- **Raison** : Garantir des liens courts sur tous les appareils (mobile compris)

### 2. Bouton "Partager le site" (Commit e6d5bf2)
- Bouton dans le header copiant `https://kinklist.eldadev.fr`
- Permet de partager le site lui-même (sans sélections)
- Style glassmorphism avec backdrop-filter
- Responsive (pleine largeur sur mobile)

### 3. Favicon personnalisé (Commit e6d5bf2)
- Fichier SVG avec dégradé violet thématique
- Cœur stylisé + accents chaînes (thème BDSM discret)
- Format vectoriel (scalable)

### 4. Export image optimisé
- Mise en page en colonnes (2 catégories côte à côte)
- Format large optimisé pour Discord mobile
- Header et footer personnalisés avec crédits

## Points d'attention pour modifications

### ⚠️ Ne JAMAIS modifier sans réflexion

1. **Format des kink IDs** : `"Catégorie::Kink"` est le format standard, ne pas changer
2. **Formes des icônes** : Essentiel pour accessibilité daltonienne - TOUJOURS maintenir
3. **Compression des liens** : Format v2 est la référence, legacy en lecture seule
4. **LocalStorage key** : `'kinklist-selections'` - changer casserait les données existantes
5. **Icônes Canvas** : Dessinées programmatiquement (script.js:562-613) pour cohérence

### ✅ Zones d'amélioration possibles

1. **Ajout de kinks** : Modifier `kinks-data.js` en respectant la structure `{ "Catégorie": ["kink1", "kink2"] }`
2. **Styles CSS** : Améliorer sans toucher aux formes d'icônes
3. **Filtres** : Ajouter de nouveaux types de filtres (combinaisons, recherche avancée)
4. **Export** : Améliorer la mise en page de l'image exportée
5. **Traductions** : Ajouter support multilingue (actuellement français uniquement)
6. **Performance** : Optimiser le rendu pour grandes listes de sélections

## Dépendances externes

### Pako (compression) - ESSENTIEL
- **CDN** : `https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js`
- **Usage** : Compression gzip pour liens de partage v2
- **Critique** : Oui, système de partage ne fonctionne pas sans

### html2canvas - OPTIONNEL
- **Chargement** : Dynamique si nécessaire
- **Usage** : Fallback pour export image si canvas trop grand (>16384px)
- **Critique** : Non, fallback uniquement

## Contact et crédits

**Développeur** : EldaDev
- GitHub : [@eldayia](https://github.com/eldayia)
- Twitter : [@eldadev_](https://x.com/eldadev_) / [@eldayia](https://x.com/eldayia)

**Site en production** : https://kinklist.eldadev.fr

---

*Ce fichier doit être mis à jour lors de changements architecturaux significatifs.*
