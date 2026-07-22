# Kinklist - Liste de Préférences Accessible

Un site web moderne et accessible pour créer et partager votre kinklist (liste de préférences intimes).

## ✨ Caractéristiques

### 📋 Liste Complète
- **1 000+ kinks** organisés en **45 catégories** thématiques
- Catégories incluant : BDSM, Impact Play, Oral, Fluides, Public, Roleplay, Fétichisme, et plus

### ♿ Accessibilité pour Daltoniens
Le site utilise un système d'icônes avec **formes distinctes** pour garantir l'accessibilité aux personnes daltoniennes :

- **Cercle plein** (●) - J'adore
- **Carré** (■) - J'aime
- **Triangle** (▲) - Curieux/se
- **Losange** (◆) - Peut-être
- **Croix** (✕) - Non merci
- **Étoile** (★) - Hard Limit

Pour les rôles Donne/Reçois :
- **Flèche droite** (→) vert - Donne
- **Flèche gauche** (←) violet - Reçois

Chaque forme utilise également une couleur pour un double encodage, mais les formes seules suffisent à différencier les statuts. Les tooltips au survol affichent le label de chaque icône.

### 🎯 Fonctionnalités

- **Sélection intuitive** : Cliquez sur les icônes pour sélectionner votre niveau d'intérêt
- **Rôle Donne/Reçois** : Pour chaque kink, précisez si vous donnez, recevez, ou les deux (flèches → ← avec couleurs distinctes)
- **Tooltips** : Survolez une icône pour voir son label (J'adore, J'aime, etc.)
- **Recherche** : Trouvez rapidement des kinks spécifiques
- **Catégories détaillées** : Chaque catégorie possède un numéro stable et une courte description
- **Partage par lien** : Générez un lien court à identifiant aléatoire pour partager vos sélections et rôles
- **Export en image** : Exportez toute votre kinklist dans une seule image haute qualité, avec libellés complets et indicateurs de rôle (→ ←)
- **Bouton de partage du site** : Copiez facilement le lien du site depuis le header
- **Sauvegarde automatique** : Vos sélections et rôles sont enregistrés dans le navigateur
- **Compteurs** : Visualisez le nombre de sélections par catégorie
- **Responsive** : S'adapte à tous les écrans (mobile, tablette, desktop)

## 🚀 Utilisation

### Option 1 : Utilisation locale (sans Docker)

Installez les dépendances et lancez le serveur local :

```bash
npm install
npm start
```

Ouvrez ensuite `http://localhost:3000`. Le serveur est nécessaire pour créer et relire les liens courts. Si `index.html` est ouvert directement en `file://`, l'application tentera de joindre ce même serveur local et affichera une instruction explicite s'il n'est pas démarré.

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

L'application sera accessible sur `http://localhost:3000` (ou le port défini avec `HOST_PORT`).

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
| `HOST_PORT` | Port publié sur la machine hôte | `3000` |
| `NODE_ENV` | Active notamment HSTS et interdit les origines locales | `production` |
| `SHARE_TTL_DAYS` | Conservation des liens entre 1 et 365 jours; `0` désactive l'expiration | `30` |
| `ALLOWED_ORIGINS` | Origines CORS supplémentaires séparées par des virgules | `https://kink.eldayia.fr` |
| `STATS_TOKEN` | Bearer token protégeant `/api/stats`; route désactivée si vide | vide |
| `DATA_ENCRYPTION_KEY` | Secret de 32 caractères minimum pour chiffrer les partages; obligatoire en production | aucune |
| `DATA_DIR` | Répertoire du fichier de stockage JSON | `./data` |
| `TRUST_PROXY` | À activer uniquement derrière un reverse proxy de confiance | `false` |

**Exemple de fichier `.env` :**
```env
HOST_PORT=3000
NODE_ENV=production
SHARE_TTL_DAYS=30
ALLOWED_ORIGINS=https://kink.eldayia.fr
STATS_TOKEN=remplacez-moi-par-un-secret-long-et-aleatoire
DATA_ENCRYPTION_KEY=remplacez-moi-par-un-autre-secret-long-et-aleatoire
TRUST_PROXY=false
```

Générez les deux secrets séparément avec `openssl rand -hex 32`. N'enregistrez jamais votre fichier `.env` dans Git. Conservez impérativement `DATA_ENCRYPTION_KEY` avec vos sauvegardes : les partages chiffrés sont irrécupérables sans cette clé.

#### Architecture Docker

Le projet utilise :
- **Image de base** : `node:18-alpine` (légère et performante)
- **Serveur** : Node.js + Express servant à la fois l'API et les fichiers statiques
- **Port exposé** : 3000 dans le conteneur, publié par défaut sur le port 3000 de la machine hôte
- **Volume** : Persistance des liens partagés dans `/app/data`
- **Health check** : Vérifie automatiquement que l'API fonctionne (`/api/health`)
- **Restart policy** : Redémarre automatiquement en cas d'erreur
- **Isolation** : Utilisateur non-root, système de fichiers en lecture seule, capacités Linux supprimées

#### API Endpoints

Le backend expose les endpoints suivants :
- **POST `/api/share`** : Créer un lien court (body: `{data: {...}}`)
- **GET `/api/share/:id`** : Récupérer les données d'un lien court
- **GET `/api/health`** : Health check du serveur
- **GET `/api/stats`** : Statistiques globales, désactivées sans `STATS_TOKEN` et protégées par Bearer token

### Sélectionner vos préférences
1. Parcourez les catégories
2. Cliquez sur une icône pour sélectionner votre niveau d'intérêt
3. Cliquez à nouveau sur la même icône pour désélectionner

### Préciser le rôle (Donne/Reçois)
1. Pour chaque kink, deux flèches apparaissent à droite des icônes de statut
2. **→ (Donne)** : Vous donnez / vous êtes actif/ve
3. **← (Reçois)** : Vous recevez / vous êtes passif/ve
4. Cliquez sur les deux pour indiquer les deux rôles (switch)
5. Les rôles sont sauvegardés et inclus dans les liens partagés et exports image

### Rechercher
- Utilisez la barre de recherche pour trouver des kinks spécifiques

### Partager vos sélections
1. Cliquez sur "Partager" dans les contrôles
2. Un lien court sera copié dans votre presse-papier
3. Partagez ce lien avec d'autres personnes
4. Ils verront vos sélections et rôles, et pourront choisir de les importer

Le lien reprend automatiquement le domaine actuellement utilisé : par exemple `http://localhost:3000/#s/A1b2C3d4E5f6` en local ou `https://kink.eldayia.fr/#s/A1b2C3d4E5f6` en production. Aucun lien long de secours n'est généré si l'API est indisponible. Les rôles (Donne/Reçois) sont inclus dans les données partagées.

### Exporter en image
1. Cliquez sur "Exporter (Image)"
2. Une image JPEG unique de moins de 5 Mo sera téléchargée. Le nombre de colonnes s'adapte au contenu et les noms longs reviennent à la ligne sans être tronqués
3. Format optimisé pour Discord, Twitter et autres réseaux sociaux
4. Mise en page professionnelle avec catégories en colonnes
5. Les indicateurs de rôle (→ ←) sont inclus à côté de chaque kink

### Partager le site
Cliquez sur "Partager le site" dans le header pour copier le lien https://kink.eldayia.fr (sans vos sélections personnelles)

## 🧪 Outils de test développeur

Une commande privée permet de remplir automatiquement l'intégralité de la kinklist afin de tester la recherche, le partage et la génération d'image sans sélectionner manuellement chaque kink.

Ouvrez la console du navigateur avec `F12`, puis utilisez :

```javascript
// Remplir tous les kinks avec des statuts et rôles variés
window.__eldaKinkTest.fill()

// Utiliser une autre répartition reproductible grâce à une graine numérique
window.__eldaKinkTest.fill(12345)

// Remplir la liste et ajouter également un profil personnel fictif
window.__eldaKinkTest.fill(12345, true)

// Restaurer la liste présente avant le lancement du test
window.__eldaKinkTest.restore()
```

La première exécution de `fill()` sauvegarde automatiquement les sélections, rôles et informations personnelles actuels dans le stockage local. Les exécutions suivantes conservent cette sauvegarde d'origine. `restore()` restaure les données sauvegardées puis supprime la sauvegarde de test.

La commande utilise par défaut une graine fixe afin de produire une répartition stable des six statuts et des quatre états de rôle : Donne, Reçoit, les deux ou aucun.

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

### Backend
- **Node.js 18+** avec Express
- **nanoid** pour génération d'ID courts
- Stockage JSON (évolutif vers BDD si nécessaire)
- API REST avec CORS limité aux origines autorisées
- Validation stricte des données, limitation du débit et taille maximale des requêtes
- En-têtes CSP/HSTS/anti-clickjacking et fichiers publics explicitement autorisés
- Écriture sérialisée et permissions privées (`0700`/`0600`) pour le stockage JSON
- Chiffrement authentifié AES-256-GCM en production; les identifiants de liens ne sont pas stockés en clair

## 🔒 Confidentialité

- **Données locales** : Vos sélections restent dans votre navigateur tant que vous ne créez pas de lien de partage
- **Partage optionnel** : Créer un lien envoie les sélections, rôles et informations personnelles renseignées au serveur
- **Expiration** : Les partages expirent après 30 jours par défaut. Utilisez `SHARE_TTL_DAYS=0` pour les conserver sans limite de durée
- **Aucun tracking** : Pas de cookies ou d'analytics
- **Pas de compte** : Aucune authentification requise
- **Minimisation** : Les champs vides et les rôles sans sélection associée ne sont pas conservés dans un partage

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

**Format** : `https://kink.eldayia.fr/#s/A1b2C3d4E5f6`

**Processus** :
1. Le frontend envoie les sélections au backend via API REST
2. Le backend valide les données et génère un ID aléatoire de 12 caractères alphanumériques
3. Les données sont stockées côté serveur dans un fichier JSON privé et expirent automatiquement
4. Le lien court est généré et copié dans le presse-papier

**Résultat** : Un lien de **moins de 80 caractères** garanti, quelle que soit la taille de votre liste ! 🎉

### Architecture technique

- **Backend** : Node.js + Express
- **Génération d'ID** : nanoid (12 caractères, environ 71 bits d'entropie)
- **Stockage** : Fichier JSON privé avec expiration, date et compteur d'accès
- **API** : `/api/share` (POST) et `/api/share/:id` (GET)

### Compatibilité

- **Format court** : `#s/A1b2C3d4E5f6`
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
