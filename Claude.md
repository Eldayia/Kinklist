# Claude.md - Documentation pour Claude Code

Ce fichier fournit un contexte spécifique pour Claude Code lors du travail sur ce projet.

## Vue d'ensemble du projet

**Kinklist** est une application web statique permettant de créer et partager une liste de préférences intimes (kinklist). Le projet met un accent particulier sur **l'accessibilité** et la **confidentialité**.

## Architecture technique

### Stack technologique
- **Frontend** : Vanilla JavaScript (ES6+), HTML5, CSS3
- **Stockage** : LocalStorage pour la persistance locale
- **Compression** : Pako (gzip) pour les liens de partage
- **Export image** : Canvas API avec fallback html2canvas
- **Serveur** : Nginx (Alpine) via Docker

### Fichiers principaux

```
Kinklist/
├── index.html          # Structure HTML sémantique avec ARIA
├── style.css           # Styles avec système d'icônes accessibles
├── script.js           # Logique applicative complète
├── kinks-data.js       # Base de données de 350+ kinks
├── favicon.svg         # Favicon avec dégradé thématique
├── Dockerfile          # Configuration Docker
├── docker-compose.yml  # Orchestration
├── nginx.conf          # Config Nginx optimisée
└── README.md           # Documentation utilisateur
```

## Système de partage innovant

### Format de lien compressé (v2)

Le système de partage utilise une compression optimisée pour générer des **liens ultra-courts** :

**Format** : `#share=v2_[base64-compressed-data]`

**Processus de compression** :
1. Indexation des kinks (numeric ID au lieu de strings)
2. Encodage des statuts en caractères uniques (l/k/c/m/n/h)
3. Format ultra-compact si tous les statuts sont identiques
4. Compression gzip avec pako
5. Encodage base64 URL-safe

**Exemple** : Un lien partagé peut contenir 50+ sélections en ~100 caractères.

### Code clé

```javascript
// Compression (script.js:646-687)
function compressAndEncode(data) {
    // Convertit les sélections en format compact indexé
    // Utilise pako.deflate() pour compression gzip
    // Génère un lien court avec préfixe v2_
}

// Décompression (script.js:691-783)
function decodeAndDecompress(encoded) {
    // Supporte format v2 (compressé) et legacy (rétrocompatibilité)
    // Utilise pako.inflate() pour décompression
}
```

## Système d'export image

### Canvas natif optimisé

L'export image utilise le Canvas API pour générer une image haute qualité :

**Caractéristiques** :
- Mise en page large (1400px) avec catégories en colonnes
- HiDPI support (scale 2x)
- Protection contre les limites de taille canvas (16384px)
- Fallback html2canvas si taille trop grande
- Design cohérent avec l'interface (dégradés, icônes)

**Code clé** : `exportKinklistAsImage()` (script.js:293-542)

## État de l'application

### Structure de données

```javascript
// État global
let kinkSelections = {
    "Catégorie::Kink": "status"  // ex: "BDSM & Domination::Bondage": "love"
};

// 6 types de statuts
const STATUS_TYPES = ['love', 'like', 'curious', 'maybe', 'no', 'limit'];
```

### Gestion de la persistance

```javascript
// Sauvegarde automatique après chaque changement
function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kinkSelections));
}

// Chargement au démarrage
function loadFromLocalStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) kinkSelections = JSON.parse(saved);
}
```

## Accessibilité (priorité absolue)

### Système d'icônes daltonien

Chaque statut utilise une **forme géométrique distincte** + couleur :

| Statut | Forme | Couleur | Code |
|--------|-------|---------|------|
| J'adore | ● Cercle plein | Rose | `#d81b60` |
| J'aime | ■ Carré | Bleu | `#1e88e5` |
| Curieux/se | ▲ Triangle | Orange | `#ffa726` |
| Peut-être | ◆ Losange | Violet | `#9c27b0` |
| Non merci | ✕ Croix | Gris | `#757575` |
| Hard Limit | ★ Étoile | Noir | `#000000` |

### Implémentation Canvas

Les icônes sont dessinées programmatiquement dans le canvas (script.js:562-613) pour garantir la cohérence avec l'interface web.

### Navigation clavier

- **Tab/Shift+Tab** : Navigation entre éléments
- **Enter/Espace** : Activation
- **1-6** : Sélection rapide des statuts quand focalisé

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

### 4. Export image optimisé (Commits précédents)
- Mise en page en colonnes (2 catégories côte à côte)
- Format large optimisé pour Discord mobile
- Header et footer personnalisés avec crédits

## Principes de développement

### 1. Accessibilité d'abord
- **JAMAIS** sacrifier l'accessibilité pour l'esthétique
- Toujours maintenir les formes distinctes des icônes
- Tester la navigation clavier après chaque modification
- Préserver tous les attributs ARIA

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
- Interface en français (public cible francophone)
- Code et commentaires peuvent être en français ou anglais
- Messages utilisateur toujours en français

## Points d'attention pour modifications futures

### ⚠️ Ne pas modifier sans réflexion

1. **Format des kink IDs** : `"Catégorie::Kink"` est le format standard, ne pas changer
2. **Formes des icônes** : Essentiel pour accessibilité daltonienne
3. **Compression des liens** : Format v2 est la référence, legacy en lecture seule
4. **LocalStorage key** : `'kinklist-selections'` - changer casserait les données existantes

### ✅ Zones d'amélioration possibles

1. **Ajout de kinks** : Modifier `kinks-data.js` en respectant la structure
2. **Styles** : Améliorer CSS sans toucher aux formes d'icônes
3. **Filtres** : Ajouter de nouveaux types de filtres
4. **Export** : Améliorer la mise en page de l'image exportée
5. **Traductions** : Ajouter support multilingue

## Commandes utiles

### Développement local
```bash
# Serveur HTTP simple
python -m http.server 8080

# Ou avec Node.js
npx http-server -p 8080
```

### Docker
```bash
# Lancer
docker-compose up -d

# Logs
docker-compose logs -f

# Rebuild
docker-compose up -d --build
```

### Git
```bash
# Voir les modifications
git status
git diff

# Commit avec signature Claude
git commit -m "Message du commit

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

## Dépendances externes

### Pako (compression)
- **CDN** : `https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js`
- **Usage** : Compression gzip pour liens de partage
- **Essentiel** : Oui, pour le système de partage v2

### html2canvas (optionnel)
- **Chargement** : Dynamique si nécessaire
- **Usage** : Fallback pour export image si canvas trop grand
- **Essentiel** : Non, fallback uniquement

## Contact et crédits

**Développeur** : EldaDev
- GitHub : [@eldayia](https://github.com/eldayia)
- Twitter : [@eldadev_](https://x.com/eldadev_) / [@eldayia](https://x.com/eldayia)

**Site** : https://kinklist.eldadev.fr

---

*Ce fichier est maintenu pour faciliter le travail de Claude Code sur ce projet. Il doit être mis à jour lors de changements architecturaux significatifs.*
