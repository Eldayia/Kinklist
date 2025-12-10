# Kinklist - Liste de Préférences Accessible

Un site web moderne et accessible pour créer et partager votre kinklist (liste de préférences intimes).

## ✨ Caractéristiques

### 📋 Liste Complète
- **350+ kinks** organisés en **17 catégories** thématiques
- Catégories incluant : BDSM, Impact Play, Oral, Fluides, Public, Roleplay, Fétichisme, et plus

### ♿ Accessibilité pour Daltoniens
Le site utilise un système d'icônes avec **formes distinctes** pour garantir l'accessibilité aux personnes daltoniennes :

- **Cercle plein** (●) - J'adore
- **Carré** (■) - J'aime
- **Triangle** (▲) - Curieux/se
- **Losange** (◆) - Peut-être
- **Croix** (✕) - Non merci
- **Étoile** (★) - Hard Limit

Chaque forme utilise également une couleur pour un double encodage, mais les formes seules suffisent à différencier les statuts.

### 🎯 Fonctionnalités

- **Sélection intuitive** : Cliquez sur les icônes pour sélectionner votre niveau d'intérêt
- **Recherche** : Trouvez rapidement des kinks spécifiques
- **Filtres** :
  - Par catégorie
  - Par statut de sélection
  - Combinaison des filtres
- **Partage par lien** : Générez un lien court optimisé pour partager vos sélections (compression gzip)
- **Export en image** : Exportez votre kinklist en image haute qualité pour Discord, Twitter, etc.
- **Bouton de partage du site** : Copiez facilement le lien du site depuis le header
- **Sauvegarde automatique** : Vos sélections sont enregistrées dans le navigateur
- **Compteurs** : Visualisez le nombre de sélections par catégorie
- **Responsive** : S'adapte à tous les écrans (mobile, tablette, desktop)

## 🚀 Utilisation

### Option 1 : Utilisation locale (sans Docker)
Ouvrez simplement `index.html` dans votre navigateur web.

### Option 2 : Déploiement avec Docker 🐳

#### Prérequis
- Docker installé sur votre système
- Docker Compose installé (inclus avec Docker Desktop)

#### Configuration rapide

1. **Cloner le dépôt**
```bash
git clone <votre-repo>
cd Kinklist
```

2. **Configuration des variables d'environnement (optionnel)**
```bash
cp .env.example .env
# Éditez le fichier .env pour personnaliser le port
```

3. **Lancer l'application avec Docker Compose**
```bash
docker-compose up -d
```

L'application sera accessible sur `http://localhost:8080` (ou le port que vous avez configuré).

#### Commandes Docker utiles

**Démarrer l'application**
```bash
docker-compose up -d
```

**Arrêter l'application**
```bash
docker-compose down
```

**Voir les logs**
```bash
docker-compose logs -f
```

**Reconstruire l'image après modifications**
```bash
docker-compose up -d --build
```

**Vérifier le statut**
```bash
docker-compose ps
```

#### Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `PORT` | Port d'écoute sur la machine hôte | `8080` |
| `NGINX_HOST` | Nom d'hôte nginx | `localhost` |

**Exemple de fichier `.env` :**
```env
PORT=8080
NGINX_HOST=localhost
```

#### Architecture Docker

Le projet utilise :
- **Image de base** : `node:18-alpine` (légère et performante)
- **Serveur** : Node.js + Express servant à la fois l'API et les fichiers statiques
- **Port exposé** : 3000 (mappé sur le port configuré, par défaut 8080)
- **Volume** : Persistance des liens partagés dans `/app/data`
- **Health check** : Vérifie automatiquement que l'API fonctionne (`/api/health`)
- **Restart policy** : Redémarre automatiquement en cas d'erreur

#### API Endpoints

Le backend expose les endpoints suivants :
- **POST `/api/share`** : Créer un lien court (body: `{data: {...}}`)
- **GET `/api/share/:id`** : Récupérer les données d'un lien court
- **GET `/api/health`** : Health check du serveur
- **GET `/api/stats`** : Statistiques globales (optionnel)

### Sélectionner vos préférences
1. Parcourez les catégories
2. Cliquez sur une icône pour sélectionner votre niveau d'intérêt
3. Cliquez à nouveau sur la même icône pour désélectionner

### Rechercher et filtrer
- Utilisez la barre de recherche pour trouver des kinks spécifiques
- Sélectionnez une catégorie dans le menu déroulant
- Filtrez par statut pour voir uniquement vos sélections

### Partager vos sélections
1. Cliquez sur "Partager" dans les contrôles
2. Un lien court sera copié dans votre presse-papier
3. Partagez ce lien avec d'autres personnes
4. Ils verront vos sélections et pourront choisir de les importer

**Note** : Les liens sont ultra-compacts grâce à la compression gzip (format v2) !

### Exporter en image
1. Cliquez sur "Exporter (Image)"
2. Une image PNG haute qualité sera téléchargée
3. Format optimisé pour Discord, Twitter et autres réseaux sociaux
4. Mise en page professionnelle avec catégories en colonnes

### Partager le site
Cliquez sur "Partager le site" dans le header pour copier le lien https://kinklist.eldadev.fr (sans vos sélections personnelles)

## 🎨 Accessibilité

Le site respecte les standards WCAG 2.1 :

- ✅ Contraste élevé pour la lisibilité
- ✅ Navigation au clavier complète
- ✅ Attributs ARIA pour les lecteurs d'écran
- ✅ Formes distinctes pour l'accessibilité daltonienne
- ✅ Support de `prefers-reduced-motion`
- ✅ Support de `prefers-contrast`
- ✅ Focus visible sur tous les éléments interactifs

### Navigation au clavier
- **Tab** : Naviguer entre les éléments
- **Entrée/Espace** : Activer un bouton ou une icône
- **1-6** : Sélection rapide quand une icône est focalisée

## 📁 Structure du projet

```
Kinklist/
├── index.html          # Structure HTML du site
├── style.css           # Styles et icônes accessibles
├── script.js           # Logique interactive
├── kinks-data.js       # Base de données des kinks
├── favicon.svg         # Favicon personnalisé avec dégradé thématique
├── Dockerfile          # Configuration Docker
├── docker-compose.yml  # Orchestration Docker
├── nginx.conf          # Configuration Nginx
├── .dockerignore       # Fichiers exclus du build Docker
├── .env.example        # Exemple de variables d'environnement
├── README.md           # Documentation utilisateur
├── Claude.md           # Documentation pour Claude Code
└── WARP.md             # Directives pour WARP terminal
```

## 🛠️ Technologies

### Frontend
- HTML5 sémantique
- CSS3 (Grid, Flexbox, Custom Properties)
- JavaScript Vanilla (ES6+)
- LocalStorage pour la persistance locale
- Canvas API pour l'export en image (avec fallback html2canvas)
- **Pako** (gzip) pour compatibilité liens legacy

### Backend
- **Node.js 18+** avec Express
- **nanoid** pour génération d'ID courts
- Stockage JSON (évolutif vers BDD si nécessaire)
- API REST avec CORS

## 🔒 Confidentialité

- **Données locales** : Vos sélections restent dans votre navigateur (localStorage)
- **Partage optionnel** : Les liens de partage stockent les données côté serveur uniquement si vous partagez
- **Aucun tracking** : Pas de cookies ou d'analytics
- **Pas de compte** : Aucune authentification requise
- **Données anonymes** : Aucune information personnelle n'est collectée

## 🌈 Catégories disponibles

1. BDSM & Domination
2. Impact Play
3. Sensation & Température
4. Oral & Pénétration
5. Fluides & Liquides
6. Sexe en Public & Exhibition
7. Roleplay & Fantasmes
8. Partenaires Multiples
9. Fétichisme
10. Humiliation & Dégradation
11. Jeu Mental & Psychologique
12. Médical & Body Mod
13. Restrictions & Contrôle
14. Romance & Intimité
15. Extrême & Edge Play
16. Technologie & Moderne
17. Situations & Contextes
18. Communication & Consentement

## 💡 Conseils d'utilisation

- **Soyez honnête** : Cette liste est pour vous et vos partenaires
- **Revisitez régulièrement** : Vos préférences peuvent évoluer
- **Communiquez** : Utilisez cette liste comme point de départ pour des discussions
- **Respectez les limites** : Les "Hard Limits" doivent toujours être respectés
- **Explorez** : La catégorie "Curieux/se" est là pour découvrir de nouvelles choses

## 🔗 Système de partage par lien

### Liens ultra-courts avec backend API

Les liens de partage utilisent un **backend Node.js** pour générer des URLs ultra-courtes :

**Format** : `https://kinklist.eldadev.fr/#s/abc123` (~40 caractères !)

**Processus** :
1. Le frontend envoie les sélections au backend via API REST
2. Le backend génère un ID unique de 6 caractères alphanumériques
3. Les données sont stockées côté serveur (fichier JSON)
4. Le lien court est généré et copié dans le presse-papier

**Résultat** : Un lien de **moins de 80 caractères** garanti, quelle que soit la taille de votre liste ! 🎉

### Architecture technique

- **Backend** : Node.js + Express
- **Génération d'ID** : nanoid (6 caractères)
- **Stockage** : Fichier JSON avec métadonnées (date, compteur d'accès)
- **API** : `/api/share` (POST) et `/api/share/:id` (GET)

### Compatibilité

- **Format court** : `#s/abc123` (nouveau système avec backend)
- **Format legacy** : `#share=v2_...` (ancien système compressé, toujours supporté en lecture)
- **Mobile** : Optimisé pour tous les appareils

## 🤝 Contribution

Ce projet est open source. N'hésitez pas à :
- Suggérer de nouveaux kinks
- Améliorer l'accessibilité
- Proposer de nouvelles fonctionnalités
- Corriger des bugs

## ⚠️ Avertissement

Ce site est destiné à un public adulte et averti. Il traite de sujets sexuels explicites.

**Principe fondamental** : Tout doit être :
- **Consensuel** : Tous les participants doivent consentir
- **Sûr** : Pratiquer en sécurité avec communication
- **Sain** : Respecter les limites physiques et mentales

## 📜 Licence

Ce projet est sous licence MIT. Libre d'utilisation, modification et distribution.

---

Fait avec ❤️ pour une communauté inclusive et respectueuse
