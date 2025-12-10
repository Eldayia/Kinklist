# Utiliser l'image Node.js Alpine pour un container léger
FROM node:18-alpine

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances de production uniquement
RUN npm ci --only=production

# Copier tous les fichiers de l'application
COPY . .

# Créer le dossier data pour le stockage
RUN mkdir -p data && chmod 755 data

# Exposer le port 3000
EXPOSE 3000

# Healthcheck pour vérifier que l'API fonctionne
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Démarrer le serveur Node.js
CMD ["node", "server.js"]
