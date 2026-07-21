# AGENTS.md - Documentation pour Codex

Ce fichier fournit un contexte spécifique pour Codex lors du travail sur ce projet.

## Vue d'ensemble du projet

**Kinklist** est une application web statique permettant de créer et partager une liste de préférences intimes (kinklist). Le projet met un accent particulier sur **l'accessibilité** et la **confidentialité**.

## Architecture technique

### Stack technologique
- **Frontend** : Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend** : Node.js 18+ avec Express
- **Stockage local** : LocalStorage pour la persistance navigateur
- **Stockage serveur** : Fichier JSON pour les liens partagés
- **Compression** : Pako (gzip) pour compatibilité liens legacy
- **Export image** : Canvas API avec fallback html2canvas
- **Génération d'ID** : nanoid (6 caractères alphanumériques)

### Fichiers principaux

```
Kinklist/
├── Frontend
│   ├── index.html          # Structure HTML sémantique avec ARIA
│   ├── style.css           # Styles avec système d'icônes accessibles
│   ├── script.js           # Logique applicative complète
│   ├── kinks-data.js       # Base de données de 350+ kinks
│   └── favicon.svg         # Favicon avec dégradé thématique
├── Backend
│   ├── server.js           # Serveur Express avec API REST
│   ├── package.json        # Dépendances Node.js
│   └── data/               # Stockage des liens partagés (JSON)
├── Docker
│   ├── Dockerfile          # Configuration Docker (Node.js)
│   ├── docker-compose.yml  # Orchestration avec volume
│   └── .dockerignore       # Fichiers exclus du build
└── Documentation
    ├── README.md           # Documentation utilisateur
    ├── AGENTS.md           # Documentation pour Codex
    └── WARP.md             # Directives pour WARP terminal
```

## Système de partage avec backend

### Liens ultra-courts avec API

Le système de partage utilise un **backend Node.js** pour générer des liens **garantis < 80 caractères** :

**Format court** : `#s/abc123` (~40 caractères total)
**Format legacy** : `#share=v2_...` (supporté en lecture seule pour rétrocompatibilité)

### Architecture backend

**Serveur** : `server.js` - Express avec routes API

**Endpoints** :
- `POST /api/share` : Créer un lien court
  - Body : `{ data: { selections: {...}, userInfo: {...}, roles: {...} } }`
  - Response : `{ id: "abc123", url: "https://.../#s/abc123" }`
- `GET /api/share/:id` : Récupérer les données
  - Response : `{ data: { selections: {...}, userInfo: {...}, roles: {...} } }`
- `GET /api/health` : Health check
- `GET /api/stats` : Statistiques (nombre de liens, accès)

**Génération d'ID** :
- Bibliothèque : `nanoid` avec alphabet alphanumeric
- Longueur : 6 caractères
- Espace de collision : 62^6 = ~56 milliards de combinaisons

**Stockage** :
- Fichier : `data/shares.json`
- Structure :
```json
{
  "abc123": {
    "data": { "selections": {...}, "userInfo": {...}, "roles": {...} },
    "createdAt": "2025-01-10T12:00:00.000Z",
    "accessCount": 5,
    "lastAccessedAt": "2025-01-11T15:30:00.000Z"
  }
}
```

### Code frontend clé

```javascript
// Génération (script.js)
async function generateShareLink() {
    // POST vers /api/share avec sélections + rôles
    // Récupère l'URL courte
    // Copie dans le presse-papier
}

// Chargement (script.js)
async function loadSharedData() {
    // Détecte format : #s/abc123 ou #share=v2_...
    // GET vers /api/share/:id pour format court
    // decodeAndDecompress() pour format legacy
    // handleSharedData() pour import avec rôles
}

// Rôles Donne/Reçois (script.js)
function toggleKinkRole(kinkId, role) {
    // Gère les 4 états : null, 'gives', 'receives', 'both'
    // Met à jour kinkRoles et l'UI
}

function encodeRole(role) { return map[role]; } // 'g', 'r', 'b'
function decodeRole(char) { return map[char]; } // inverse
```

## Système d'export image

### Canvas natif optimisé

L'export image utilise le Canvas API pour générer une image haute qualité :

**Caractéristiques** :
- Mise en page large (2400px) avec catégories en colonnes
- HiDPI support (scale 2.5x)
- Protection contre les limites de taille canvas (16384px)
- Fallback html2canvas si taille trop grande
- Design cohérent avec l'interface (dégradés, icônes)
- Légende étendue avec statuts + rôles (Donne/Reçois)
- Indicateurs de rôle (→ ←) dessinés à côté de chaque kink

**Code clé** : `exportKinklistAsImage()` (script.js)

## État de l'application

### Structure de données

```javascript
// État global
let kinkSelections = {
    "Catégorie::Kink": "status"  // ex: "BDSM & Domination::Bondage": "love"
};

let kinkRoles = {
    "Catégorie::Kink": "role"  // ex: "BDSM & Domination::Bondage": "gives"
};

// 6 types de statuts
const STATUS_TYPES = ['love', 'like', 'curious', 'maybe', 'no', 'limit'];

// 3 types de rôles (plus null/absent)
const ROLE_TYPES = ['gives', 'receives', 'both'];
```

### Gestion de la persistance

```javascript
// Sauvegarde automatique après chaque changement
function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kinkSelections));
}

function saveRolesToLocalStorage() {
    localStorage.setItem(ROLES_KEY, JSON.stringify(kinkRoles));
}

// Chargement au démarrage
function loadFromLocalStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) kinkSelections = JSON.parse(saved);
}

function loadRolesFromLocalStorage() {
    const saved = localStorage.getItem(ROLES_KEY);
    if (saved) kinkRoles = JSON.parse(saved);
}
```

## Accessibilité (priorité absolue)

### Système d'icônes daltonien

Chaque statut utilise une **forme géométrique distincte** + couleur :

| Statut | Forme | Couleur | Code |
|--------|-------|---------|------|
| J'adore | ● Cercle plein | Rose | `#ef4444` |
| J'aime | ■ Carré | Bleu | `#fdba74` |
| Curieux/se | ▲ Triangle | Orange | `#3b82f6` |
| Peut-être | ◆ Losange | Violet | `#06b6d4` |
| Non merci | ✕ Croix | Gris | `#525252` |
| Hard Limit | ★ Étoile | Noir | `#000000` |

Pour les rôles Donne/Reçois :
| Rôle | Symbole | Couleur | Code |
|------|---------|---------|------|
| Donne | → Flèche droite | Vert | `#10b981` |
| Reçois | ← Flèche gauche | Violet | `#8b5cf6` |

### Implémentation Canvas

Les icônes sont dessinées programmatiquement dans le canvas pour garantir la cohérence avec l'interface web. Les indicateurs de rôle (→ ←) sont dessinés à côté de chaque kink.

### Navigation clavier

- **Tab/Shift+Tab** : Navigation entre éléments
- **Enter/Espace** : Activation
- **1-6** : Sélection rapide des statuts quand focalisé

## Modifications récentes importantes

### 1. Fonctionnalité Donne/Reçois (v3.3.0)
- **Boutons de rôle** : → (Donne) et ← (Reçois) pour chaque kink
- **Stockage séparé** : `kinkRoles` dans `localStorage` (`kinklist-roles`)
- **Compression** : Rôles encodés comme suffixe du statut (rétro-compatible)
- **Export image** : Légende étendue + indicateurs dans le canvas
- **Tooltips** : Labels au survol des icônes de statut

### 2. Nettoyage liste de kinks (v3.3.0)
- Suppression des doublons (donner)/(recevoir)/(participer)
- "Golden shower", "Scat" fusionnés en entrées uniques
- "Gang bang (recevoir/participer)" supprimé (existe déjà dans autre catégorie)

### 3. Suppression du format legacy (Commit 41dd10f)
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
4. **LocalStorage keys** : `'kinklist-selections'`, `'kinklist-roles'` - changer casserait les données existantes
5. **Chars d'encodage** : Status (`l,k,c,m,n,h`) et rôles (`g,r,b`) ne se chevauchent pas

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

# Commit avec signature Codex
git commit -m "Message du commit

🤖 Generated with [Codex](https://Codex.com/Codex)

Co-Authored-By: Codex Sonnet 4.5 <noreply@anthropic.com>"
```

## Dépendances

### Backend (Node.js)
- **express** : Framework web minimaliste
- **cors** : Gestion des requêtes cross-origin
- **nanoid** : Génération d'ID courts sécurisés

### Frontend (CDN)
- **Pako** : Compression gzip pour compatibilité liens legacy
  - CDN : `https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js`
- **html2canvas** : Fallback export image (chargement dynamique si nécessaire)

## Contact et crédits

**Développeur** : EldaDev
- GitHub : [@eldayia](https://github.com/eldayia)
- Twitter : [@eldadev_](https://x.com/eldadev_) / [@eldayia](https://x.com/eldayia)

**Site** : https://kinklist.eldadev.fr

---

*Ce fichier est maintenu pour faciliter le travail de Codex sur ce projet. Il doit être mis à jour lors de changements architecturaux significatifs.*
