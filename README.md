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
- **Image de base** : `nginx:alpine` (légère et optimisée)
- **Serveur web** : Nginx pour servir les fichiers statiques
- **Port exposé** : 80 (mappé sur le port configuré)
- **Health check** : Vérifie automatiquement que l'application fonctionne
- **Restart policy** : Redémarre automatiquement en cas d'erreur

#### Configuration avancée

Pour modifier la configuration nginx, éditez le fichier `nginx.conf`. La configuration inclut :
- Headers de sécurité (X-Frame-Options, X-Content-Type-Options, etc.)
- Compression gzip pour optimiser les performances
- Cache des assets statiques
- Configuration optimisée pour les applications SPA

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

- HTML5 sémantique
- CSS3 (Grid, Flexbox, Custom Properties)
- JavaScript Vanilla (ES6+)
- LocalStorage pour la persistance
- **Pako** (gzip) pour la compression des liens de partage
- Canvas API pour l'export en image (avec fallback html2canvas)

## 🔒 Confidentialité

- **100% local** : Toutes les données restent dans votre navigateur
- **Aucun serveur** : Pas de transmission de données
- **Aucun tracking** : Pas de cookies ou d'analytics
- **Vos données vous appartiennent** : Export/import en JSON

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

### Format de lien optimisé (v2)

Les liens de partage utilisent une compression avancée pour générer des URLs ultra-courtes :

**Format** : `https://kinklist.eldadev.fr/#share=v2_[données-compressées]`

**Processus** :
1. Indexation numérique des kinks (au lieu de chaînes complètes)
2. Encodage compact des statuts (`l`=love, `k`=like, `c`=curious, `m`=maybe, `n`=no, `h`=limit)
3. Compression gzip avec pako
4. Encodage base64 URL-safe

**Résultat** : Un lien contenant 50+ sélections en ~100-150 caractères ! 🎉

### Compatibilité

- **Format v2** : Utilisé par défaut (compression maximale)
- **Format legacy** : Supporté en lecture pour rétrocompatibilité
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
